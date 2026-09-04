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

export async function getGenerationHistory({ limit = 20, skip = 0 } = {}) {
  const response = await fetch(`${API_BASE_URL}/agents/history?limit=${limit}&skip=${skip}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Generation history is unavailable");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getGeneration(id) {
  const response = await fetch(`${API_BASE_URL}/agents/history/${id}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Generation not found");
    error.status = response.status;
    throw error;
  }

  return data.generation;
}

export async function deleteGeneration(id) {
  const response = await fetch(`${API_BASE_URL}/agents/history/${id}`, { method: "DELETE" });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Failed to delete generation");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function refineProject({ prompt, projectName, provider }) {
  const response = await fetch(`${API_BASE_URL}/agents/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      projectName,
      provider: provider || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.detail || "Refinement failed");
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

export async function getProjects() {
  const response = await fetch(`${API_BASE_URL}/ai/projects`);
  const data = await response.json().catch(() => ({ projects: [] }));
  return data;
}

export async function getProjectFiles(projectName) {
  const response = await fetch(`${API_BASE_URL}/ai/projects/${encodeURIComponent(projectName)}/files`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Failed to load project files");
    error.status = response.status;
    throw error;
  }

  return data;
}

// ─── Authentication API ───────────────────────────────────────────────────────

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Login failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function registerUser({ username, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Registration failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function demoLoginUser() {
  const response = await fetch(`${API_BASE_URL}/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Demo login failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Failed to fetch user");
    error.status = response.status;
    throw error;
  }
  return data.user;
}

