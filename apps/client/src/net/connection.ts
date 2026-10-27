import { GameSocket, type SocketHandlers } from "./socket";

let socket: GameSocket | null = null;

/** App opens the connection once; features send through getSocket(). */
export const openConnection = (handlers: SocketHandlers): GameSocket => {
  socket?.close();
  socket = new GameSocket(handlers);
  socket.connect();
  return socket;
};

export const getSocket = (): GameSocket | null => socket;

export const closeConnection = (): void => {
  socket?.close();
  socket = null;
};
