const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function getBackendHealth() {
  return fetchJson("/health");
}

export async function getBackendStatus() {
  return fetchJson("/status");
}

export async function getAiEngineHealth() {
  return fetchJson("/ai/health");
}

export async function getLlmStatus() {
  return fetchJson("/ai/llm/status");
}

export async function verifyLlmConnection() {
  const response = await fetch(`${API_BASE_URL}/ai/llm/verify`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.detail || "LLM verification failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function generateProject({ prompt, projectName, provider }) {
  const response = await fetch(`${API_BASE_URL}/agents/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      projectName: projectName || undefined,
      provider: provider || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.detail || "Generation failed");
    error.status = response.status;
    throw error;
  }

  return data;
}
