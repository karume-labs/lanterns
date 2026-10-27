import {
  ENEMIES_TABLE,
  MAX_SHARDS_PER_ROOM,
  type RoomState,
  round1,
  SHARD_FUEL_BASE,
} from "@lanterns/domain";
import type { SimRuntime } from "./runtime";
import { addXp } from "./upgrades";

/** Resolve every enemy killed this tick: credit, XP, fuel shard, event. */
export const processDeaths = (state: RoomState, rt: SimRuntime): void => {
  const dead = state.enemies.filter((enemy) => enemy.health <= 0);
  if (!dead.length) return;
  for (const enemy of dead) {
    const credit = rt.enemyOwner.get(enemy.id);
    const killer = credit
      ? state.players.find((player) => player.id === credit)
      : undefined;
    if (killer) killer.kills += 1;
    addXp(state, rt, ENEMIES_TABLE[enemy.kind].xp);
    if (state.shards.length < MAX_SHARDS_PER_ROOM)
      state.shards.push({
        id: crypto.randomUUID(),
        position: { ...enemy.position },
        value: SHARD_FUEL_BASE * (enemy.kind === "tank" ? 2 : 1),
        carriedBy: null,
      });
    rt.events.push({
      k: "die",
      x: round1(enemy.position.x),
      y: round1(enemy.position.y),
    });
    rt.enemyOwner.delete(enemy.id);
  }
  state.enemies = state.enemies.filter((enemy) => enemy.health > 0);
};
