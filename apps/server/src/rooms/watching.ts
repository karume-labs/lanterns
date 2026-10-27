import { MAX_PLAYERS_PER_ROOM } from "@lanterns/domain";
import { RoomError } from "./errors";
import { findRoom } from "./lookup";
import type { MutationResult, RuntimeRoom } from "./runtime";

type Rooms = Map<string, RuntimeRoom>;

/** Cap on concurrent watchers so snapshot fan-out stays bounded. */
const MAX_SPECTATORS = MAX_PLAYERS_PER_ROOM * 2;

/**
 * Join a running match as a watcher: subscribed to the room channel for
 * snapshots and room state, never simulated and never able to send input.
 * The hub refuses watchers so a spectator is always watching a live run.
 */
export const watchRoom = (
  rooms: Rooms,
  code: string,
  playerId: string,
  name: string,
  socketId: string,
): MutationResult & { token: string } => {
  const room = findRoom(rooms, code);
  if (!room)
    throw new RoomError("room-not-found", "No room exists with that code.");
  if (room.state.phase === "lobby" || room.state.phase === "countdown")
    throw new RoomError(
      "not-in-match",
      "That room is in the hub - join it normally to play.",
    );
  if (room.spectators.size >= MAX_SPECTATORS)
    throw new RoomError(
      "room-full",
      "This room already has as many watchers as it can hold.",
    );
  const token = crypto.randomUUID();
  room.spectators.set(playerId, name);
  room.tokens.set(token, playerId);
  room.sockets.set(playerId, socketId);
  room.disconnectedAt.delete(playerId);
  return {
    room: room.state,
    events: [],
    levelUp: false,
    spectator: true,
    token,
  };
};
