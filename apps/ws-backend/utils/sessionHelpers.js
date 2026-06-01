/** True when userId is the session host (not a quiz participant). */
export function isSessionHost(session, userId) {
  if (!session?.hostId || !userId) return false;
  return String(session.hostId) === String(userId);
}
