import type { ClientMessage } from "@lanterns/domain";
import { recordReject } from "../metrics";
import { RoomError } from "../rooms/errors";
import type { DispatchContext, Socket } from "./wire";
import { publishMutation } from "./wire";

type RoomScopedMessage = Extract<
  ClientMessage,
  {
    type:
      | "input"
      | "select-role"
      | "start-match"
      | "return-lobby"
      | "choose-upgrade"
      | "place-construct";
  }
>;

const ROOM_SCOPED_TYPES = new Set<string>([
  "input",
  "select-role",
  "start-match",
  "return-lobby",
  "choose-upgrade",
  "place-construct",
]);

export const isRoomScoped = (
  message: ClientMessage,
): message is RoomScopedMessage => ROOM_SCOPED_TYPES.has(message.type);

const roomCodeOf = (socket: Socket): string => {
  if (!socket.data.roomCode)
    throw new RoomError("not-in-room", "Join a room first.");
  return socket.data.roomCode;
};

/** Handle messages that require room membership and a phase check. */
export const dispatchRoomMessage = (
  socket: Socket,
  message: RoomScopedMessage,
  ctx: DispatchContext,
): void => {
  const playerId = socket.data.playerId;
  if (message.type === "input") {
    // Input is a stream: drop it silently until the socket has a room.
    if (!socket.data.roomCode) {
      recordReject(ctx.metrics, "not-in-room");
      return;
    }
    ctx.rooms.setInput(socket.data.roomCode, playerId, message.input);
    return;
  }
  const code = roomCodeOf(socket);
  switch (message.type) {
    case "select-role":
      publishMutation(
        ctx.server,
        ctx.rooms.selectRole(code, playerId, message.role),
      );
      return;
    case "start-match":
      publishMutation(
        ctx.server,
        ctx.rooms.requestStart(code, playerId, ctx.now),
      );
      return;
    case "return-lobby":
      publishMutation(
        ctx.server,
        ctx.rooms.returnToLobby(code, playerId, ctx.now),
      );
      return;
    case "choose-upgrade":
      publishMutation(
        ctx.server,
        ctx.rooms.chooseUpgrade(code, playerId, message.upgradeId),
      );
      return;
    case "place-construct":
      ctx.rooms.placeConstruct(
        code,
        playerId,
        message.position,
        message.kind,
        ctx.now,
      );
      return;
  }
};
