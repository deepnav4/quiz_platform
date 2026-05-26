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
