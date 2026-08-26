import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongodbUri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

export function getDatabaseStatus() {
  const state = mongoose.connection.readyState;

  const labels = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: labels[state] ?? "unknown",
    readyState: state,
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
}
