import { env } from "../config/env.js";
import { getDatabaseStatus } from "../config/database.js";
import { fetchAiEngineHealth } from "../services/aiEngineService.js";

export function getHealth(_req, res) {
  res.json({
    status: "ok",
    service: "backend",
    phase: "phase-1",
    timestamp: new Date().toISOString(),
  });
}

export function getStatus(_req, res) {
  const database = getDatabaseStatus();

  res.json({
    status: database.status === "connected" ? "ok" : "degraded",
    service: "backend",
    phase: "phase-1",
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
