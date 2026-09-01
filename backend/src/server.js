import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import healthRoutes from "./routes/healthRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    service: "multi-agent-ai-assistant-backend",
    phase: "phase-5",
    docs: "/api/health",
    generate: "/api/agents/generate",
    refine: "/api/agents/refine",
    history: "/api/agents/history",
  });
});

app.use("/api", healthRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/agents", agentRoutes);

app.use(notFound);
app.use(errorHandler);

export async function startServer() {
  try {
    await connectDatabase();
    console.log("MongoDB connected");
  } catch (error) {
    console.warn(
      "MongoDB connection failed — server will start in degraded mode:",
      error.message,
    );
  }

  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  startServer();
}
