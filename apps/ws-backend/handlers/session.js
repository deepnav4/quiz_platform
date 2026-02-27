import { addToRoom, removeFromRoom } from "../utils/rooms.js";
import { broadcastToRoom } from "../utils/broadcast.js";

export async function handleJoinSession(ws, data) {
  // TODO: validate join code, add participant to session + room
  // TODO: broadcast "participant_joined" to room
}

export async function handleLeaveSession(ws, data) {
  // TODO: remove from room, update isActive
  // TODO: broadcast "participant_left" to room
}
