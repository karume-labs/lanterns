/**
 * Small sprites: fuel shards, shots, impact rings, embers, and the 8x8 UI
 * role icons. All fully opaque pixels - the lighting overlay handles glow.
 */
export const SHARD = [
  "....WW....",
  "...WAAW...",
  "..WAFFAW..",
  "..WAFFAW..",
  "...WAAW...",
  "....WW....",
  ".....E....",
  "....EEE...",
] as const;

export const SHOT_FRIENDLY = ["WW", "AA"] as const;
export const SHOT_ENEMY = ["YY", "MM"] as const;
export const ORB_FUEL = [
  "..WW..",
  ".WAAW.",
  "WAFFAW",
  ".WAAW.",
  "..WW..",
] as const;

/** Expanding hit ring, three ages (client picks by t). */
export const RING_0 = [
  "................",
  "................",
  "................",
  "................",
  "......WWWW......",
  "....WW....WW....",
  "....W......W....",
  "....W......W....",
  "....W......W....",
  "....W......W....",
  "....WW....WW....",
  "......WWWW......",
  "................",
  "................",
  "................",
  "................",
] as const;

export const RING_1 = [
  "................",
  "................",
  ".....WWWWWW.....",
  "...WW......WW...",
  "..W..........W..",
  "..W..........W..",
  ".W............W.",
  ".W............W.",
  ".W............W.",
  ".W............W.",
  "..W..........W..",
  "..W..........W..",
  "...WW......WW...",
  ".....WWWWWW.....",
  "................",
  "................",
] as const;

export const RING_2 = [
  "....WWWWWWWW....",
  "..WW........WW..",
  ".W............W.",
  ".W............W.",
  "W..............W",
  "W..............W",
  "W..............W",
  "W..............W",
  "W..............W",
  "W..............W",
  "W..............W",
  "W..............W",
  ".W............W.",
  ".W............W.",
  "..WW........WW..",
  "....WWWWWWWW....",
] as const;

/** Drifting ember, two flicker frames. */
export const EMBER_0 = [".F.", "FAF", ".F."] as const;
export const EMBER_1 = [".A.", "AWA", ".A."] as const;
