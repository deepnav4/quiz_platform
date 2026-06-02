import { PRODUCTION_API_BASE, PRODUCTION_WS_URL } from './deploy.js';

function isLocalHost() {
  if (typeof window === 'undefined') return import.meta.env.DEV;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

function normalizeApiBase(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

/** Resolve HTTP API base for fetch calls. */
export function getApiBaseUrl() {
  const fromEnv = normalizeApiBase(
    import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || ''
  );

  if (fromEnv && !fromEnv.includes('localhost')) {
    return fromEnv;
  }

  if (!isLocalHost()) {
    if (fromEnv?.includes('localhost')) {
      console.warn(
        '[Quizora] VITE_API_BASE points to localhost on a deployed site — using deploy.js instead.'
      );
    }
    return normalizeApiBase(PRODUCTION_API_BASE);
  }

  return fromEnv || 'http://localhost:3000/api';
}

/** Resolve WebSocket URL. */
export function getWsUrl() {
  const fromEnv = (import.meta.env.VITE_WS_URL || '').trim();

  if (fromEnv && !fromEnv.includes('localhost')) {
    return fromEnv;
  }

  if (!isLocalHost()) {
    return PRODUCTION_WS_URL;
  }

  return fromEnv || 'ws://localhost:8080';
}
