import { broadcastToRoom } from "../utils/broadcast.js";

export async function handleNextQuestion(ws, data) {
  // TODO: advance session state to next question
  // TODO: broadcast "question_started" with question data to room
}

export async function handleSubmitResponse(ws, data) {
  // TODO: save response, calculate points
  // TODO: send "response_received" back to participant
  // TODO: broadcast updated response count to host
}
