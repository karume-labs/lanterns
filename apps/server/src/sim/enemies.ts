import {
  type Construct,
  distance,
  ENEMIES_TABLE,
  type Enemy,
  moveWithCollision,
  type Player,
  type RoomState,
} from "@lanterns/domain";
import { wallSolids } from "./constructs";
import { damagePlayer } from "./revives";
import { SIM_DT, type SimRuntime } from "./runtime";
import { spawnWave } from "./spawning";

const CHASE_RANGE_FAST = 340;
const CHASE_RANGE_SLOW = 200;
const MAP_BOUNDS = { width: 3200, height: 1800 };

const nearestPlayer = (
  state: RoomState,
  from: { x: number; y: number },
  range: number,
): Player | null => {
  let best: Player | null = null;
  let bestDistance = range;
  for (const player of state.players) {
    if (!player.connected || player.downed) continue;
    const dist = distance(player.position, from);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = player;
    }
  }
  return best;
};

const damageWall = (wall: Construct, enemy: Enemy, now: number): void => {
  if (now < enemy.attackAt) return;
  const def = ENEMIES_TABLE[enemy.kind];
  enemy.attackAt = now + def.attackCooldownMs;
  wall.health -= def.damage;
};

/** Advance every enemy: chase, collide, attack players, walls, or lantern. */
export const stepEnemies = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  spawnWave(state, rt, now);
  const lantern = state.lantern;
  if (!lantern) return;
  const solids = wallSolids(state);

  for (const enemy of state.enemies) {
    const def = ENEMIES_TABLE[enemy.kind];
    const chaseRange = def.speed > 100 ? CHASE_RANGE_FAST : CHASE_RANGE_SLOW;
    const player = nearestPlayer(state, enemy.position, chaseRange);
    const target = player ? player.position : lantern.position;
    const dx = target.x - enemy.position.x;
    const dy = target.y - enemy.position.y;
    const dist = Math.hypot(dx, dy) || 1;

    const blocked = solids.find(
      (solid) =>
        distance(solid.position, enemy.position) <=
        def.radius + solid.radius + 8,
    );
    if (blocked) {
      damageWall(blocked.construct, enemy, now);
      continue;
    }

    const stopDistance = player ? def.attackRange : def.attackRange + 40;
    if (dist > stopDistance) {
      enemy.position = moveWithCollision(
        enemy.position,
        {
          x: (dx / dist) * def.speed * SIM_DT,
          y: (dy / dist) * def.speed * SIM_DT,
        },
        def.radius,
        solids,
        MAP_BOUNDS,
      );
    }

    if (
      player &&
      distance(enemy.position, player.position) <= def.attackRange &&
      now >= enemy.attackAt
    ) {
      enemy.attackAt = now + def.attackCooldownMs;
      damagePlayer(state, rt, player, def.damage, now);
      continue;
    }
    if (
      distance(enemy.position, lantern.position) <= def.attackRange + 48 &&
      now >= enemy.attackAt
    ) {
      enemy.attackAt = now + def.attackCooldownMs;
      lantern.health = Math.max(0, lantern.health - def.lanternDamage);
      rt.events.push({ k: "shake", n: enemy.kind === "tank" ? 5 : 2 });
    }
  }
};
