/**
 * Production URLs — used on Vercel (non-localhost) when env vars are missing.
 * Update after deploy, then push + redeploy frontend.
 */
export const PRODUCTION_API_BASE = 'https://quiz-platform-1-x3iu.onrender.com/api';
/** Separate Render Web Service for ws-backend (not the HTTP API URL). */
export const PRODUCTION_WS_URL = 'wss://quiz-platform-1-x3iu.onrender.com';
