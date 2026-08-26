import { Router } from "express";
import { getHealth, getStatus } from "../controllers/healthController.js";

const router = Router();

router.get("/health", getHealth);
router.get("/status", getStatus);

export default router;
