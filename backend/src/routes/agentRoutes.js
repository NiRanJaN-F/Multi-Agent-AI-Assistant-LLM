import { Router } from "express";
import {
  deleteHistoryItem,
  getHistory,
  getHistoryItem,
  postGenerate,
} from "../controllers/agentController.js";

const router = Router();

router.post("/generate", postGenerate);
router.get("/history", getHistory);
router.get("/history/:id", getHistoryItem);
router.delete("/history/:id", deleteHistoryItem);

export default router;
