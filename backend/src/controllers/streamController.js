/**
 * Stream Controller - proxies SSE events from the AI engine to the browser.
 *
 * Flow:
 *   Browser  ->  POST /api/agents/generate/stream  ->  Express (this file)
 *                                                   ->  fetch AI engine /api/generate/stream
 *   Browser  <-  SSE frames (progress + result)    <-  Express (piped through)
 *
 * On the esult SSE event the generation is persisted to MongoDB so history
 * works exactly as it does for the blocking endpoints.
 */

import { env } from '../config/env.js';
import { saveGeneration, isDatabaseReady } from '../services/generationService.js';

const AI_ENGINE_STREAM_TIMEOUT_MS = 360_000; // 6 min

/** Write one SSE frame to the response. */
function writeSse(res, data) {
  res.write(data: \n\n);
}

/** Persist the generation result to MongoDB (fire-and-forget, non-fatal). */
async function tryPersist({ prompt, provider, result, mode, userId }) {
  if (!isDatabaseReady()) return { persisted: false, reason: 'MongoDB not connected' };
  try {
    return await saveGeneration({
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
      durationMs: result.durationMs ?? 0,
      userId: userId ?? null,
    });
  } catch (err) {
    console.warn('[stream] Failed to persist generation history:', err.message);
    return { persisted: false, reason: err.message };
  }
}

/**
 * Core SSE proxy: opens a streaming fetch to the AI engine, pipes each
 * data: line to the browser, and persists the final result to MongoDB.
 */
async function _streamProxy(res, { aiEnginePath, body, prompt, provider, mode, userId }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_ENGINE_STREAM_TIMEOUT_MS);
  const startedAt = Date.now();

  res.on('close', () => {
    controller.abort();
    clearTimeout(timeout);
  });

  try {
    const upstream = await fetch(${env.aiEngineUrl}, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const detail = await upstream.json().catch(() => ({}));
      writeSse(res, {
        type: 'error',
        message: detail.detail || detail.message || AI engine returned ,
      });
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const raw = trimmed.slice(5).trim();
        if (!raw) continue;

        let event;
        try {
          event = JSON.parse(raw);
        } catch {
          continue;
        }

        if (event.type === 'progress' || event.type === 'heartbeat') {
          writeSse(res, event);
          continue;
        }

        if (event.type === 'result') {
          const durationMs = Date.now() - startedAt;
          const resultPayload = { ...event.payload, durationMs };
          const history = await tryPersist({ prompt, provider, result: resultPayload, mode, userId });
          writeSse(res, { type: 'result', payload: resultPayload, history });
          continue;
        }

        if (event.type === 'error') {
          writeSse(res, event);
          continue;
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      writeSse(res, { type: 'error', message: err.message || 'Stream failed' });
    }
  } finally {
    clearTimeout(timeout);
    res.end();
  }
}

/** POST /api/agents/generate/stream */
export async function postGenerateStream(req, res, next) {
  try {
    const { prompt, projectName, provider } = req.body ?? {};
    if (!prompt || !String(prompt).trim()) {
      res.status(400).json({ status: 'error', message: 'prompt is required' });
      return;
    }
    await _streamProxy(res, {
      aiEnginePath: '/api/generate/stream',
      body: {
        prompt: String(prompt).trim(),
        project_name: projectName?.trim() || undefined,
        provider: provider?.trim() || undefined,
      },
      prompt: String(prompt).trim(),
      provider: provider?.trim(),
      mode: 'generate',
      userId: req.user?.id ?? null,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/agents/refine/stream */
export async function postRefineStream(req, res, next) {
  try {
    const { prompt, projectName, provider } = req.body ?? {};
    if (!prompt || !String(prompt).trim()) {
      res.status(400).json({ status: 'error', message: 'prompt is required' });
      return;
    }
    if (!projectName || !String(projectName).trim()) {
      res.status(400).json({ status: 'error', message: 'projectName is required' });
      return;
    }
    await _streamProxy(res, {
      aiEnginePath: '/api/refine/stream',
      body: {
        prompt: String(prompt).trim(),
        project_name: String(projectName).trim(),
        provider: provider?.trim() || undefined,
      },
      prompt: String(prompt).trim(),
      provider: provider?.trim(),
      mode: 'refine',
      userId: req.user?.id ?? null,
    });
  } catch (err) {
    next(err);
  }
}
