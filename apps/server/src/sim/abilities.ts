import {
  ABILITY_GLOBAL_COOLDOWN_MS,
  BEACON_DURATION_MS,
  distance,
  type Player,
  ROLES_TABLE,
  type RoomState,
  round1,
  spendEnergy,
  WARD_LIFETIME_MS,
} from "@lanterns/domain";
import { placeAt } from "./constructs";
import type { SimRuntime } from "./runtime";

/**
 * Cast the role's ability if the global cooldown, energy pool, and role allow
 * it. Always consumes the edge intent (the caller clears the flag).
 */
export const castAbility = (
  state: RoomState,
  rt: SimRuntime,
  player: Player,
  now: number,
): void => {
  if (!player.role) return;
  const role = ROLES_TABLE[player.role];
  const lastAbility = rt.lastAbilityAt.get(player.id) ?? -1e9;
  if (now - lastAbility < ABILITY_GLOBAL_COOLDOWN_MS) return;
  if (player.energy < role.abilityCost) return;
  player.energy = spendEnergy(
    player.energy,
    role.abilityCost,
    player.maxEnergy,
  );
  rt.lastAbilityAt.set(player.id, now);

  switch (role.abilityId) {
    case "bulwark": {
      placeAt(
        state,
        rt,
        player,
        "wall",
        {
          x: player.position.x + player.aim.x * 64,
          y: player.position.y + player.aim.y * 64,
        },
        now,
        true,
      );
      break;
    }
    case "mend": {
      for (const mate of state.players)
        if (mate.connected && distance(mate.position, player.position) <= 160)
          mate.health = Math.min(mate.maxHealth, mate.health + 35);
      break;
    }
    case "flare": {
      for (const enemy of state.enemies)
        if (distance(enemy.position, player.position) <= 200) {
          enemy.health -= 45;
          rt.enemyOwner.set(enemy.id, player.id);
          rt.events.push({
            k: "hit",
            x: round1(enemy.position.x),
            y: round1(enemy.position.y),
            n: 45,
          });
        }
      rt.events.push({ k: "shake", n: 6 });
      break;
    }
    case "glimmer": {
      for (const shard of state.shards)
        if (
          !shard.carriedBy &&
          distance(shard.position, player.position) <= 380
        )
          shard.position = {
            x: shard.position.x + (player.position.x - shard.position.x) * 0.6,
            y: shard.position.y + (player.position.y - shard.position.y) * 0.6,
          };
      break;
    }
    case "ward": {
      placeAt(
        state,
        rt,
        player,
        "wall",
        {
          x: player.position.x + player.aim.x * 48,
          y: player.position.y + player.aim.y * 48,
        },
        now,
        true,
      );
      const ward = state.constructs[state.constructs.length - 1];
      if (ward) ward.expiresAt = now + WARD_LIFETIME_MS;
      break;
    }
    case "beacon": {
      rt.beaconUntil = now + BEACON_DURATION_MS;
      rt.events.push({ k: "flare" });
      rt.events.push({ k: "shake", n: 4 });
      break;
    }
  }
};
