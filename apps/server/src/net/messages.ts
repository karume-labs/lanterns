import type { ClientMessage, ServerMessage } from "@lanterns/domain";
import { PROTOCOL_VERSION } from "@lanterns/domain";
import { recordReject } from "../metrics";
import { RoomError } from "../rooms/errors";
import { dispatchRoomMessage, isRoomScoped } from "./room-messages";
import {
  type DispatchContext,
  leaveRoomChannel,
  moveToRoom,
  publish,
  publishMutation,
  reply,
  type Socket,
} from "./wire";

const welcome = (
  socket: Socket,
  roomCode: string,
  token: string,
  spectator?: boolean,
): ServerMessage => ({
  type: "welcome",
  playerId: socket.data.playerId,
  reconnectToken: token,
  roomCode,
  protocol: PROTOCOL_VERSION,
  spectator,
});

/** Route one validated message; RoomErrors become player-facing errors. */
export const handleMessage = (
  socket: Socket,
  message: ClientMessage,
  ctx: DispatchContext,
): void => {
  try {
    if (isRoomScoped(message)) dispatchRoomMessage(socket, message, ctx);
    else dispatchConnection(socket, message, ctx);
  } catch (error) {
    const known = error instanceof RoomError;
    if (known) recordReject(ctx.metrics, error.code);
    if (!known) console.error("message failed", error);
    reply(socket, {
      type: "error",
      code: known ? error.code : "server-error",
      message: known ? error.message : "Unable to complete that request.",
    });
  }
};

/** Connection-lifecycle messages that do not require room membership. */
const dispatchConnection = (
  socket: Socket,
  message: ClientMessage,
  ctx: DispatchContext,
): void => {
  switch (message.type) {
    case "ping": {
      reply(socket, {
        type: "pong",
        sentAt: message.sentAt,
        serverTime: ctx.now,
      });
      return;
    }
    case "create-room": {
      const created = ctx.rooms.createRoom(
        socket.data.playerId,
        message.name,
        socket.data.socketId,
      );
      moveToRoom(socket, created.room.code);
      reply(socket, welcome(socket, created.room.code, created.token));
      publish(ctx.server, created.room.code, {
        type: "room-state",
        room: created.room,
      });
      return;
    }
    case "join-room": {
      const joined = ctx.rooms.joinRoom(
        message.code,
        socket.data.playerId,
        message.name,
        socket.data.socketId,
      );
      moveToRoom(socket, joined.room.code);
      reply(socket, welcome(socket, joined.room.code, joined.token));
      publishMutation(ctx.server, joined);
      return;
    }
    case "watch-room": {
      const watched = ctx.rooms.watchRoom(
        message.code,
        socket.data.playerId,
        message.name,
        socket.data.socketId,
      );
      moveToRoom(socket, watched.room.code);
      reply(socket, welcome(socket, watched.room.code, watched.token, true));
      // Watchers join mid-run: hand them the room state straight away.
      reply(socket, { type: "room-state", room: watched.room });
      return;
    }
    case "rejoin-room": {
      const rejoined = ctx.rooms.rejoinRoom(
        message.token,
        socket.data.socketId,
      );
      socket.data.playerId = rejoined.playerId;
      moveToRoom(socket, rejoined.room.code);
      reply(
        socket,
        welcome(socket, rejoined.room.code, message.token, rejoined.spectator),
      );
      publishMutation(ctx.server, rejoined);
      ctx.metrics.reconnects += 1;
      return;
    }
    case "leave-room": {
      const left = ctx.rooms.leaveRoom(
        socket.data.playerId,
        socket.data.socketId,
      );
      leaveRoomChannel(socket);
      if (left) publishMutation(ctx.server, left);
      return;
    }
    default:
      reply(socket, {
        type: "error",
        code: "unsupported-message",
        message: "That action is not available here.",
      });
  }
};
