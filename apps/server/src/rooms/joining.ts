import { MAX_PLAYERS_PER_ROOM, type RoomState } from "@lanterns/domain";
import { RoomError } from "./errors";
import { createPlayer, createRoomCode } from "./factories";
import { findRoom } from "./lookup";
import {
  createRoomState,
  createRuntimeRoom,
  type MutationResult,
  type RuntimeRoom,
} from "./runtime";

type Rooms = Map<string, RuntimeRoom>;

/** Create a fresh room with the caller as its host. */
export const createRoom = (
  rooms: Rooms,
  playerId: string,
  name: string,
  socketId: string,
): { room: RoomState; token: string } => {
  const code = createRoomCode(rooms);
  const player = createPlayer(playerId, name, 0);
  const token = crypto.randomUUID();
  const room = createRuntimeRoom(
    createRoomState(code, player),
    token,
    playerId,
    socketId,
  );
  rooms.set(code, room);
  return { room: room.state, token };
};

/** Join a lobby or running countdown by room code. */
export const joinRoom = (
  rooms: Rooms,
  code: string,
  playerId: string,
  name: string,
  socketId: string,
): MutationResult & { token: string } => {
  const room = findRoom(rooms, code);
  if (!room)
    throw new RoomError("room-not-found", "No room exists with that code.");
  if (room.state.phase !== "lobby" && room.state.phase !== "countdown")
    throw new RoomError(
      "match-in-progress",
      "This room is mid-match. Try again after the run ends.",
    );
  const connected = room.state.players.filter((p) => p.connected).length;
  if (connected >= MAX_PLAYERS_PER_ROOM)
    throw new RoomError("room-full", "This room already has four players.");
  if (room.state.players.some((player) => player.id === playerId))
    throw new RoomError("not-in-room", "You are already in this room.");

  const index = room.state.players.length;
  const player = createPlayer(playerId, name, index);
  room.state.players.push(player);
  room.sockets.set(playerId, socketId);
  room.disconnectedAt.delete(playerId);
  room.prevReady.set(playerId, false);
  room.dirty = true;
  const token = crypto.randomUUID();
  room.tokens.set(token, playerId);
  return {
    room: room.state,
    events: [{ event: "player-joined", playerId, name: player.name }],
    levelUp: false,
    token,
  };
};

/** Reclaim a disconnected player with their reconnect token. */
export const rejoinRoom = (
  rooms: Rooms,
  token: string,
  socketId: string,
): MutationResult & { playerId: string } => {
  for (const room of rooms.values()) {
    const playerId = room.tokens.get(token);
    if (!playerId) continue;
    const player = room.state.players.find(
      (candidate) => candidate.id === playerId,
    );
    if (!player)
      throw new RoomError(
        "rejoin-failed",
        "Your reconnect token is no longer valid.",
      );
    const wasGone = !player.connected;
    player.connected = true;
    room.sockets.set(playerId, socketId);
    room.disconnectedAt.delete(playerId);
    room.dirty = true;
    return {
      room: room.state,
      playerId,
      events: wasGone
        ? [{ event: "player-reconnected", playerId, name: player.name }]
        : [],
      levelUp: false,
    };
  }
  throw new RoomError(
    "rejoin-failed",
    "The reconnect token is invalid or expired.",
  );
};
