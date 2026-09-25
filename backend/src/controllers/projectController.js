/**
 * projectController.js
 *
 * Handles:
 *   GET /api/ai/projects/:name/download  — ZIP download via archiver
 *   POST /api/ai/projects/:name/github   — GitHub export via @octokit/rest
 *
 * Security:
 *   - Path traversal is prevented by the AI engine's resolve_project_dir;
 *     the backend adds its own sanitisation layer before forwarding.
 *   - GitHub PATs travel from the browser → Express → GitHub ONLY;
 *     they are never stored or logged.
 *   - Download and export verify project ownership via the last Generation
 *     record that belongs to the caller (when authenticated).
 */

import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { existsSync } from "fs";
import { Octokit } from "@octokit/rest";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

import { fetchProjectFiles } from "../services/aiEngineService.js";
import { Generation } from "../models/Generation.js";
import { isDatabaseReady } from "../services/generationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the generated-projects directory relative to the repo root.
const REPO_ROOT = path.resolve(__dirname, "../../../");
const GENERATED_PROJECTS_DIR = path.join(REPO_ROOT, "generated-projects");

// Files/dirs to exclude from the ZIP (security + cleanliness)
const ZIP_EXCLUDED_PATTERNS = [
  "node_modules",
  ".git",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  "build",
  ".DS_Store",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sanitise a project name to prevent path traversal.
 * Rejects names with path separators or leading dots.
 */
function safeProjectName(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/\\/g, "/").replace(/\/+/g, "");
  // Reject anything that escapes the directory
  if (!cleaned || cleaned.includes("..") || cleaned.includes("/") || cleaned.startsWith(".")) {
    return null;
  }
  return cleaned;
}

/**
 * Verify that the authenticated user owns at least one generation for
 * the given project name. Returns true when:
 *   - DB is not available (graceful degradation)
 *   - The caller is not authenticated (anonymous access allowed)
 *   - A generation record exists with matching userId + projectName
 */
async function verifyProjectOwnership(projectName, userId) {
  if (!isDatabaseReady()) return true; // No DB — allow (degraded mode)
  if (!userId) return true; // Anonymous — allow

  const record = await Generation.findOne({
    userId,
    projectName,
  })
    .select("_id")
    .lean();

  return Boolean(record);
}

function createZipArchive(options = { zlib: { level: 6 } }) {
  if (typeof archiver === "function") {
    return archiver("zip", options);
  }
  if (archiver?.ZipArchive) {
    return new archiver.ZipArchive(options);
  }
  if (archiver?.Archiver) {
    return new archiver.Archiver("zip", options);
  }
  throw new Error("Unable to initialize zip archiver");
}

// ─── ZIP Download ─────────────────────────────────────────────────────────────

export async function downloadProject(req, res) {
  const projectName = safeProjectName(req.params.name);
  if (!projectName) {
    return res.status(400).json({ status: "error", message: "Invalid project name." });
  }

  const userId = req.user?.id ?? null;
  const owned = await verifyProjectOwnership(projectName, userId);
  if (!owned) {
    return res.status(404).json({ status: "error", message: "Project not found." });
  }

  // Fetch project files from AI Engine service
  let projectFiles = null;
  try {
    const data = await fetchProjectFiles(projectName);
    if (data && data.files && Object.keys(data.files).length > 0) {
      projectFiles = data.files;
    }
  } catch (err) {
    // If AI engine files endpoint is not reachable, fallback to disk check
  }

  const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, "-");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.zip"`);
  res.setHeader("Cache-Control", "no-cache");

  const archive = createZipArchive({ zlib: { level: 6 } });

  archive.on("error", (err) => {
    console.error("[downloadProject] Archive error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: "Archive creation failed." });
    } else {
      res.end();
    }
  });

  archive.pipe(res);

  if (projectFiles) {
    // Stream directly from the in-memory files mapping
    for (const [filePath, content] of Object.entries(projectFiles)) {
      const isExcluded = ZIP_EXCLUDED_PATTERNS.some((pat) =>
        filePath === pat || filePath.startsWith(`${pat}/`) || filePath.endsWith(`/${pat}`)
      );
      if (isExcluded) continue;

      archive.append(content || "", { name: filePath });
    }
    await archive.finalize();
    return;
  }

  // Fallback to local disk if present
  const projectDir = path.join(GENERATED_PROJECTS_DIR, projectName);
  const resolvedDir = path.resolve(projectDir);

  if (existsSync(resolvedDir) && resolvedDir.startsWith(path.resolve(GENERATED_PROJECTS_DIR))) {
    archive.glob("**/*", {
      cwd: resolvedDir,
      ignore: [
        "node_modules/**",
        ".git/**",
        ".env",
        ".env.*",
        "__pycache__/**",
        ".venv/**",
        "venv/**",
        "dist/**",
        "build/**",
        "*.pyc",
      ],
      dot: false,
    });
    await archive.finalize();
    return;
  }

  return res.status(404).json({ status: "error", message: `Project '${projectName}' not found.` });
}

