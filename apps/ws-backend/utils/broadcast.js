import { getRoom } from "./rooms.js";

export function broadcastToRoom(sessionId, message) {
  // TODO: send JSON message to all connections in the room
}

export function sendToOne(ws, message) {
  // TODO: send JSON message to a single connection
}

export function broadcastToRoomExcept(sessionId, excludeWs, message) {
  // TODO: send to all in room except one connection
}
