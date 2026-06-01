import { useEffect, useRef, useCallback, useState } from 'react';

function isFullscreenActive() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement
  );
}

/**
 * When host leaves browser fullscreen during a live question, pause the quiz.
 * When they return to fullscreen, resume automatically.
 */
export function useHostFullscreenPause({ sessionId, sendMessage, quizActive }) {
  const [pausedByFullscreen, setPausedByFullscreen] = useState(false);
  const wasFullscreenRef = useRef(false);
  const pausedByFullscreenRef = useRef(false);

  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      /* user denied or unsupported */
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      const inFs = isFullscreenActive();

      if (inFs) {
        wasFullscreenRef.current = true;
        if (pausedByFullscreenRef.current && quizActive) {
          sendMessage('resume_quiz', { sessionId });
          pausedByFullscreenRef.current = false;
          setPausedByFullscreen(false);
        }
        return;
      }

      if (wasFullscreenRef.current && quizActive && !pausedByFullscreenRef.current) {
        sendMessage('pause_quiz', { sessionId });
        pausedByFullscreenRef.current = true;
        setPausedByFullscreen(true);
        wasFullscreenRef.current = false;
      }
    };

    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);

    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [sessionId, sendMessage, quizActive]);

  useEffect(() => {
    if (!quizActive) {
      pausedByFullscreenRef.current = false;
      setPausedByFullscreen(false);
    }
  }, [quizActive]);

  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive);

  useEffect(() => {
    const sync = () => setIsFullscreen(isFullscreenActive());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  return { pausedByFullscreen, requestFullscreen, isFullscreen };
}
