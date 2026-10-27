import {
  CONSTRUCT_PLACEMENT_COOLDOWN_MS,
  CONSTRUCT_PLACEMENT_RANGE,
  canAfford,
  clampToBounds,
  constructCost,
  distance,
  LANTERN_POSITION,
  MAP_SIZE,
  MAX_CONSTRUCTS_PER_ROOM,
  type Player,
  ROLES_TABLE,
  type RoomState,
  spendEnergy,
  TURRET_LIFETIME_MS,
  TURRET_MAX_HEALTH,
  WALL_LIFETIME_MS,
  WALL_MAX_HEALTH,
} from "@lanterns/domain";
import { type SimRuntime, type Solid, stacks } from "./runtime";

const WALL_BODY_RADIUS = 16;
const LANTERN_BODY_RADIUS = 40;

export const wallSolids = (state: RoomState): Solid[] => {
  const solids: Solid[] = [];
  for (const construct of state.constructs)
    if (construct.kind === "wall")
      solids.push({
        position: construct.position,
        radius: WALL_BODY_RADIUS,
        construct,
      });
  return solids;
};

/**
 * Server-authoritative construct placement: range, cost, cooldown, overlap
 * and caps are all re-validated here regardless of where the intent came from.
 */
export const placeAt = (
  state: RoomState,
  rt: SimRuntime,
  player: Player,
  kind: "wall" | "turret",
  point: { x: number; y: number },
  now: number,
  free = false,
): boolean => {
  if (state.constructs.length >= MAX_CONSTRUCTS_PER_ROOM) return false;
  const lastPlace = rt.lastPlaceAt.get(player.id) ?? -1e9;
  if (now - lastPlace < CONSTRUCT_PLACEMENT_COOLDOWN_MS) return false;
  if (distance(point, player.position) > CONSTRUCT_PLACEMENT_RANGE)
    return false;

  const placement = clampToBounds(point, 16, {
    width: MAP_SIZE.width,
    height: MAP_SIZE.height,
  });
  if (distance(placement, LANTERN_POSITION) < LANTERN_BODY_RADIUS + 30)
    return false;
  for (const construct of state.constructs)
    if (distance(placement, construct.position) < 34) return false;
  for (const enemy of state.enemies)
    if (distance(placement, enemy.position) < 26) return false;

  const cost = free ? 0 : constructCost(kind, player.role);
  if (!canAfford(player.energy, cost)) return false;
  player.energy = spendEnergy(player.energy, cost, player.maxEnergy);

  const repairMult =
    (player.role === "builder" ? ROLES_TABLE.builder.mods.constructHealth : 1) *
    (1 + 0.5 * stacks(rt, "repair"));
  const baseHealth = kind === "wall" ? WALL_MAX_HEALTH : TURRET_MAX_HEALTH;
  const maxHealth = Math.round(baseHealth * repairMult);
  state.constructs.push({
    id: crypto.randomUUID(),
    kind,
    position: placement,
    health: maxHealth,
    maxHealth,
    ownerId: player.id,
    expiresAt: now + (kind === "wall" ? WALL_LIFETIME_MS : TURRET_LIFETIME_MS),
    angle: Math.atan2(player.aim.y, player.aim.x),
    fireAt: now,
  });
  rt.lastPlaceAt.set(player.id, now);
  rt.events.push({ k: "placed", c: state.constructs.length - 1 });
  return true;
};

export const rotateToward = (
  current: number,
  desired: number,
  step: number,
): number => {
  let delta = desired - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const clamped = Math.max(-step, Math.min(step, delta));
  return current + clamped;
};
