const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export function createSocket(token) {
  // Ensure token is safely encoded for URL usage
  const q = token ? `?token=${encodeURIComponent(token)}` : '';
  return new WebSocket(`${WS_URL}${q}`);
}

export function sendMessage(socket, type, data) {
  if (!socket) {
    console.warn('WS: sendMessage called with no socket');
    return false;
  }
  if (socket.readyState !== WebSocket.OPEN) {
    console.warn('WS: socket not open, message dropped', type, data);
    return false;
  }
  socket.send(JSON.stringify({ type, data }));
  return true;
}

export function onMessage(socket, callback) {
  if (!socket) return () => {};
  const handler = (event) => {
    try {
      const msg = JSON.parse(event.data);
      callback(msg);
    } catch (e) {
      console.error('Failed to parse WS message', e);
    }
  };
  socket.addEventListener('message', handler);
  return () => socket.removeEventListener('message', handler);
}
