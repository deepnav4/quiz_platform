// In-memory map: sessionId -> timer reference
const timers = new Map();

export function startTimer(sessionId, durationMs, onExpire) {
  // TODO: start countdown, call onExpire when time runs out
}

export function stopTimer(sessionId) {
  // TODO: clear the timer for a session
}

export function getRemainingTime(sessionId) {
  // TODO: return milliseconds remaining on the timer
}
