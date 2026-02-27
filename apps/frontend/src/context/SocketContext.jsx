import { createContext, useContext } from "react";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  // TODO: create and manage WebSocket connection, provide send/on methods
  return <SocketContext.Provider value={{}}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
