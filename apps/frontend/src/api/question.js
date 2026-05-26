import { apiRequest } from './client.js';

export function createQuestion(quizId, data) {
  return apiRequest(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateQuestion(quizId, questionId, data) {
  return apiRequest(`/quizzes/${quizId}/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteQuestion(quizId, questionId) {
  return apiRequest(`/quizzes/${quizId}/questions/${questionId}`, {
    method: 'DELETE',
  });
}

export function reorderQuestions(quizId, orderedIds) {
  return apiRequest(`/quizzes/${quizId}/questions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  });
}
