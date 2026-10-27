import { RECONNECT_GRACE_MS } from "@lanterns/domain";
import { stepMatch } from "../sim/match-sim";
import { updateCountdown } from "./countdown";
import { removePlayer } from "./leaving";
import { stepLobby } from "./lobby";
import type { RuntimeRoom, TickResult } from "./runtime";
import { buildSnapshot } from "./snapshot";
import { buildStats } from "./stats";

const SNAPSHOT_EVERY_TICKS = 2;

/**
 * Advance one room by a single fixed tick. Returns null when the room became
 * empty and should be deleted by the caller.
 */
export const tickRoom = (room: RuntimeRoom, now: number): TickResult | null => {
  const started = performance.now();
  const events = [...room.pending];
  room.pending = [];
  let levelUp = room.pendingLevelUp;
  room.pendingLevelUp = false;
  room.rt.tick += 1;
  const phaseAtStart = room.state.phase;

  // Expire idle posts past the reconnect grace window.
  for (const [playerId, since] of [...room.disconnectedAt]) {
    if (now - since <= RECONNECT_GRACE_MS) continue;
    events.push(...removePlayer(room, playerId));
    if (room.state.players.length === 0) break;
  }
  if (room.state.players.length === 0) return null;

  // Simulate by phase.
  const hadChoices = room.state.upgradeChoices.length > 0;
  if (room.state.phase === "lobby" || room.state.phase === "countdown") {
    stepLobby(room, now);
    events.push(...updateCountdown(room, now));
  } else if (room.state.phase === "active") {
    stepMatch(room.state, room.rt, now);
    if (!hadChoices && room.state.upgradeChoices.length) levelUp = true;
  }

  // Ready transitions drive lobby room-state frames.
  for (const player of room.state.players) {
    const previous = room.prevReady.get(player.id) ?? false;
    if (previous !== player.ready) {
      room.prevReady.set(player.id, player.ready);
      room.dirty = true;
    }
  }

  // Match end stats, sent exactly once per run.
  let matchEnded: TickResult["matchEnded"] = null;
  if (
    (room.state.phase === "won" || room.state.phase === "lost") &&
    !room.rt.endedSent
  ) {
    room.rt.endedSent = true;
    matchEnded = buildStats(room.state);
  }

  // Compact snapshot at half the tick rate; drains the event buffer.
  let snapshot: TickResult["snapshot"] = null;
  let snapshotBytes = 0;
  if (room.snapshotCounter % SNAPSHOT_EVERY_TICKS === 0) {
    const inHub =
      room.state.phase === "lobby" || room.state.phase === "countdown";
    snapshot = buildSnapshot(
      room.state,
      room.rt,
      now,
      inHub ? room.dummy.health : null,
    );
    snapshotBytes = JSON.stringify(snapshot).length;
  }
  room.snapshotCounter += 1;

  // The sim can flip active -> won/lost on its own; that transition must also
  // reach clients, or they keep rendering the match HUD for a finished run.
  const roomState = room.dirty || room.state.phase !== phaseAtStart;
  room.dirty = false;
  return {
    room: room.state,
    snapshot,
    roomState,
    events,
    levelUp,
    matchEnded,
    tickMicros: Math.round((performance.now() - started) * 1000),
    snapshotBytes,
  };
};
