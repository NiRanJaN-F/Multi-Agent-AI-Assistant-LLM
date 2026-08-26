import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import healthRoutes from "./routes/healthRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    service: "multi-agent-ai-assistant-backend",
    phase: "phase-1",
    docs: "/api/health",
  });
});

app.use("/api", healthRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
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

startServer();
