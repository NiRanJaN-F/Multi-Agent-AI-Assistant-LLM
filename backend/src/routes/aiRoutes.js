import { Router } from "express";
import { getAiHealth } from "../controllers/healthController.js";

const router = Router();

router.get("/health", getAiHealth);

export default router;
