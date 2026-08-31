import { generateProject } from "../services/aiEngineService.js";

export async function postGenerate(req, res, next) {
  try {
    const { prompt, projectName, provider } = req.body ?? {};

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        status: "error",
        message: "prompt is required",
      });
    }

    const result = await generateProject({
      prompt: String(prompt).trim(),
      projectName: projectName?.trim() || undefined,
      provider: provider?.trim() || undefined,
    });

    res.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
