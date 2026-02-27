import { apiRequest } from "./client.js";

export async function createSession(quizId, settings) {
  // TODO: POST /sessions
}

export async function getSession(sessionId) {
  // TODO: GET /sessions/:sessionId
}

export async function joinSession(joinCode) {
  // TODO: POST /sessions/join
}

export async function startSession(sessionId) {
  // TODO: PUT /sessions/:sessionId/start
}

export async function endSession(sessionId) {
  // TODO: PUT /sessions/:sessionId/end
}
