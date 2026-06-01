import { useEffect, useCallback } from 'react';

/**
 * Hook to enter browser fullscreen mode.
 * - Requests fullscreen on mount (after a small delay for smooth transition).
 * - Provides `exitFullscreen()` to leave fullscreen.
 * - Automatically exits fullscreen on unmount if `exitOnUnmount` is true.
 */
export function useFullscreen(enabled = true, exitOnUnmount = false) {
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (document.fullscreenElement) return; // already fullscreen
    try {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } catch (e) {
      // Fullscreen may be blocked by browser policy — ignore silently
      console.warn('[Fullscreen] Request denied:', e.message);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (!document.fullscreenElement) return;
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (e) {
      console.warn('[Fullscreen] Exit denied:', e.message);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Short delay so the page renders first (browser requires recent user gesture)
    const timer = setTimeout(enterFullscreen, 400);
    return () => {
      clearTimeout(timer);
      if (exitOnUnmount) exitFullscreen();
    };
  }, [enabled, enterFullscreen, exitFullscreen, exitOnUnmount]);

  return { enterFullscreen, exitFullscreen };
}

/**
 * Standalone helper — can be called from event handlers (requires user gesture).
 */
export function requestFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement) return;
  try {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } catch (e) { /* ignore */ }
}

export function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } catch (e) { /* ignore */ }
}
