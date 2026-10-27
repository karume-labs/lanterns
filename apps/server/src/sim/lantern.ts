import {
  LANTERN_FUEL_DRAIN_PER_SEC,
  LANTERN_MAX_FUEL,
  LANTERN_RADIUS_MAX,
  LANTERN_RADIUS_MIN,
  MATCH_DURATION_SECONDS,
  MAX_ENEMIES_PER_ROOM,
  type RoomState,
} from "@lanterns/domain";
import { SIM_DT } from "./runtime";

export const finish = (state: RoomState, outcome: "won" | "lost"): void => {
  if (state.phase !== "active") return;
  state.phase = outcome;
  state.winner = outcome;
};

/** Drain the lantern, refresh its light, and evaluate win/loss. */
export const stepLantern = (state: RoomState): void => {
  const lantern = state.lantern;
  if (!lantern) return;
  lantern.fuel = Math.max(
    0,
    lantern.fuel - LANTERN_FUEL_DRAIN_PER_SEC * SIM_DT,
  );
  lantern.lightRadius =
    LANTERN_RADIUS_MIN +
    (lantern.fuel / LANTERN_MAX_FUEL) *
      (LANTERN_RADIUS_MAX - LANTERN_RADIUS_MIN);

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
