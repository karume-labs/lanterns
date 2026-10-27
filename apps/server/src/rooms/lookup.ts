import type { Player } from "@lanterns/domain";
import { RoomError } from "./errors";
import type { RuntimeRoom } from "./runtime";

export const findRoom = (
  rooms: ReadonlyMap<string, RuntimeRoom>,
  code: string,
): RuntimeRoom | null => rooms.get(code.toUpperCase()) ?? null;

/** Resolve a room by code or throw a player-facing error. */
export const roomOf = (
  rooms: ReadonlyMap<string, RuntimeRoom>,
  code: string,
): RuntimeRoom => {
  const room = findRoom(rooms, code);
  if (!room)
    throw new RoomError("room-not-found", "No room exists with that code.");
  return room;
};

/** Resolve a player inside a room or throw a player-facing error. */
export const playerOf = (room: RuntimeRoom, playerId: string): Player => {
  const player = room.state.players.find(
    (candidate) => candidate.id === playerId,
  );
  if (!player)
    throw new RoomError("player-not-found", "This player has left the room.");
  return player;
};
