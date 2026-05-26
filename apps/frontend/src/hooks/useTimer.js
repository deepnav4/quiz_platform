import { useState, useEffect, useRef } from 'react';

export function useTimer(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds ?? 0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, seconds > 0]);

  function start(secs) {
    if (secs !== undefined) setSeconds(secs);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    clearInterval(intervalRef.current);
  }

  function reset(secs) {
    stop();
    setSeconds(secs ?? 0);
  }

  return { seconds, running, start, stop, reset };
}
