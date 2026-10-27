import {
  BEACON_RADIUS_MULT,
  LANTERN_FUEL_DRAIN_PER_SEC,
  LANTERN_MAX_FUEL,
  LANTERN_RADIUS_MAX,
  LANTERN_RADIUS_MIN,
  LUMEN_RADIUS_MULT,
  MATCH_DURATION_SECONDS,
  MAX_ENEMIES_PER_ROOM,
  type RoomState,
} from "@lanterns/domain";
import { SIM_DT, type SimRuntime } from "./runtime";

export const finish = (state: RoomState, outcome: "won" | "lost"): void => {
  if (state.phase !== "active") return;
  state.phase = outcome;
  state.winner = outcome;
};

/** Drain the lantern, refresh its light, and evaluate win/loss. */
export const stepLantern = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  const lantern = state.lantern;
  if (!lantern) return;
  lantern.fuel = Math.max(
    0,
    lantern.fuel - LANTERN_FUEL_DRAIN_PER_SEC * SIM_DT,
  );
  const base =
    LANTERN_RADIUS_MIN +
    (lantern.fuel / LANTERN_MAX_FUEL) *
      (LANTERN_RADIUS_MAX - LANTERN_RADIUS_MIN);
  // A standing Lumen carries light farther; Beacon flares it wider still.
  const lumenLight = state.players.some(
    (player) => player.connected && !player.downed && player.role === "lumen",
  )
    ? LUMEN_RADIUS_MULT
    : 1;
  const beacon = now < rt.beaconUntil ? BEACON_RADIUS_MULT : 1;
  lantern.lightRadius = Math.min(
    LANTERN_RADIUS_MAX,
    base * lumenLight * beacon,
  );

  if (state.elapsedSeconds >= MATCH_DURATION_SECONDS) {
    finish(state, "won");
    return;
  }
  if (lantern.fuel <= 0 || lantern.health <= 0) {
    finish(state, "lost");
    return;
  }
  const connected = state.players.filter((player) => player.connected);
  if (connected.length > 0 && connected.every((player) => player.downed))
    finish(state, "lost");
};

/** Drop expired/dead constructs and enforce the enemy cap. */
export const prune = (state: RoomState, now: number): void => {
  state.constructs = state.constructs.filter(
    (construct) => construct.health > 0 && construct.expiresAt > now,
  );
  state.enemies = state.enemies.filter((enemy) => enemy.health > 0);
  if (state.enemies.length > MAX_ENEMIES_PER_ROOM)
    state.enemies = state.enemies.slice(0, MAX_ENEMIES_PER_ROOM);
};
