import { type InputState, normalizeInput, type Role } from "@lanterns/domain";
import { endToLobby } from "../sim/lifecycle";
import { allReady, beginCountdown, respawnAtHub } from "./countdown";
import { RoomError } from "./errors";
import { playerOf, roomOf } from "./lookup";
import type { MutationResult, RuntimeRoom } from "./runtime";

type Rooms = ReadonlyMap<string, RuntimeRoom>;

export const setInput = (
  rooms: Rooms,
  code: string,
  playerId: string,
  input: InputState,
): void => {
  const room = roomOf(rooms, code);
  // Watchers receive snapshots but never drive a player: drop their input.
  if (room.spectators.has(playerId)) return;
  playerOf(room, playerId);
  // Frozen room: inputs are dropped so nothing queues up for the resume.
  if (room.state.paused) return;
  const normalized = normalizeInput(input);
  // Queue edge intents on receipt: they survive until a tick consumes them.
  // Placements queue on the rising edge only, so holding the button does not
  // stockpile attempts - but every distinct tap banks one (capped at 5).
  const previous = room.rt.inputs.get(playerId);
  if (normalized.useRoleAbility) room.rt.pendingAbility.add(playerId);
  if (normalized.placeConstruct && !previous?.placeConstruct) {
    const queued = room.rt.pendingPlace.get(playerId) ?? 0;
    room.rt.pendingPlace.set(playerId, Math.min(5, queued + 1));
  }
  room.rt.inputs.set(playerId, normalized);
};

export const selectRole = (
  rooms: Rooms,
  code: string,
  playerId: string,
  role: Role,
): MutationResult => {
  const room = roomOf(rooms, code);
  if (room.state.phase !== "lobby" && room.state.phase !== "countdown")
    throw new RoomError("wrong-phase", "Roles are chosen in the hub.");
  if (room.state.players.some((p) => p.id !== playerId && p.role === role))
    throw new RoomError("role-taken", "That lantern color is already claimed.");
  playerOf(room, playerId).role = role;
  room.dirty = true;
  return { room: room.state, events: [], levelUp: false };
};

export const requestStart = (
  rooms: Rooms,
  code: string,
  playerId: string,
  now: number,
): MutationResult => {
  const room = roomOf(rooms, code);
  if (room.state.hostId !== playerId)
    throw new RoomError("host-only", "Only the host can light the lantern.");
  if (room.state.phase !== "lobby")
    throw new RoomError("wrong-phase", "The night has already begun.");
  if (!allReady(room))
    throw new RoomError(
      "not-ready",
      "Everyone needs a role and a spot in the ready circle.",
    );
  return {
    room: room.state,
    events: beginCountdown(room, now),
    levelUp: false,
  };
};

export const returnToLobby = (
  rooms: Rooms,
  code: string,
  playerId: string,
  now: number,
): MutationResult => {
  const room = roomOf(rooms, code);
  playerOf(room, playerId);
  if (room.state.phase !== "won" && room.state.phase !== "lost")
    throw new RoomError("wrong-phase", "The match has not finished yet.");
  // Fresh run, fresh clock: accumulated pauses belong to the last match.
  room.pauseBy.clear();
  room.pauseStart = null;
  room.pausedTotalMs = 0;
  room.state.paused = false;
  endToLobby(room.state, room.rt, now);
  respawnAtHub(room);
  room.dirty = true;
  return { room: room.state, events: [], levelUp: false };
};

export { place } from "./placement";
/** Re-exported so room-manager keeps one actions import. */
export { pickUpgrade } from "./upgrade-votes";
