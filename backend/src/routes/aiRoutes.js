import { Router } from "express";
import { getAiHealth, getLlmStatus, getLlmVerify } from "../controllers/healthController.js";

const router = Router();

router.get("/health", getAiHealth);
router.get("/llm/status", getLlmStatus);
router.get("/llm/verify", getLlmVerify);

export default router;
