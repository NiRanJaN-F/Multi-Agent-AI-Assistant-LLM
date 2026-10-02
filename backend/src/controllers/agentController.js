/**
 * agentController.js
 *
 * Handles generation, refinement, and history.
 *
 * SSE streaming: the controller opens a fetch() to the Python AI engine's
 * /api/generate/stream (or /api/refine/stream) endpoint, pipes the
 * text/event-stream bytes straight back to the browser, then persists
 * the final "complete" event payload to MongoDB.
 *
 * Auth: generation/refine use optionalAuth — anonymous requests work.
 *       History endpoints require requireAuth.
 */

import { env } from "../config/env.js";
import { Generation } from "../models/Generation.js";
import {
  deleteGenerationById,
  getGenerationById,
  isDatabaseReady,
  listGenerations,
  saveGeneration,
} from "../services/generationService.js";

// ─── SSE helpers ─────────────────────────────────────────────────────────────

/** Write a single SSE event to the response. */
function sseWrite(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/** Set SSE response headers. */
function sseInit(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();
}

const STREAM_TIMEOUT_MS = 360_000; // 6 min — generous for large projects

/**
 * Parse a single SSE `data:` line into a JS object.
 * Returns null if the line doesn't start with "data:".
 */
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

/**
 * Proxy the streaming response from the Python AI engine to the Express
 * response, buffering SSE lines to detect the final "complete" event.
 *
 * Returns the parsed payload of the "complete" event (or null on failure).
 */
async function proxyAiStream(aiUrl, body, res, abortSignal) {
  const aiResponse = await fetch(aiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!aiResponse.ok) {
    const errBody = await aiResponse.json().catch(() => ({}));
    const status = aiResponse.status;
    let message = errBody.detail || errBody.message;
    if (!message) {
      if (status === 502 || status === 503) {
        message = "AI Engine is waking up from idle. Please wait 15 seconds and try again.";
      } else {
        message = `AI engine error (HTTP ${status})`;
      }
    }
    throw Object.assign(new Error(message), { statusCode: status });
  }

  const reader = aiResponse.body.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = "";
  let completePayload = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch (err) {
      // Client disconnected or aborted
      reader.cancel();
      break;
    }

    if (chunk.done) break;

    lineBuffer += decoder.decode(chunk.value, { stream: true });
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      const parsed = parseSseLine(line);
      if (!parsed) continue;

      // Forward every event to the browser
      if (!res.writableEnded) sseWrite(res, parsed);

      if (parsed.stage === "complete") {
        completePayload = parsed;
      }
    }
  }

  // Flush any remaining partial line
  if (lineBuffer.trim()) {
    const parsed = parseSseLine(lineBuffer);
    if (parsed) {
      if (!res.writableEnded) sseWrite(res, parsed);
      if (parsed.stage === "complete") completePayload = parsed;
    }
  }

  return completePayload;
}

// ─── Persist helper ───────────────────────────────────────────────────────────

async function persistRun({ prompt, provider, result, durationMs, mode, userId }) {
  try {
    return await saveGeneration({
      userId: userId || null,
      prompt,
      projectName: result.project_name,
      provider: provider || result.llm?.provider || null,
      status: result.status,
      techStack: result.tech_stack,
      tasks: result.tasks,
      savedFiles: result.saved_files,
      changedFiles: result.changed_files ?? [],
      files: result.files ?? {},
      mode,
      outputDir: result.output_dir,
      reviewResults: result.review_results,
      documentation: result.documentation,
      logs: result.logs,
      llm: result.llm,
      durationMs,
    });
  } catch (error) {
    console.warn(`[backend] Failed to persist ${mode} history:`, error.message);
    return { persisted: false, reason: error.message };
  }
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function postGenerate(req, res, next) {
  const { prompt, projectName, provider } = req.body ?? {};
  const userId = req.user?.id ?? null;

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ status: "error", message: "prompt is required" });
  }

  // Setup SSE
  sseInit(res);

  // Keep-alive heartbeat ping every 3 seconds to prevent Vercel/Render proxy timeouts
  const keepAlive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": keep-alive\n\n");
    }
  }, 3000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  const handleClientClose = () => {
    clearInterval(keepAlive);
    if (!res.writableEnded) {
      controller.abort();
    }
  };
  res.on("close", handleClientClose);

  const startedAt = Date.now();

  try {
    sseWrite(res, { stage: "queued", message: "Sending to AI engine…", percent: 5 });

    const completePayload = await proxyAiStream(
      `${env.aiEngineUrl}/api/generate/stream`,
      {
        prompt: String(prompt).trim(),
        project_name: projectName?.trim() || undefined,
        provider: provider?.trim() || undefined,
      },
      res,
      controller.signal,
    );

    const durationMs = Date.now() - startedAt;

    if (completePayload?.result) {
      const history = await persistRun({
        prompt: String(prompt).trim(),
        provider: provider?.trim(),
        result: completePayload.result,
        durationMs,
        mode: "generate",
        userId,
      });
      if (!res.writableEnded) {
        sseWrite(res, { stage: "saved", history });
      }
    }
  } catch (err) {
    if (!res.writableEnded) {
      let msg = err.name === "AbortError" ? "Generation timed out or was stopped." : err.message;
      if (err.message && (err.message.includes("fetch failed") || err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND"))) {
        msg = "AI engine service is starting up on Render. Please wait 15-20 seconds and click Generate App again.";
      }
      sseWrite(res, {
        stage: "error",
        message: msg,
      });
    }
  } finally {
    clearInterval(keepAlive);
    clearTimeout(timeout);
    res.off("close", handleClientClose);
    if (!res.writableEnded) res.end();
  }
}

