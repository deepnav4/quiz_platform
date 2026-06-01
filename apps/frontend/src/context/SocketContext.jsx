import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { createSocket, sendMessage as wsSendMessage } from '../api/socket.js';

const SocketContext = createContext(null);

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}

/** Auth failure codes that should NOT trigger a reconnect */
const AUTH_CLOSE_CODES = new Set([4001, 4000, 4003]);

/** Maximum automatic reconnection attempts before giving up */
const MAX_RECONNECT = 8;

export function SocketProvider({ children }) {
  const { token, user, loading: authLoading } = useAuth();
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [wsError, setWsError] = useState(null);       // e.g. { code, reason }
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Clear previous connection
    clearTimeout(reconnectTimer.current);
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    setSocket(null);
    setConnected(false);
    setWsError(null);

    // Wait for auth restore; don't connect without token or user
    if (authLoading || !token || !user) return;

    // Don't even try connecting with obviously-invalid tokens in production
    // Mock tokens ('mock-token-…') are allowed in dev since the WS backend handles them
    // Real JWTs start with 'eyJ'
    // Let both types through and let the server decide
    if (!token || token.length < 10) return;

    reconnectAttempts.current = 0;

    function connect() {
      if (!mountedRef.current) return;

      try {
        const ws = createSocket(token);
        socketRef.current = ws;
        setSocket(ws);
        setWsError(null);

        ws.onopen = () => {
          if (!mountedRef.current) return;
          reconnectAttempts.current = 0;
          setConnected(true);
          setWsError(null);
          console.log('[WS] Connected');
        };

        ws.onclose = (ev) => {
          if (!mountedRef.current) return;
          console.warn('[WS] Closed', ev.code, ev.reason);
          setConnected(false);
          setSocket(null);
          socketRef.current = null;

          // ── Auth failure → STOP retrying ──
          if (AUTH_CLOSE_CODES.has(ev.code)) {
            setWsError({
              code: ev.code,
              reason: ev.reason || 'Authentication failed',
              isAuthError: true,
            });
            console.error(`[WS] Auth failure (${ev.code}). Not retrying. User may need to re-login.`);
            return; // ← no reconnect
          }

          // ── Normal / network close → retry with backoff ──
          if (reconnectAttempts.current >= MAX_RECONNECT) {
            setWsError({
              code: ev.code,
              reason: 'Connection lost after multiple retries',
              isAuthError: false,
            });
            console.error('[WS] Max reconnect attempts reached. Giving up.');
            return;
          }

          reconnectAttempts.current += 1;
          const wait = Math.min(30000, 1000 * 2 ** reconnectAttempts.current);
          console.log(`[WS] Reconnecting in ${wait}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT})…`);
          reconnectTimer.current = setTimeout(connect, wait);
        };

        ws.onerror = () => {
          // onclose will fire right after — let it handle everything
        };
      } catch (err) {
        console.error('[WS] Failed to create socket:', err);
        setWsError({ code: 0, reason: err.message, isAuthError: false });
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnected(false);
      setSocket(null);
    };
  }, [token, user, authLoading]);

  const sendMessage = useCallback((type, data) => {
    return wsSendMessage(socketRef.current, type, data);
  }, []);

  /** Allow components to request a reconnect after error (e.g. after re-login) */
  const reconnect = useCallback(() => {
    setWsError(null);
    reconnectAttempts.current = 0;
    // Force the useEffect to re-run by doing a tiny state toggle — but actually
    // since we depend on [token, user], a re-login will naturally re-trigger.
    // For manual retry, close existing + re-create:
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    if (token && user) {
      const ws = createSocket(token);
      socketRef.current = ws;
      setSocket(ws);
      setWsError(null);

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        setConnected(true);
        setWsError(null);
      };

      ws.onclose = (ev) => {
        setConnected(false);
        setSocket(null);
        socketRef.current = null;
        if (AUTH_CLOSE_CODES.has(ev.code)) {
          setWsError({ code: ev.code, reason: ev.reason || 'Authentication failed', isAuthError: true });
        }
      };

      ws.onerror = () => {};
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, sendMessage, connected, wsError, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
}
