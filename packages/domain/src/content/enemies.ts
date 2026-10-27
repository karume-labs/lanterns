import { ENEMY_KINDS, type EnemyKind } from "../types";

export interface EnemyDef {
  id: EnemyKind;
  label: string;
  color: string;
  radius: number;
  maxHealth: number;
  /** world units per second */
  speed: number;
  /** damage per attack */
  damage: number;
  attackCooldownMs: number;
  /** melee range (ranged enemies keep this distance and shoot) */
  attackRange: number;
  /** lantern damage on a successful attack against the lantern */
  lanternDamage: number;
  xp: number;
}

export const ENEMIES_TABLE: Record<EnemyKind, EnemyDef> = {
  swarmer: {
    id: "swarmer",
    label: "Swarmer",
    color: "#8e9aaf",
    radius: 9,
    maxHealth: 30,
    speed: 62,
    damage: 6,
    attackCooldownMs: 700,
    attackRange: 36,
    lanternDamage: 2,
    xp: 4,
  },
  chaser: {
    id: "chaser",
    label: "Chaser",
    color: "#f95738",
    radius: 11,
    maxHealth: 42,
    speed: 108,
    damage: 9,
    attackCooldownMs: 800,
    attackRange: 40,
    lanternDamage: 3,
    xp: 6,
  },
  ranged: {
    id: "ranged",
    label: "Spitter",
    color: "#ef8354",
    radius: 11,
    maxHealth: 50,
    speed: 48,
    damage: 8,
    attackCooldownMs: 1400,
    attackRange: 190,
    lanternDamage: 4,
    xp: 8,
  },
  tank: {
    id: "tank",
    label: "Brute",
    color: "#8d5a97",
    radius: 18,
    maxHealth: 150,
    speed: 34,
    damage: 18,
    attackCooldownMs: 1200,
    attackRange: 48,
    lanternDamage: 8,
    xp: 15,
  },
};

export const ENEMY_INDEX: Record<EnemyKind, number> = Object.fromEntries(
  ENEMY_KINDS.map((kind, index) => [kind, index]),
) as Record<EnemyKind, number>;
