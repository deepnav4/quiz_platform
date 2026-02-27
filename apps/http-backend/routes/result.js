import { Router } from "express";
import {
  getSessionResults,
  getLeaderboard,
  getQuestionResult,
} from "../controllers/result.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/:sessionId", getSessionResults);
router.get("/:sessionId/leaderboard", getLeaderboard);
router.get("/:sessionId/questions/:questionId", getQuestionResult);

export default router;
