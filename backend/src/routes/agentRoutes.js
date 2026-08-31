import { Router } from "express";
import { postGenerate } from "../controllers/agentController.js";

const router = Router();

router.post("/generate", postGenerate);

export default router;
