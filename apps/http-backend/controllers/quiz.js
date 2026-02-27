import { generateQuizFromPrompt } from "../utils/ai.js";
import { extractQuestionsFromImage } from "../utils/ocr.js";

export async function createQuiz(req, res, next) {
  // TODO: create quiz with title, description, settings
}

export async function getMyQuizzes(req, res, next) {
  // TODO: return all quizzes created by req.user
}

export async function getQuiz(req, res, next) {
  // TODO: return quiz with questions and options
}

export async function updateQuiz(req, res, next) {
  // TODO: update quiz title, description, settings
}

export async function deleteQuiz(req, res, next) {
  // TODO: delete quiz and all related data
}
