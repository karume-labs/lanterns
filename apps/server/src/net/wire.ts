import type { ServerMessage } from "@lanterns/domain";
import type { Metrics } from "../metrics";
import type { RoomManager } from "../rooms/room-manager";
import type { MutationResult } from "../rooms/runtime";

export interface SocketData {
  playerId: string;
  socketId: string;
  roomCode?: string;
  /** sliding one-second message counter for rate limiting */
  rateCount: number;
  rateWindow: number;
}

export type Socket = Bun.ServerWebSocket<SocketData>;
export type WireServer = Bun.Server<SocketData>;

export interface DispatchContext {
  rooms: RoomManager;
  server: WireServer;
  now: number;
  metrics: Metrics;
}

export const reply = (socket: Socket, message: ServerMessage): void => {
  socket.send(JSON.stringify(message));
};

export const publish = (
  server: WireServer,
  roomCode: string,
  message: ServerMessage,
): void => {
  server.publish(roomCode, JSON.stringify(message));
};

/** Subscribe a socket to a room channel, leaving any previous one. */
export const moveToRoom = (socket: Socket, roomCode: string): void => {
  if (socket.data.roomCode) socket.unsubscribe(socket.data.roomCode);
  socket.data.roomCode = roomCode;
  socket.subscribe(roomCode);
};

export const leaveRoomChannel = (socket: Socket): void => {
  if (!socket.data.roomCode) return;
  socket.unsubscribe(socket.data.roomCode);
  socket.data.roomCode = undefined;
};

/** Announce events, the resulting room state, and any rolled level-up. */
export const publishMutation = (
  server: WireServer,
  result: MutationResult,
): void => {
  const code = result.room.code;
  for (const event of result.events)
    publish(server, code, {
      type: "room-event",
      event: event.event,
      playerId: event.playerId,
      name: event.name,
    });
  publish(server, code, { type: "room-state", room: result.room });
  if (result.levelUp)
    publish(server, code, {
      type: "level-up",
      choices: result.room.upgradeChoices,
      level: result.room.teamLevel,
    });
};
