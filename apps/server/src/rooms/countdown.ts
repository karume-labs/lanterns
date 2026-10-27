import { COUNTDOWN_MS, HUB_SPAWN } from "@lanterns/domain";
import { beginMatch } from "../sim/lifecycle";
import type { RoomEventMsg, RuntimeRoom } from "./runtime";

/** Everyone must be connected, role-claimed, and standing in the circle. */
export const allReady = (room: RuntimeRoom): boolean => {
  const players = room.state.players;
  if (players.length === 0) return false;
  return players.every((player) => player.connected && player.ready);
};

export const resetReady = (room: RuntimeRoom): void => {
  for (const player of room.state.players) player.ready = false;
  room.prevReady.clear();
  for (const player of room.state.players) room.prevReady.set(player.id, false);
};

/** Place everyone back at the hub spawn arrangement. */
export const respawnAtHub = (room: RuntimeRoom): void => {
  room.state.players.forEach((player, index) => {
    player.position = {
      x: HUB_SPAWN.x + (index % 2) * 56 - 28,
      y: HUB_SPAWN.y + Math.floor(index / 2) * 56,
    };
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
  });
  resetReady(room);
};

export const beginCountdown = (
  room: RuntimeRoom,
  now: number,
): RoomEventMsg[] => {
  room.state.phase = "countdown";
  room.state.countdownEndsAt = now + COUNTDOWN_MS;
  room.dirty = true;
  return [{ event: "countdown-started" }];
};

/**
 * Drive the lobby/countdown state machine each tick: auto-start when every
 * player is ready, cancel when readiness breaks (leave, join, disconnect),
 * and begin the match when the countdown expires.
 */
export const updateCountdown = (
  room: RuntimeRoom,
  now: number,
): RoomEventMsg[] => {
  const state = room.state;
  if (state.phase === "lobby") {
    if (!allReady(room)) return [];
    return beginCountdown(room, now);
  }
  if (state.phase !== "countdown") return [];
  if (!allReady(room)) {
    state.phase = "lobby";
    state.countdownEndsAt = null;
    room.dirty = true;
    return [{ event: "countdown-cancelled" }];
  }
  if (state.countdownEndsAt !== null && now >= state.countdownEndsAt) {
    beginMatch(state, room.rt, now);
    resetReady(room);
    room.dirty = true;
    return [{ event: "match-started" }];
  }
  return [];
};
