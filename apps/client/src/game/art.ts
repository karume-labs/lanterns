import type { EnemyKind } from "@lanterns/domain";

/**
 * Pixel grids consumed by `drawPixels`. "0" is the dark outline everywhere;
 * other keys map to per-draw palettes; "." stays transparent.
 */

export const PLAYER_ART = [
  "...0...",
  "..000..",
  ".0ccc0.",
  ".0ccc0.",
  "0ccccc0",
  "0c0cc0c",
  ".0.0.0.",
  ".00.00.",
] as const;

export const DUMMY_ART = [
  "..mmmm..",
  ".mm00mm.",
  "..mmmm..",
  "...00...",
  ".0.00.0.",
  "000ww000",
  ".0.00.0.",
  "...dd...",
  "..dddd..",
] as const;

export const LANTERN_ART = [
  "...e...",
  "..eEe..",
  "..00...",
  ".0ggg0.",
  "0gwwwg0",
  "0gwwwg0",
  ".0ggg0.",
  "..000..",
  ".00000.",
] as const;

export const ENEMY_ART: Record<EnemyKind, readonly string[]> = {
  swarmer: [".0.0.", "0ccc0", ".0c0.", "0ccc0", ".0.0."],
  tank: ["00.00", "0cccc0", "0c0cc0", "0cccc0", "0c0cc0", "0cccc0", "00..00"],
  ranged: ["0...0", ".0w0.", "0wcw0", ".0w0.", "0...0"],
  chaser: ["00.00", ".ccc.", "0c0c0", ".ccc.", "0.0.0"],
} as const;

export const TURRET_ART = [
  "...0...",
  "..0c0..",
  "..0c0..",
  "0ccccc0",
  "0ccccc0",
  ".00000.",
] as const;

/** Mortar pattern for wall constructs; "b" brick, "m" mortar line. */
export const WALL_ART = [
  "bbbbmbbb",
  "bbbbmbbb",
  "mbbbmbbb",
  "mbbbmmbb",
  "bbbmmbbb",
  "bbbbmmbb",
] as const;
