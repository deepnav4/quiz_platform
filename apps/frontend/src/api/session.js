import { apiRequest } from './client.js';

async function tryApi(fn, mockFn) {
  try { return await fn(); } catch { return mockFn(); }
}

export function createSession(data) {
  return tryApi(
    () => apiRequest('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    () => ({ session: { id: 'session-' + Date.now(), quizId: data.quizId, joinCode: String(Math.floor(10000000 + Math.random() * 90000000)), status: 'WAITING' } })
  );
}

export function getSession(sessionId) {
  return tryApi(
    () => apiRequest(`/sessions/${sessionId}`),
    () => ({ session: { id: sessionId, joinCode: '12345678', status: 'ACTIVE', participantCount: 5 } })
  );
}

export function joinSession(joinCode) {
  return tryApi(
    () => apiRequest('/sessions/join', { method: 'POST', body: JSON.stringify({ joinCode }) }),
    () => ({ session: { id: 'session-joined-' + Date.now(), joinCode, status: 'WAITING' } })
  );
}
