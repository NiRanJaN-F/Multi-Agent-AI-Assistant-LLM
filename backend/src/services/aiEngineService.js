import { env } from "../config/env.js";

const HEALTH_TIMEOUT_MS = 5000;
const GENERATE_TIMEOUT_MS = 300_000; // 5 minutes for multi-agent pipeline

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

export async function generateProject({ prompt, projectName, provider }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.aiEngineUrl}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        project_name: projectName || undefined,
        provider: provider || undefined,
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        body.detail || body.message || "AI engine generation failed",
      );
      error.statusCode = response.status;
      throw error;
    }

    return body;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "Generation timed out after 5 minutes. Try a simpler prompt.",
      );
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function refineProject({ prompt, projectName, provider }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.aiEngineUrl}/api/refine`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        project_name: projectName,
        provider: provider || undefined,
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        body.detail || body.message || "AI engine refinement failed",
      );
      error.statusCode = response.status;
      throw error;
    }

    return body;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "Refinement timed out after 5 minutes. Try a smaller change request.",
      );
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAiEngineJson(path, timeoutMs = HEALTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.aiEngineUrl}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    const body = await response.json().catch(() => ({}));

    return { ok: response.ok, httpStatus: response.status, body };
  } catch (error) {
    const message =
      error.name === "AbortError"
        ? "AI engine request timed out"
        : error.message;

    return { ok: false, httpStatus: null, body: { message }, unreachable: true };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLlmStatus(provider) {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  const result = await fetchAiEngineJson(`/api/llm/status${query}`);

  if (result.unreachable) {
    return { reachable: false, message: result.body.message };
  }

  return result.body;
}

export async function verifyLlmConnection(provider) {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  const result = await fetchAiEngineJson(`/api/llm/verify${query}`, 30_000);

  if (result.unreachable) {
    return { reachable: false, message: result.body.message };
  }

  if (!result.ok) {
    return {
      reachable: false,
      message: result.body.detail || result.body.message || "LLM verification failed",
      httpStatus: result.httpStatus,
    };
  }

  return result.body;
}

export async function fetchProjectsList() {
  const result = await fetchAiEngineJson("/api/projects");
  if (result.unreachable || !result.ok) {
    return { projects: [] };
  }
  return result.body;
}

export async function fetchProjectFiles(projectName) {
  const result = await fetchAiEngineJson(
    `/api/projects/${encodeURIComponent(projectName)}/files`,
    15_000,
  );
  if (result.unreachable || !result.ok) {
    const error = new Error(result.body.detail || result.body.message || "Failed to load project files");
    error.statusCode = result.httpStatus || 500;
    throw error;
  }
  return result.body;
}
