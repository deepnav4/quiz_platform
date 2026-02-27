import { Router } from "express";
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../controllers/question.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.post("/:quizId/questions", addQuestion);
router.put("/:quizId/questions/:questionId", updateQuestion);
router.delete("/:quizId/questions/:questionId", deleteQuestion);
router.put("/:quizId/questions/reorder", reorderQuestions);

export default router;
