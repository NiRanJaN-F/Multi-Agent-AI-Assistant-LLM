import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const required = ["MONGODB_URI", "AI_ENGINE_URL"];

const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill in values.`,
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  aiEngineUrl: process.env.AI_ENGINE_URL.replace(/\/$/, ""),
};
