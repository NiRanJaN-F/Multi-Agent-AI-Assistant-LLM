import { Router } from "express";
import { getAiHealth, getLlmStatus, getLlmVerify, getProjectsList, getProjectFiles } from "../controllers/healthController.js";

const router = Router();

router.get("/health", getAiHealth);
router.get("/llm/status", getLlmStatus);
router.get("/llm/verify", getLlmVerify);
router.get("/projects", getProjectsList);
router.get("/projects/:name/files", getProjectFiles);

export default router;
