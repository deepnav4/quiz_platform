import { Router } from "express";
import { signup, login, getMe } from "../controllers/auth.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;
