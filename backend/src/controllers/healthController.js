import { env } from "../config/env.js";
import { getDatabaseStatus } from "../config/database.js";
import { fetchAiEngineHealth, fetchLlmStatus, verifyLlmConnection, fetchProjectsList, fetchProjectFiles } from "../services/aiEngineService.js";

export function getHealth(_req, res) {
  res.json({
    status: "ok",
    service: "backend",
    phase: "phase-5",
    timestamp: new Date().toISOString(),
  });
}

export function getStatus(_req, res) {
  const database = getDatabaseStatus();

  res.json({
    status: database.status === "connected" ? "ok" : "degraded",
    service: "backend",
    phase: "phase-5",
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
    aiEngineUrl: env.aiEngineUrl,
  });
}

export async function getAiHealth(_req, res) {
  const aiEngine = await fetchAiEngineHealth();

  res.status(aiEngine.reachable ? 200 : 503).json({
    status: aiEngine.reachable ? "ok" : "unavailable",
    service: "ai-engine-proxy",
    timestamp: new Date().toISOString(),
    aiEngine,
  });
}

export async function getLlmStatus(req, res) {
  const provider = req.query.provider;
  const result = await fetchLlmStatus(provider);

  res.status(result.reachable === false && result.httpStatus ? result.httpStatus : 200).json(result);
}

export async function getLlmVerify(req, res) {
  const provider = req.query.provider;
  const result = await verifyLlmConnection(provider);

  res.status(result.reachable ? 200 : 503).json(result);
}

import { Generation } from "../models/Generation.js";
import { isDatabaseReady } from "../services/generationService.js";

export async function getProjectsList(req, res) {
  const userId = req.user?.id;

  if (!userId) {
    // Anonymous users do not see authenticated users' projects
    return res.json({ projects: [] });
  }

  let dbProjects = [];
  if (isDatabaseReady()) {
    try {
      dbProjects = await Generation.distinct("projectName", {
        userId,
        status: "completed",
      });
    } catch {
      dbProjects = [];
    }
  }

  res.json({ projects: dbProjects.sort() });
}

export async function getProjectFiles(req, res) {
  const projectName = req.params.name;

  // 1. Try fetching from AI Engine disk first
  try {
    const result = await fetchProjectFiles(projectName);
    if (result && result.files && Object.keys(result.files).length > 0) {
      return res.json(result);
    }
  } catch {
    // Fall through to database check
  }

  // 2. Fallback to MongoDB history document
  if (isDatabaseReady()) {
    try {
      const generation = await Generation.findOne({
        projectName,
        status: "completed",
      })
        .sort({ createdAt: -1 })
        .lean();

      if (generation && generation.files && Object.keys(generation.files).length > 0) {
        return res.json({
          project_name: projectName,
          files: generation.files,
        });
      }
    } catch (dbErr) {
      console.warn("[getProjectFiles] DB fallback error:", dbErr.message);
    }
  }

  res.status(404).json({ message: `Project '${projectName}' not found or has no files.` });
}
