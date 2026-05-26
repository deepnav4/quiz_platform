import { apiRequest } from './client.js';

export function createSession(data) {
  return apiRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getSession(sessionId) {
  return apiRequest(`/sessions/${sessionId}`);
}

export function joinSession(joinCode) {
  return apiRequest('/sessions/join', {
    method: 'POST',
    body: JSON.stringify({ joinCode }),
  });
}

export function startSession(sessionId) {
  return apiRequest(`/sessions/${sessionId}/start`, {
    method: 'PUT',
  });
}

export function endSession(sessionId) {
  return apiRequest(`/sessions/${sessionId}/end`, {
    method: 'PUT',
  });
}
