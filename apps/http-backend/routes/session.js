import { Router } from "express";
import {
  createSession,
  getSession,
  joinSession,
  startSession,
  endSession,
} from "../controllers/session.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/", authMiddleware, createSession);
router.get("/:sessionId", authMiddleware, getSession);
router.post("/join", joinSession);
router.put("/:sessionId/start", authMiddleware, startSession);
router.put("/:sessionId/end", authMiddleware, endSession);

export default router;
