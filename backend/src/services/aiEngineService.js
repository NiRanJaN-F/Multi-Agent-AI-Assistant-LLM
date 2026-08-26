import { env } from "../config/env.js";

const HEALTH_TIMEOUT_MS = 5000;

export async function fetchAiEngineHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.aiEngineUrl}/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        reachable: false,
        status: "error",
        httpStatus: response.status,
        message: body.detail || "AI engine returned a non-OK response",
        data: body,
      };
    }

    return {
      reachable: true,
      status: "ok",
      httpStatus: response.status,
      data: body,
    };
  } catch (error) {
    const message =
      error.name === "AbortError"
        ? "AI engine health check timed out"
        : error.message;

    return {
      reachable: false,
      status: "unreachable",
      message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
