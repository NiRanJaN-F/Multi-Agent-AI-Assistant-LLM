import { Router } from "express";
import {
  getAiHealth,
  getLlmStatus,
  getLlmVerify,
  getProjectsList,
  getProjectFiles,
} from "../controllers/healthController.js";
import {
  downloadProject,
  exportToGithub,
} from "../controllers/projectController.js";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/health", getAiHealth);
router.get("/llm/status", getLlmStatus);
router.get("/llm/verify", getLlmVerify);
router.get("/projects", getProjectsList);
router.get("/projects/:name/files", getProjectFiles);
router.get("/projects/:name/download", optionalAuth, downloadProject);
router.post("/projects/:name/github", optionalAuth, exportToGithub);

export default router;
