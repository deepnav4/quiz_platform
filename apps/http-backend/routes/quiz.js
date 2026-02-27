import { Router } from "express";
import {
  createQuiz,
  getMyQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
} from "../controllers/quiz.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createQuiz);
router.get("/", getMyQuizzes);
router.get("/:quizId", getQuiz);
router.put("/:quizId", updateQuiz);
router.delete("/:quizId", deleteQuiz);

export default router;
