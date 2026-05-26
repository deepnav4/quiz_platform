// In-memory map: sessionId -> { timer, startTime, durationMs }
const timers = new Map();

export function startTimer(sessionId, durationMs, onExpire) {
  stopTimer(sessionId);
  const entry = {
    startTime: Date.now(),
    durationMs,
    timer: setTimeout(() => {
      timers.delete(sessionId);
      if (onExpire) onExpire();
    }, durationMs),
  };
  timers.set(sessionId, entry);
}

export function stopTimer(sessionId) {
  const entry = timers.get(sessionId);
  if (entry) {
    clearTimeout(entry.timer);
    timers.delete(sessionId);
  }
}

export function getRemainingTime(sessionId) {
  const entry = timers.get(sessionId);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.startTime;
  return Math.max(0, entry.durationMs - elapsed);
}
