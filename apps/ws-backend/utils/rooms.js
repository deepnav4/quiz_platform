// In-memory map: sessionId -> Set of ws connections
const rooms = new Map();

export function addToRoom(sessionId, ws) {
  // TODO: add ws connection to the session's room
}

export function removeFromRoom(sessionId, ws) {
  // TODO: remove ws connection from the session's room
}

export function getRoom(sessionId) {
  // TODO: return all ws connections in a session's room
}

export function getRoomSize(sessionId) {
  // TODO: return number of connections in a room
}
