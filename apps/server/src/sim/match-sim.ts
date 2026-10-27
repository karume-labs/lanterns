import type { RoomState } from "@lanterns/domain";
import { processDeaths } from "./deaths";
import { stepEnemies } from "./enemies";
import { prune, stepLantern } from "./lantern";
import { stepPlayers } from "./players";
import { stepRevives } from "./revives";
import type { SimRuntime } from "./runtime";
import { stepShards } from "./shards";
import { stepTurrets } from "./turrets";

/** Advance one authoritative tick for an active match. */
export const stepMatch = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  if (state.phase !== "active") return;
  state.elapsedSeconds += 1 / 30;

  stepPlayers(state, rt, now);
  stepTurrets(state, rt, now);
  stepEnemies(state, rt, now);
  processDeaths(state, rt);
  stepRevives(state, rt, now);
  stepShards(state, rt);
  stepLantern(state);
  prune(state, now);
};
