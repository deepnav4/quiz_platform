const WS_URL = 'ws://localhost:8080';

export function createSocket(token) {
  return new WebSocket(`${WS_URL}?token=${token}`);
}

export function sendMessage(socket, type, data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data }));
  }
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
