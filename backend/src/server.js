/**
 * Express server entrypoint (scaffold only).
 * Routes, MongoDB, and AI-engine proxying will be added in Phase 1.
 */
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend", phase: "scaffold" });
});

app.listen(PORT, () => {
  console.log(`Backend scaffold listening on port ${PORT}`);
});
