/**
 * Ground tiles (16x16, seamless edges: border pixels match across all four
 * variants) plus hub props: practice dummy, campfire, signpost, wall-frame
 * practice hoop, and the small decorative lantern prop.
 */
export const GRASS_EDGE = "D" as const;

/** Night grass: dark mossy rot-green ground, sparse violet pebbles, one
 *  two-tone tuft per tile. Reads as grass at 1x, not brick or static. */
const grassBase = (tufts: [number, number][]): string[] => {
  const grid: string[][] = Array.from({ length: 16 }, () =>
    Array.from({ length: 16 }, () => "."),
  );
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      // No border color: edges use the same rule, so tiles melt together.
      // Sparser moss on dark soil: nonlinear hash, no diagonal stripes.
      const row = grid[y];
      if (!row) continue;
      const mossy = (x * 3 + y * 5 + x * y) % 7 < 2;
      row[x] = mossy ? "N" : "D";
      if ((x * 7 + y * 13) % 29 === 0) row[x] = "V";
    }
  for (const [x, y] of tufts) {
    const row = grid[y];
    if (row && row[x] !== undefined) row[x] = "N";
    const above = y > 0 ? grid[y - 1] : undefined;
    if (above && above[x] !== undefined) above[x] = "G";
  }
  return grid.map((row) => row.join(""));
};

export const TILE_FRAMES: Record<string, string[]> = {
  grass_0: grassBase([
    [4, 6],
    [11, 9],
  ]),
  grass_1: grassBase([
    [7, 4],
    [3, 12],
  ]),
  grass_2: grassBase([
    [12, 5],
    [6, 11],
  ]),
  grass_3: grassBase([
    [2, 8],
    [10, 13],
  ]),
};

/** Practice dummy: straw head, ward post body, buried base. */
export const DUMMY_IDLE = [
  "................",
  ".....OOOOOO.....",
  "....OOYYYYOO....",
  "....OOYYYYOO....",
  ".....OOOOOO.....",
  ".......DD.......",
  "....DD.DD.DD....",
  "...DDDDDDDDDD...",
  "...DDDAAAADD....",
  "...DDDAAAADD....",
  "....DD.DD.......",
  ".......DD.......",
  ".....DDDDDD.....",
  "....DDDDDDDD....",
  "....DDDDDDDD....",
  "...KKKKKKKKKK...",
] as const;

export const DUMMY_DOWN = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "...OOOOOO.......",
  "..OOYYYYOO......",
  "..OOYYYYOO......",
  "...OOOOOO.......",
  ".......DD.......",
  ".....DDDDDD.....",
  "....DDDDDDDD....",
  "....DDDDDDDD....",
  "...KKKKKKKKKK...",
] as const;

/** Campfire: cold stones, unlit logs - the lantern is the only flame. */
export const CAMPFIRE = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "......SSSS......",
  ".....SQSSQS.....",
  "....SSQSSQS.....",
  ".....SSSSS......",
  "...SS.....SS....",
  "..SQSS...SSQS...",
  "..SSSS...SSSS...",
  "...SS.....SS....",
  "................",
  "................",
  "................",
] as const;

/** Signpost showing the room code in-world (glyphs drawn by the client). */
export const SIGNPOST = [
  "................",
  "...KKKKKKKKK....",
  "...KOOOOOOOK....",
  "...KOOOOOOOK....",
  "...KKKKKKKKK....",
  "......SS........",
  "......SS........",
  "......SS........",
  "......SS........",
  "......SS........",
  "......SS........",
  "......SS........",
  "....SSSSSS......",
  "....SSSSSS......",
  "................",
  "................",
] as const;

/** Spare wall frame marking the build practice area. */
export const PRACTICE_HOOP = [
  "KKKKKKKKKKKKKKKK",
  "K..............K",
  "K..KKKKKKKKKK..K",
  "K..K........K..K",
  "K..K........K..K",
  "K..K........K..K",
  "K..K........K..K",
  "K..KKKKKKKKKK..K",
  "K..............K",
  "KKKKKKKKKKKKKKKK",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
] as const;
