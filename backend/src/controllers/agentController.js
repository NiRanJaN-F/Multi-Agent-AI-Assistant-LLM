import { generateProject } from "../services/aiEngineService.js";
import {
  deleteGenerationById,
  getGenerationById,
  isDatabaseReady,
  listGenerations,
  saveGeneration,
} from "../services/generationService.js";

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

    let history = { persisted: false, reason: "MongoDB is not connected" };

    try {
      history = await saveGeneration({
        prompt: String(prompt).trim(),
        projectName: result.project_name,
        provider: provider?.trim() || result.llm?.provider || null,
        status: result.status,
        techStack: result.tech_stack,
        tasks: result.tasks,
        savedFiles: result.saved_files,
        outputDir: result.output_dir,
        reviewResults: result.review_results,
        documentation: result.documentation,
        logs: result.logs,
        llm: result.llm,
        durationMs,
      });
    } catch (error) {
      console.warn("[backend] Failed to persist generation history:", error.message);
      history = { persisted: false, reason: error.message };
    }

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
