import { verifyWsToken } from "../utils/auth.js";
import { addToRoom } from "../utils/rooms.js";

export function handleConnection(ws, req) {
  // TODO: verify token from query string, store user info on ws
  // TODO: send welcome message
}

export function handleDisconnect(ws) {
  // TODO: remove from room, update lastSeenAt, set isActive = false
}
