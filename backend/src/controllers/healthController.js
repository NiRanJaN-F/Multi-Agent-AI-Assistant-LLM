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

export async function getProjectsList(_req, res) {
  const result = await fetchProjectsList();
  res.json(result);
}

export async function getProjectFiles(req, res) {
  try {
    const result = await fetchProjectFiles(req.params.name);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}
