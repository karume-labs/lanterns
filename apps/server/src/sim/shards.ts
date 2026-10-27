import {
  distance,
  LANTERN_MAX_FUEL,
  LANTERN_POSITION,
  type RoomState,
  SHARD_COLLECT_RADIUS,
  SHARD_DEPOSIT_RADIUS,
  SHARD_MERGE_RADIUS,
} from "@lanterns/domain";
import { type SimRuntime, stacks } from "./runtime";

/** Carry shards by proximity and bank them at the lantern for fuel. */
export const stepShards = (state: RoomState, rt: SimRuntime): void => {
  const harvest = 1 + 0.5 * stacks(rt, "harvest");
  for (const shard of [...state.shards]) {
    if (shard.carriedBy) {
      const holder = state.players.find(
        (player) => player.id === shard.carriedBy && player.connected,
      );
      if (!holder) {
        shard.carriedBy = null;
        continue;
      }
      shard.position = holder.position;
      if (distance(shard.position, LANTERN_POSITION) <= SHARD_DEPOSIT_RADIUS) {
        const gained = Math.round(shard.value * harvest);
        if (state.lantern)
          state.lantern.fuel = Math.min(
            LANTERN_MAX_FUEL,
            state.lantern.fuel + gained,
          );
        state.shards = state.shards.filter((item) => item.id !== shard.id);
        rt.events.push({ k: "fuel", n: gained });
      }
      continue;
    }
    for (const player of state.players) {
      if (!player.connected) continue;
      if (distance(shard.position, player.position) <= SHARD_COLLECT_RADIUS) {
        shard.carriedBy = player.id;
        break;
      }
    }
  }
  mergeNearby(state, rt);
};

/** Cosmetic merge, only worth running a few times per second. */
const mergeNearby = (state: RoomState, rt: SimRuntime): void => {
  if (rt.tick % 15 !== 0) return;
  for (let index = 0; index < state.shards.length; index++) {
    for (let other = index + 1; other < state.shards.length; other++) {
      const a = state.shards[index];
      const b = state.shards[other];
      if (!a || !b || a.carriedBy || b.carriedBy) continue;
      if (distance(a.position, b.position) > SHARD_MERGE_RADIUS) continue;
      a.value += b.value;
      state.shards.splice(other, 1);
      other -= 1;
    }
  }
};
