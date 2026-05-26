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
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);

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

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
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
    wsSendMessage(socketRef.current, type, data);
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, sendMessage, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
