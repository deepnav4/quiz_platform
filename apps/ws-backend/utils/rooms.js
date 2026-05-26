// In-memory map: sessionId -> Set of ws connections
const rooms = new Map();

/**
 * Add a WebSocket connection to a session room.
 */
export function addToRoom(sessionId, ws) {
  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, new Set());
  }
  rooms.get(sessionId).add(ws);
}

/**
 * Remove a WebSocket connection from a session room.
 * Cleans up empty rooms automatically.
 */
export function removeFromRoom(sessionId, ws) {
  const room = rooms.get(sessionId);
  if (!room) return;
  room.delete(ws);
  if (room.size === 0) {
    rooms.delete(sessionId);
  }
}

/**
 * Get all WebSocket connections in a session room.
 * @returns {Set<WebSocket> | undefined}
 */
export function getRoom(sessionId) {
  return rooms.get(sessionId);
}

/**
 * Get the number of connections in a session room.
 * @returns {number}
 */
export function getRoomSize(sessionId) {
  const room = rooms.get(sessionId);
  return room ? room.size : 0;
}
