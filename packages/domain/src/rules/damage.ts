import { PLAYER_SHOT_DAMAGE, SHOT_COOLDOWN_MS } from "../constants";
import { ROLES_TABLE } from "../content/roles";
import type { Role } from "../types";

/** Final per-shot damage after role and upgrade modifiers. */
export const shotDamage = (role: Role | null, powerStacks: number): number => {
  const roleMult = role ? ROLES_TABLE[role].mods.damage : 1;
  return Math.round(PLAYER_SHOT_DAMAGE * roleMult * (1 + 0.25 * powerStacks));
};

/** Milliseconds between shots after role and upgrade modifiers. */
export const shotCooldownMs = (
  role: Role | null,
  reloadStacks: number,
): number => {
  const roleMult = role ? 1 / ROLES_TABLE[role].mods.fireRate : 1;
  return Math.round((SHOT_COOLDOWN_MS * roleMult) / (1 + 0.25 * reloadStacks));
};

/** Clamp applied damage; health never goes below zero. */
export const applyDamage = (health: number, amount: number): number => {
  if (!Number.isFinite(amount) || amount <= 0) return health;
  return Math.max(0, health - amount);
};
