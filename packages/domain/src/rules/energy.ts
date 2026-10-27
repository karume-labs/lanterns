import {
  ENERGY_REGEN_IN_LIGHT,
  ENERGY_REGEN_OUTSIDE,
  PLAYER_MAX_ENERGY,
  TURRET_COST,
  WALL_COST,
} from "../constants";
import { ROLES_TABLE } from "../content/roles";
import type { ConstructKind, Role } from "../types";
import { clamp } from "./geometry";

/** Energy price of a construct after role discounts. */
export const constructCost = (
  kind: ConstructKind,
  role: Role | null,
): number => {
  const base = kind === "turret" ? TURRET_COST : WALL_COST;
  const roleMult = role ? ROLES_TABLE[role].mods.constructCost : 1;
  return Math.ceil(base * roleMult);
};

export const canAfford = (energy: number, cost: number): boolean =>
  energy >= cost;

export const spendEnergy = (
  energy: number,
  cost: number,
  max = PLAYER_MAX_ENERGY,
): number => clamp(energy - cost, 0, max);

/** Deep Reserves raises the pool by 30 per stack. */
export const maxEnergy = (batteryStacks: number): number =>
  PLAYER_MAX_ENERGY + 30 * batteryStacks;

/** Energy regenerates faster inside the lantern's light. */
export const regenRate = (inLight: boolean, batteryStacks: number): number => {
  const base = inLight ? ENERGY_REGEN_IN_LIGHT : ENERGY_REGEN_OUTSIDE;
  return base * (1 + 0.5 * batteryStacks);
};

export const regenEnergy = (
  energy: number,
  dt: number,
  inLight: boolean,
  batteryStacks: number,
): number =>
  clamp(
    energy + regenRate(inLight, batteryStacks) * dt,
    0,
    maxEnergy(batteryStacks),
  );
