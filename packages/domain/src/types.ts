import type { UpgradeChoice } from "./results";

export type EntityId = string;

export interface Vector2 {
  x: number;
  y: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export const ROLES = ["builder", "medic", "striker", "scout"] as const;
export type Role = (typeof ROLES)[number];

export const ENEMY_KINDS = ["swarmer", "tank", "ranged", "chaser"] as const;
export type EnemyKind = (typeof ENEMY_KINDS)[number];

export const CONSTRUCT_KINDS = ["wall", "turret"] as const;
export type ConstructKind = (typeof CONSTRUCT_KINDS)[number];

export const MATCH_PHASES = [
  "lobby",
  "countdown",
  "active",
  "won",
  "lost",
] as const;
export type MatchPhase = (typeof MATCH_PHASES)[number];

export interface Player {
  id: EntityId;
  name: string;
  position: Vector2;
  aim: Vector2;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  role: Role | null;
  ready: boolean;
  connected: boolean;
  downed: boolean;
  invulnerableUntil: number;
  reviveTargetId: EntityId | null;
  reviveProgress: number;
  kills: number;
  revives: number;
  downs: number;
}

export interface Enemy {
  id: EntityId;
  kind: EnemyKind;
  position: Vector2;
  health: number;
  maxHealth: number;
  attackAt: number;
  aim: number;
}

export interface Construct {
  id: EntityId;
  kind: ConstructKind;
  position: Vector2;
  health: number;
  maxHealth: number;
  ownerId: EntityId;
  expiresAt: number;
  angle: number;
  fireAt: number;
}

export interface FuelShard {
  id: EntityId;
  position: Vector2;
  value: number;
  carriedBy: EntityId | null;
}

export interface Lantern {
  position: Vector2;
  fuel: number;
  health: number;
  lightRadius: number;
}

export interface RoomState {
  code: string;
  hostId: EntityId;
  phase: MatchPhase;
  players: Player[];
  lantern: Lantern | null;
  countdownEndsAt: number | null;
  enemies: Enemy[];
  constructs: Construct[];
  shards: FuelShard[];
  elapsedSeconds: number;
  teamLevel: number;
  teamXp: number;
  nextXpThreshold: number;
  upgradeChoices: UpgradeChoice[];
  winner: "won" | "lost" | null;
}
