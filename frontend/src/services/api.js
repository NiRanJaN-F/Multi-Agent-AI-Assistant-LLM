const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

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
