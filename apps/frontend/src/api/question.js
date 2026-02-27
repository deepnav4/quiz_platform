import { apiRequest } from "./client.js";

export async function addQuestion(quizId, data) {
  // TODO: POST /quizzes/:quizId/questions
}

export async function updateQuestion(quizId, questionId, data) {
  // TODO: PUT /quizzes/:quizId/questions/:questionId
}

export async function deleteQuestion(quizId, questionId) {
  // TODO: DELETE /quizzes/:quizId/questions/:questionId
}

export async function reorderQuestions(quizId, orderedIds) {
  // TODO: PUT /quizzes/:quizId/questions/reorder
}
