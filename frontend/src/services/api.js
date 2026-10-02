const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const TOKEN_KEY = "maa_auth_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getAuthHeaders(extra = {}) {
  const token = getAuthToken();
  const headers = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });

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
  const response = await fetch(`${API_BASE_URL}/ai/llm/verify`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.detail || "LLM verification failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getGenerationHistory({ limit = 20, skip = 0 } = {}) {
  const response = await fetch(`${API_BASE_URL}/agents/history?limit=${limit}&skip=${skip}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Generation history is unavailable");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getGeneration(id) {
  const response = await fetch(`${API_BASE_URL}/agents/history/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Generation not found");
    error.status = response.status;
    throw error;
  }

  return data.generation;
}

export async function deleteGeneration(id) {
  const response = await fetch(`${API_BASE_URL}/agents/history/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Failed to delete generation");
    error.status = response.status;
    throw error;
  }

  return data;
}

// ─── Real-Time SSE Stream Handlers ───────────────────────────────────────────

function parseSseLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const raw = trimmed.slice(5).trim();
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function streamPipeline(endpoint, body, onEvent, signal) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    }),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.detail || "Pipeline request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult = null;
  let completeProjectName = null;

  // SSE messages are delimited by \n\n (double newline).
  // The `complete` event contains ALL generated file contents and can be many KB.
  // Splitting on single \n shreds the JSON across lines and causes JSON.parse to fail silently.
  function processBuffer() {
    const messages = buffer.split(/\n\n/);
    buffer = messages.pop() ?? ""; // last element may be a partial incomplete message

    for (const message of messages) {
      // Find the data: line within this SSE message block
      const dataLine = message.split("\n").find((l) => l.trimStart().startsWith("data:"));
      if (!dataLine) continue;
      const event = parseSseLine(dataLine);
      if (!event) continue;

      onEvent?.(event);

      if (event.stage === "complete") {
        if (event.result) {
          finalResult = event.result;
          completeProjectName = event.result.project_name || event.result.projectName || null;
        }
      }
      if (event.stage === "error") {
        throw new Error(event.message || "Generation error received from stream");
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    processBuffer();
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    buffer += "\n\n";
    processBuffer();
  }

  // Fallback: if finalResult is still null after stream completion, the complete event JSON
  // may have been too large and dropped. Fetch the project files directly from the API.
  if (!finalResult && completeProjectName) {
    try {
      const filesData = await getProjectFiles(completeProjectName);
      finalResult = {
        status: "completed",
        project_name: completeProjectName,
        tech_stack: "",
        files: filesData.files || {},
        saved_files: Object.keys(filesData.files || {}),
        mode: "generate",
        logs: [],
      };
    } catch {
      finalResult = {
        status: "completed",
        project_name: completeProjectName,
        files: {},
        saved_files: [],
        mode: "generate",
        logs: [],
      };
    }
  }

  return finalResult;
}


export async function generateProjectStream({ prompt, projectName, provider, onEvent, signal }) {
  return streamPipeline(
    "/agents/generate",
    {
      prompt,
      projectName: projectName || undefined,
      provider: provider || undefined,
    },
    onEvent,
    signal,
  );
}

export async function refineProjectStream({ prompt, projectName, provider, onEvent, signal }) {
  return streamPipeline(
    "/agents/refine",
    {
      prompt,
      projectName,
      provider: provider || undefined,
    },
    onEvent,
    signal,
  );
}

// Fallback non-streaming endpoints
export async function generateProject({ prompt, projectName, provider }) {
  return generateProjectStream({ prompt, projectName, provider });
}

export async function refineProject({ prompt, projectName, provider }) {
  return refineProjectStream({ prompt, projectName, provider });
}

export async function getProjects() {
  const response = await fetch(`${API_BASE_URL}/ai/projects`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({ projects: [] }));
  return data;
}

export async function getProjectFiles(projectName) {
  const response = await fetch(`${API_BASE_URL}/ai/projects/${encodeURIComponent(projectName)}/files`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Failed to load project files");
    error.status = response.status;
    throw error;
  }

  return data;
}

// ─── Project Export API ──────────────────────────────────────────────────────

export async function downloadProjectZip(projectName) {
  const url = `${API_BASE_URL}/ai/projects/${encodeURIComponent(projectName)}/download`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to download project zip");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${projectName}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportProjectToGithub({ projectName, githubToken, repoName, description, isPrivate }) {
  const response = await fetch(`${API_BASE_URL}/ai/projects/${encodeURIComponent(projectName)}/github`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      githubToken,
      repoName,
      description,
      isPrivate,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "GitHub export failed");
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
