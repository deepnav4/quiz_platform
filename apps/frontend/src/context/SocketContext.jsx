import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { createSocket, sendMessage as wsSendMessage } from '../api/socket.js';

const SocketContext = createContext(null);

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    function connect() {
      const ws = createSocket(token);
      socketRef.current = ws;
      setSocket(ws);

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        setConnected(true);
      };

      ws.onclose = (ev) => {
        console.warn('WS closed', ev.code, ev.reason);
        setConnected(false);
        setSocket(null);
        // exponential backoff with cap
        reconnectAttempts.current = Math.min(10, reconnectAttempts.current + 1);
        const wait = Math.min(30000, 500 * 2 ** reconnectAttempts.current);
        reconnectTimer.current = setTimeout(connect, wait);
      };

      ws.onerror = (e) => {
        // Let onclose/reconnect handle it
        try { ws.close(); } catch (err) { /* ignore */ }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [token, user]);

  const sendMessage = useCallback((type, data) => {
    return wsSendMessage(socketRef.current, type, data);
  }, []);
  return (
    <SocketContext.Provider value={{ socket, sendMessage, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
