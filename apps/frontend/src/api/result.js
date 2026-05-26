import { apiRequest } from './client.js';

export function getResults(sessionId) {
  return apiRequest(`/results/${sessionId}`);
}

export function getLeaderboard(sessionId) {
  return apiRequest(`/results/${sessionId}/leaderboard`);
}

export function getQuestionResult(sessionId, questionId) {
  return apiRequest(`/results/${sessionId}/questions/${questionId}`);
}
