import { LEVEL_UP_INTERMISSION_MS, RECONNECT_GRACE_MS } from "@lanterns/domain";
import { stepMatch } from "../sim/match-sim";
import { addXp, applyUpgradePick } from "../sim/upgrades";
import { updateCountdown } from "./countdown";
import { removePlayer } from "./leaving";
import { stepLobby } from "./lobby";
import { gameClock, settlePause } from "./pause";
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

  // A pause released this tick (resume, leave, or grace expiry): bank the
  // frozen span before any sim step reads the clock.
  if (!room.state.paused) settlePause(room, now);

  // Simulate by phase - unless the room is paused: the clock, enemies,
  // spawning and movement all freeze together for everyone.
  const hadChoices = room.state.upgradeChoices.length > 0;
  if (!room.state.paused) {
    if (room.state.phase === "lobby" || room.state.phase === "countdown") {
      stepLobby(room, now);
      events.push(...updateCountdown(room, now));
    } else if (room.state.phase === "active") {
      if (room.state.upgradeChoices.length > 0) {
        // Level-up intermission: the whole sim holds still while the crew
        // picks. Resolves when every connected player has voted, or when
        // the deadline passes (the first choice then wins by default).
        // (Re)arm on entry; the deadline check also covers a table that
        // was already pending when this tick first saw it (deadline 0).
        if (!hadChoices || room.rt.levelUpDeadline === 0) {
          room.rt.levelUpAcks.clear();
          room.rt.levelUpApplied = false;
          room.rt.levelUpDeadline =
            gameClock(room, now) + LEVEL_UP_INTERMISSION_MS;
        }
        const need = room.state.players
          .filter((player) => player.connected)
          .map((player) => player.id);
        if (
          (need.length > 0 &&
            need.every((id) => room.rt.levelUpAcks.has(id))) ||
          gameClock(room, now) >= room.rt.levelUpDeadline
        ) {
          if (!room.rt.levelUpApplied) {
            const first = room.state.upgradeChoices[0];
            if (first) applyUpgradePick(room.state, room.rt, first.id);
          }
          room.state.upgradeChoices = [];
          room.rt.levelUpAcks.clear();
          room.rt.levelUpApplied = false;
          room.dirty = true;
          // Banked XP may span two thresholds: roll the next pick at once.
          addXp(room.state, room.rt, 0);
        }
      } else {
        stepMatch(room.state, room.rt, gameClock(room, now));
        if (!hadChoices && room.state.upgradeChoices.length) levelUp = true;
      }
    }
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
  let snapshotFrame: string | null = null;
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
    // Serialize once: the same string is published and measured.
    snapshotFrame = JSON.stringify({ type: "snapshot", snap: snapshot });
    snapshotBytes = snapshotFrame.length;
  }
  room.snapshotCounter += 1;

  // The sim can flip active -> won/lost on its own; that transition must also
  // reach clients, or they keep rendering the match HUD for a finished run.
  const roomState = room.dirty || room.state.phase !== phaseAtStart;
  room.dirty = false;
  return {
    room: room.state,
    snapshot,
    snapshotFrame,
    roomState,
    events,
    levelUp,
    matchEnded,
    tickMicros: Math.round((performance.now() - started) * 1000),
    snapshotBytes,
  };
};
