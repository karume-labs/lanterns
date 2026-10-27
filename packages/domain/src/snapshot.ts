import type { MatchPhase } from "./types";

/** Snapshot flag bits for a player. */
export const PLAYER_FLAG = {
  downed: 1,
  disconnected: 2,
  invulnerable: 4,
} as const;

/** One-shot effects riding along on a snapshot. */
export type SnapshotEvent =
  | { k: "hit"; x: number; y: number; n: number }
  | { k: "die"; x: number; y: number }
  | { k: "shot"; x: number; y: number; dx: number; dy: number; s: number }
  | { k: "down"; p: number }
  | { k: "revived"; p: number }
  | { k: "placed"; c: number }
  | { k: "fuel"; n: number }
  | { k: "shake"; n: number };

export interface Snapshot {
  t: number;
  ms: number;
  ph: MatchPhase;
  el: number;
  /** [x, y, aimDeg, hp, energy, flags] per player, index-aligned with room.players */
  pl: number[][];
  /** [x, y, kindIdx, hp] per enemy */
  en: number[][];
  /** [x, y, kindIdx, hp, ownerIdx] per construct */
  cs: number[][];
  /** [x, y] per ground shard */
  sh: number[][];
  /** [x, y, fuel, hp, radius] or null in lobby */
  ln: number[] | null;
  xp: number;
  lvl: number;
  ev: SnapshotEvent[];
  /** practice dummy health in the hub, null during a match */
  dm: number | null;
}
