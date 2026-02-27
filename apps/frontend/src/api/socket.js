const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

export function createSocket(token) {
  // TODO: create WebSocket connection with token as query param
}

export function sendMessage(socket, type, data) {
  // TODO: send JSON message { type, data } over socket
}

export function onMessage(socket, callback) {
  // TODO: listen for messages, parse JSON, call callback(type, data)
}