export async function postRefine(req, res, next) {
  const { prompt, projectName, provider } = req.body ?? {};
  const userId = req.user?.id ?? null;

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ status: "error", message: "prompt is required" });
  }
  if (!projectName || !String(projectName).trim()) {
    return res.status(400).json({ status: "error", message: "projectName is required to refine an existing project" });
  }

  // Retrieve project file tree from MongoDB to ensure cloud ephemeral disk restarts never cause 404
  let filesSnapshot = undefined;
  if (isDatabaseReady()) {
    try {
      const query = { projectName: String(projectName).trim(), status: "completed" };
      if (userId) query.userId = userId;
      const gen = await Generation.findOne(query).sort({ createdAt: -1 }).lean();
      if (gen && gen.files && Object.keys(gen.files).length > 0) {
        filesSnapshot = gen.files;
      }
    } catch {
      // ignore
    }
  }

  sseInit(res);

  // Keep-alive heartbeat ping every 3 seconds to prevent Vercel/Render proxy timeouts
  const keepAlive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": keep-alive\n\n");
    }
  }, 3000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  const handleClientClose = () => {
    clearInterval(keepAlive);
    if (!res.writableEnded) {
      controller.abort();
    }
  };
  res.on("close", handleClientClose);

  const startedAt = Date.now();

  try {
    sseWrite(res, { stage: "queued", message: "Sending refinement to AI engine…", percent: 5 });

    const completePayload = await proxyAiStream(
      `${env.aiEngineUrl}/api/refine/stream`,
      {
        prompt: String(prompt).trim(),
        project_name: String(projectName).trim(),
        provider: provider?.trim() || undefined,
        files: filesSnapshot,
      },
      res,
      controller.signal,
    );

    const durationMs = Date.now() - startedAt;

    if (completePayload?.result) {
      const history = await persistRun({
        prompt: String(prompt).trim(),
        provider: provider?.trim(),
        result: completePayload.result,
        durationMs,
        mode: "refine",
        userId,
      });
      if (!res.writableEnded) {
        sseWrite(res, { stage: "saved", history });
      }
    }
  } catch (err) {
    if (!res.writableEnded) {
      let msg = err.name === "AbortError" ? "Refinement timed out or was stopped." : err.message;
      if (err.message && (err.message.includes("fetch failed") || err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND"))) {
        msg = "AI engine service is starting up on Render. Please wait 15-20 seconds and click Refine again.";
      }
      sseWrite(res, {
        stage: "error",
        message: msg,
      });
    }
  } finally {
    clearInterval(keepAlive);
    clearTimeout(timeout);
    res.off("close", handleClientClose);
    if (!res.writableEnded) res.end();
  }
}

export async function getHistory(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({
        status: "unavailable",
        message: "MongoDB is not connected — generation history is disabled.",
        items: [],
        total: 0,
      });
    }

    const { limit, skip } = req.query;
    const userId = req.user?.id;
    const result = await listGenerations({ limit, skip, userId });

    res.json({ status: "ok", ...result });
  } catch (error) {
    next(error);
  }
}

export async function getHistoryItem(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({
        status: "unavailable",
        message: "MongoDB is not connected — generation history is disabled.",
      });
    }

    const userId = req.user?.id;
    const generation = await getGenerationById(req.params.id, userId);

    if (!generation) {
      return res.status(404).json({ status: "error", message: `No generation found for id '${req.params.id}'` });
    }

    res.json({ status: "ok", generation });
  } catch (error) {
    next(error);
  }
}

export async function deleteHistoryItem(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({
        status: "unavailable",
        message: "MongoDB is not connected — generation history is disabled.",
      });
    }

    const userId = req.user?.id;
    const deleted = await deleteGenerationById(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ status: "error", message: `No generation found for id '${req.params.id}'` });
    }

    res.json({ status: "ok", id: req.params.id });
  } catch (error) {
    next(error);
  }
}
