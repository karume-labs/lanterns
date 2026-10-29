/**
 * Boss: the Gloom Maw. One asymmetric face (dark sockets, ember hearts),
 * two uneven horns, reaching claw arms, a tapering jaw and a fanged maw.
 * Generated in code so the 48x48 mass stays reproducible and diffable.
 */
export const BOSS_IDLE: readonly string[] = (() => {
  const W = 48;
  const put = (
    grid: string[][],
    x: number,
    y: number,
    ch: string,
    w = 1,
    h = 1,
  ): void => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx;
        const py = y + dy;
        const row = grid[py];
        if (px >= 0 && py >= 0 && px < W && row) row[px] = ch;
      }
  };
  const grid: string[][] = Array.from({ length: 48 }, () =>
    Array.from({ length: W }, () => "."),
  );
  // Two asymmetric horns, plain magenta - pale tips read as antennae.
  put(grid, 5, 2, "M", 3, 6);
  put(grid, 39, 3, "M", 3, 4);
  // Bulk: heavy shoulders tapering hard to a narrow jaw.
  for (let y = 6; y < 44; y++) {
    const jaw = y > 34 ? y - 34 : 0;
    const inset = (y < 12 ? 12 - y : 5) + jaw;
    for (let x = inset; x < W - inset; x++) {
      const edge = x - inset < 2 || W - inset - x < 3;
      const row = grid[y];
      if (row) row[x] = edge ? "D" : (x * 3 + y * 5) % 13 === 0 ? "V" : "U";
    }
  }
  // One ember vein off-center: a scar, not circuitry.
  put(grid, 30, 19, "E", 1, 7);
  // Reaching arms with hooked claws: limbs, not walls.
  put(grid, 2, 27, "U", 4, 3);
  put(grid, 1, 29, "U", 3, 2);
  put(grid, 0, 31, "C", 2, 2);
  put(grid, 0, 33, "E", 1, 1);
  put(grid, 42, 27, "U", 4, 3);
  put(grid, 44, 29, "U", 3, 2);
  put(grid, 46, 31, "C", 2, 2);
  put(grid, 47, 33, "E", 1, 1);
  // One face, slightly asymmetric like living tissue: dark sockets with
  // ember hearts, no pale bars (they read as vents and noses).
  put(grid, 12, 12, "K", 9, 6);
  put(grid, 14, 13, "E", 3, 3);
  put(grid, 28, 13, "K", 9, 6);
  put(grid, 32, 14, "E", 3, 3);
  put(grid, 20, 23, "K", 6, 4);
  put(grid, 22, 24, "E", 2, 2);
  // Maw: glowing gash with fangs up and down.
  put(grid, 14, 30, "E", 20, 1);
  put(grid, 13, 31, "K", 22, 3);
  for (let x = 14; x < 34; x += 4) {
    put(grid, x, 29, "C", 2, 2);
    put(grid, x, 34, "C", 2, 3);
  }
  // Feet: two stub legs under the jaw on the anchor row.
  for (const x of [17, 27]) {
    put(grid, x, 43, "D", 4, 2);
    put(grid, x, 45, "K", 4, 1);
  }
  return grid.map((row) => row.join(""));
})();
