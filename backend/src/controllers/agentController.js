import { generateProject, refineProject } from "../services/aiEngineService.js";
import {
  deleteGenerationById,
  getGenerationById,
  isDatabaseReady,
  listGenerations,
  saveGeneration,
} from "../services/generationService.js";

async function persistRun({ prompt, provider, result, durationMs, mode }) {
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

export async function postGenerate(req, res, next) {
  try {
    const { prompt, projectName, provider } = req.body ?? {};

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        status: "error",
        message: "prompt is required",
      });
    }

    const startedAt = Date.now();

    const result = await generateProject({
      prompt: String(prompt).trim(),
      projectName: projectName?.trim() || undefined,
      provider: provider?.trim() || undefined,
    });

    const durationMs = Date.now() - startedAt;

    const history = await persistRun({
      prompt: String(prompt).trim(),
      provider: provider?.trim(),
      result,
      durationMs,
      mode: "generate",
    });

    res.json({
      status: "ok",
      ...result,
      durationMs,
      history,
    });
  } catch (error) {
    next(error);
  }
}

export async function postRefine(req, res, next) {
  try {
    const { prompt, projectName, provider } = req.body ?? {};

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        status: "error",
        message: "prompt is required",
      });
    }

    if (!projectName || !String(projectName).trim()) {
      return res.status(400).json({
        status: "error",
        message: "projectName is required to refine an existing project",
      });
    }

    const startedAt = Date.now();

    const result = await refineProject({
      prompt: String(prompt).trim(),
      projectName: String(projectName).trim(),
      provider: provider?.trim() || undefined,
    });

    const durationMs = Date.now() - startedAt;

    const history = await persistRun({
      prompt: String(prompt).trim(),
      provider: provider?.trim(),
      result,
      durationMs,
      mode: "refine",
    });

    res.json({
      status: "ok",
      ...result,
      durationMs,
      history,
    });
  } catch (error) {
    next(error);
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
    const result = await listGenerations({ limit, skip });

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

    const generation = await getGenerationById(req.params.id);

    if (!generation) {
      return res.status(404).json({
        status: "error",
        message: `No generation found for id '${req.params.id}'`,
      });
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

    const deleted = await deleteGenerationById(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        status: "error",
        message: `No generation found for id '${req.params.id}'`,
      });
    }

    res.json({ status: "ok", id: req.params.id });
  } catch (error) {
    next(error);
  }
}
