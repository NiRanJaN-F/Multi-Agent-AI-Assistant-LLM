import { Router } from "express";
import {
  deleteHistoryItem,
  getHistory,
  getHistoryItem,
  postGenerate,
  postRefine,
} from "../controllers/agentController.js";

const router = Router();

router.post("/generate", postGenerate);
router.post("/refine", postRefine);
router.get("/history", getHistory);
router.get("/history/:id", getHistoryItem);
router.delete("/history/:id", deleteHistoryItem);

export default router;
