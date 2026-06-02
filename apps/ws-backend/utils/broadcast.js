import { getRoom } from "./rooms.js";

export function broadcastToRoom(sessionId, message) {
  const room = getRoom(sessionId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const ws of room) {
    if (ws.readyState === 1) ws.send(data);
  }
}

export function sendToOne(ws, message) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(message));
  }
}

export function broadcastToRoomExcept(sessionId, excludeWs, message) {
  const room = getRoom(sessionId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const ws of room) {
    if (ws !== excludeWs && ws.readyState === 1) ws.send(data);
  }
}

/** Send to a single connected user in a session room. */
export function sendToUserInRoom(sessionId, userId, message) {
  const room = getRoom(sessionId);
  if (!room || !userId) return;
  const data = JSON.stringify(message);
  for (const ws of room) {
    if (ws.user && String(ws.user.id) === String(userId) && ws.readyState === 1) {
      ws.send(data);
    }
  }
}

/** Notify session host only. */
export function sendToHost(sessionId, hostId, message) {
  sendToUserInRoom(sessionId, hostId, message);
}

/** Everyone in the room except the host. */
export function broadcastToParticipants(sessionId, hostId, message) {
  const room = getRoom(sessionId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const ws of room) {
    if (ws.user && String(ws.user.id) !== String(hostId) && ws.readyState === 1) {
      ws.send(data);
    }
  }
}
