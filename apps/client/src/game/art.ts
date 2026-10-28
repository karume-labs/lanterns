import type { EnemyKind } from "@lanterns/domain";

/**
 * Pixel grids consumed by `drawPixels`. "0" is the dark outline everywhere;
 * other keys map to per-draw palettes; "." stays transparent.
 *
 * Every grid is drawn at an EVEN world scale: the world layer renders at
 * 0.5x, so odd scales land on half-pixels and turn the art to mush. Player,
 * turret and dummy draw at scale 4 (2 screen px per art px); enemies pick an
 * even scale from their radius so they stay sharp at 1-2 px per art px.
 */

export const PLAYER_ART = [
  "....000....",
  "...0ccc0...",
  "..0ccccc0..",
  "..0cwcwc0..",
  "..0ccccc0..",
  ".00ccccc00.",
  "0cc0ccc0cc0",
  "0cc0ccc0cc0",
  ".0.0ccc0.0.",
  ".0.0ccc0.0.",
  "...00.00...",
  "..00...00..",
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

/** Each enemy reads by silhouette first: bug, beast, eyeball, brute. */
export const ENEMY_ART: Record<EnemyKind, readonly string[]> = {
  swarmer: [
    "0.......0",
    "00.....00",
    "0cc0.0cc0",
    ".0ccccc0.",
    "..00.00..",
    "..0w0w0..",
    "..0ccc0..",
    "...0c0...",
    "....0....",
  ],
  chaser: [
    "0.0.....0.0",
    ".0000.0000.",
    ".0ccccccc0.",
    ".0cwc0cwc0.",
    ".0ccccccc0.",
    "00c0ccc0c00",
    "0c00ccc00c0",
    ".0.0ccc0.0.",
    ".0.0ccc0.0.",
    "..000.000..",
    "..00...00..",
  ],
  ranged: [
    "...000...",
    "..0ccc0..",
    ".0ccccc0.",
    ".0cwwwc0.",
    ".0cw0wc0.",
    ".0cwwwc0.",
    ".0ccccc0.",
    "..0ccc0..",
    "...000...",
  ],
  tank: [
    "....00000....",
    "...0ccccc0...",
    "..0ccccccc0..",
    "..0c0w0w0c0..",
    ".0ccccccccc0.",
    "00ccccccccc00",
    "0cc0ccccc0cc0",
    "0cc0ccccc0cc0",
    "0cc0ccccc0cc0",
    "00c0ccccc0c00",
    ".00ccccccc00.",
    "..0ccccccc0..",
    "..0ccccccc0..",
    "..000...000..",
    "..000...000..",
  ],
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
