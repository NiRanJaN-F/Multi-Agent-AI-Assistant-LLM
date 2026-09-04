import { Router } from "express";
import { getMe, postDemoLogin, postLogin, postRegister } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", postRegister);
router.post("/login", postLogin);
router.post("/demo", postDemoLogin);
router.get("/me", requireAuth, getMe);

export default router;
