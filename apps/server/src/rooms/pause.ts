import { RoomError } from "./errors";
import { playerOf, roomOf } from "./lookup";
import type { MutationResult, RuntimeRoom } from "./runtime";

type Rooms = ReadonlyMap<string, RuntimeRoom>;

/**
 * The simulation clock: wall time with this match's accumulated pause time
 * removed. Only read while the room is running - the tick freezes the clock
 * by skipping the sim step entirely, then banks the paused span into
 * `pausedTotalMs` on the tick where the pause ends.
 */
export const gameClock = (room: RuntimeRoom, now: number): number =>
  now - room.pausedTotalMs;

/** Bank a finished pause so sim time never advances across it. */
export const settlePause = (room: RuntimeRoom, now: number): void => {
  if (room.pauseStart === null) return;
  room.pausedTotalMs += now - room.pauseStart;
  room.pauseStart = null;
};

/** Drop one player's pause request; the room resumes when the last one goes. */
export const releasePause = (room: RuntimeRoom, playerId: string): boolean => {
  if (!room.pauseBy.delete(playerId)) return false;
  if (room.pauseBy.size === 0 && room.state.paused) {
    room.state.paused = false;
    room.dirty = true;
  }
  return true;
};

/**
 * Open or close the in-match menu. While at least one player has it open the
 * whole room's simulation is frozen: clock, enemies, spawning, movement.
 */
export const setPause = (
  rooms: Rooms,
  code: string,
  playerId: string,
  paused: boolean,
  now: number,
): MutationResult => {
  const room = roomOf(rooms, code);
  // Watchers may open the menu locally but never hold up other players.
  if (room.spectators.has(playerId))
    return { room: room.state, events: [], levelUp: false };
  playerOf(room, playerId);
  if (!paused) {
    const wasPaused = room.state.paused;
    releasePause(room, playerId);
    const resumed = wasPaused && !room.state.paused;
    return {
      room: room.state,
      events: resumed
        ? [{ event: "game-resumed", playerId, name: nameOf(room, playerId) }]
        : [],
      levelUp: false,
    };
  }
  if (room.state.phase !== "active")
    throw new RoomError("wrong-phase", "Only a running match can be paused.");
  const first = !room.state.paused;
  room.pauseBy.add(playerId);
  room.state.paused = true;
  if (first) {
    room.pauseStart = now;
    room.dirty = true;
    return {
      room: room.state,
      events: [
        { event: "game-paused", playerId, name: nameOf(room, playerId) },
      ],
      levelUp: false,
    };
  }
  return { room: room.state, events: [], levelUp: false };
};

const nameOf = (room: RuntimeRoom, playerId: string): string =>
  room.state.players.find((player) => player.id === playerId)?.name ?? "";
