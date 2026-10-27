import {
  type RoomState,
  TURRET_DAMAGE,
  TURRET_FIRE_MS,
  TURRET_RANGE,
} from "@lanterns/domain";
import type { SimRuntime } from "./runtime";

const AIM_STEP = 0.25;

const rotateToward = (
  current: number,
  desired: number,
  step: number,
): number => {
  let delta = desired - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + Math.max(-step, Math.min(step, delta));
};

/** Turrets acquire the nearest enemy in range and fire on a fixed cadence. */
export const stepTurrets = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  for (const turret of state.constructs) {
    if (turret.kind !== "turret") continue;
    let target = null as (typeof state.enemies)[number] | null;
    let closest = TURRET_RANGE;
    for (const enemy of state.enemies) {
      const dx = enemy.position.x - turret.position.x;
      const dy = enemy.position.y - turret.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist < closest) {
        closest = dist;
        target = enemy;
      }
    }
    if (!target) continue;
    const desired = Math.atan2(
      target.position.y - turret.position.y,
      target.position.x - turret.position.x,
    );
    turret.angle = rotateToward(turret.angle, desired, AIM_STEP);
    if (now - turret.fireAt < TURRET_FIRE_MS) continue;
    turret.fireAt = now;
    target.health -= TURRET_DAMAGE;
    rt.enemyOwner.set(target.id, turret.ownerId);
    rt.events.push({
      k: "shot",
      x: Math.round(turret.position.x * 10) / 10,
      y: Math.round(turret.position.y * 10) / 10,
      dx: Math.round(Math.cos(turret.angle) * 10) / 10,
      dy: Math.round(Math.sin(turret.angle) * 10) / 10,
      s: TURRET_DAMAGE,
    });
    rt.events.push({
      k: "hit",
      x: Math.round(target.position.x * 10) / 10,
      y: Math.round(target.position.y * 10) / 10,
      n: TURRET_DAMAGE,
    });
  }
};
