import { Router } from "express";
import {
  deleteHistoryItem,
  getHistory,
  getHistoryItem,
  postGenerate,
  postRefine,
} from "../controllers/agentController.js";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Generation & refinement — optional auth so anonymous users can still generate.
// When authenticated, userId is saved with the run.
router.post("/generate", optionalAuth, postGenerate);
router.post("/refine", optionalAuth, postRefine);

// History — always requires authentication.
// Users can only see, retrieve, and delete their own generations.
router.get("/history", requireAuth, getHistory);
router.get("/history/:id", requireAuth, getHistoryItem);
router.delete("/history/:id", requireAuth, deleteHistoryItem);

export default router;
