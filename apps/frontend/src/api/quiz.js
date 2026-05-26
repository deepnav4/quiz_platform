import { apiRequest } from './client.js';

export function createQuiz(data) {
  return apiRequest('/quizzes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getQuizzes() {
  return apiRequest('/quizzes');
}

export function getQuiz(quizId) {
  return apiRequest(`/quizzes/${quizId}`);
}

export function updateQuiz(quizId, data) {
  return apiRequest(`/quizzes/${quizId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteQuiz(quizId) {
  return apiRequest(`/quizzes/${quizId}`, {
    method: 'DELETE',
  });
}
