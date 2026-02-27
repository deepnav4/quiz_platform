import { broadcastToRoom } from "../utils/broadcast.js";
import { startTimer, stopTimer } from "../utils/timer.js";

export async function handleStartQuiz(ws, data) {
  // TODO: set session status to LIVE, broadcast "quiz_started" to room
}

export async function handlePauseQuiz(ws, data) {
  // TODO: set session status to PAUSED, stop timer, broadcast "quiz_paused"
}

export async function handleResumeQuiz(ws, data) {
  // TODO: set session status to LIVE, restart timer, broadcast "quiz_resumed"
}

export async function handleEndQuiz(ws, data) {
  // TODO: set session status to COMPLETED, calculate final scores, broadcast "quiz_ended"
}
