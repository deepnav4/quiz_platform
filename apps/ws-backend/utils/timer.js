// In-memory map: sessionId -> { timerId, expiresAt }
const timers = new Map();

/**
 * Start a countdown timer for a session. Cancels any existing timer first.
 * @param {string} sessionId
 * @param {number} durationMs - Duration in milliseconds.
 * @param {Function} onExpire - Callback invoked when the timer expires.
 */
export function startTimer(sessionId, durationMs, onExpire) {
  // Clear any existing timer for this session
  stopTimer(sessionId);

  const timerId = setTimeout(() => {
    timers.delete(sessionId);
    onExpire();
  }, durationMs);

  timers.set(sessionId, {
    timerId,
    expiresAt: Date.now() + durationMs,
  });
}

/**
 * Stop and clear the timer for a session.
 */
export function stopTimer(sessionId) {
  const timer = timers.get(sessionId);
  if (timer) {
    clearTimeout(timer.timerId);
    timers.delete(sessionId);
  }
}

/**
 * Get the remaining time in milliseconds for a session's timer.
 * @returns {number} Remaining ms, or 0 if no timer is active.
 */
export function getRemainingTime(sessionId) {
  const timer = timers.get(sessionId);
  if (!timer) return 0;
  const remaining = timer.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}
