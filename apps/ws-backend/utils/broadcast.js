import { WebSocket } from "ws";
import { getRoom } from "./rooms.js";

/**
 * Broadcast a JSON message to all connections in a session room.
 */
export function broadcastToRoom(sessionId, message) {
  const room = getRoom(sessionId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Send a JSON message to a single WebSocket connection.
 */
export function sendToOne(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a JSON message to all connections in a room except one.
 */
export function broadcastToRoomExcept(sessionId, excludeWs, message) {
  const room = getRoom(sessionId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