// ─── GitHub Export ────────────────────────────────────────────────────────────

export async function exportToGithub(req, res) {
  const projectName = safeProjectName(req.params.name);
  if (!projectName) {
    return res.status(400).json({ status: "error", message: "Invalid project name." });
  }

  const {
    githubToken,
    repoName,
    description = "",
    isPrivate = false,
  } = req.body ?? {};

  if (!githubToken || !String(githubToken).trim()) {
    return res.status(400).json({ status: "error", message: "githubToken is required." });
  }
  if (!repoName || !String(repoName).trim()) {
    return res.status(400).json({ status: "error", message: "repoName is required." });
  }

  // Sanitise repo name (GitHub rules)
  const safeRepo = String(repoName)
    .trim()
    .replace(/[^a-zA-Z0-9._\-]/g, "-")
    .slice(0, 100);

  if (!safeRepo) {
    return res.status(400).json({ status: "error", message: "Repository name contains no valid characters." });
  }

  const userId = req.user?.id ?? null;
  const owned = await verifyProjectOwnership(projectName, userId);
  if (!owned) {
    return res.status(404).json({ status: "error", message: "Project not found." });
  }

  // Fetch project files from AI engine
  let projectFiles;
  try {
    const data = await fetchProjectFiles(projectName);
    projectFiles = data.files || {};
  } catch (err) {
    return res.status(404).json({ status: "error", message: `Could not load project files: ${err.message}` });
  }

  if (Object.keys(projectFiles).length === 0) {
    return res.status(404).json({ status: "error", message: "Project has no files to export." });
  }

  const octokit = new Octokit({ auth: githubToken.trim() });

  let repoOwner;
  try {
    const { data: ghUser } = await octokit.rest.users.getAuthenticated();
    repoOwner = ghUser.login;
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "GitHub authentication failed. Check your Personal Access Token.",
    });
  }

  // Create the repository
  let repoUrl;
  try {
    const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: safeRepo,
      description: String(description).slice(0, 300),
      private: Boolean(isPrivate),
      auto_init: false,
    });
    repoUrl = newRepo.html_url;
  } catch (err) {
    const ghStatus = err.status;
    if (ghStatus === 422) {
      return res.status(409).json({
        status: "error",
        message: `Repository '${safeRepo}' already exists on your GitHub account.`,
      });
    }
    return res.status(502).json({
      status: "error",
      message: `Failed to create repository: ${err.message}`,
    });
  }

  // Upload all project files (filtered — no secrets)
  const EXCLUDED_UPLOAD = new Set([".env", ".env.local", ".env.production", ".env.development"]);
  const uploadErrors = [];

  for (const [filePath, content] of Object.entries(projectFiles)) {
    const fileName = path.basename(filePath);
    if (EXCLUDED_UPLOAD.has(fileName)) continue;
    // Skip binary-like or empty files
    if (!content || typeof content !== "string") continue;

    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: repoOwner,
        repo: safeRepo,
        path: filePath,
        message: `Add ${filePath}`,
        content: Buffer.from(content, "utf8").toString("base64"),
      });
    } catch (err) {
      console.warn(`[exportToGithub] Failed to upload ${filePath}:`, err.message);
      uploadErrors.push({ file: filePath, error: err.message });
    }
  }

  return res.json({
    status: "ok",
    repositoryUrl: repoUrl,
    filesUploaded: Object.keys(projectFiles).length - uploadErrors.length,
    uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
    message:
      uploadErrors.length > 0
        ? `Repository created with ${uploadErrors.length} upload error(s).`
        : "Repository created and all files uploaded successfully.",
  });
}
