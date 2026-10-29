/**
 * Four enemies plus the dawnbreaker boss. Silhouette-first: swarmer is small
 * and spiky (fast), chaser is a low round beast, ranged is tall and thin,
 * tank is big and round (24x24), the boss fills 48x48. Eyes are bone-pale
 * fangs-and-eyes accents so every kind reads at 1x against grass and dark.
 */
export const ENEMY_SPECS: Record<
  string,
  { width: number; height: number; feet: number; center: number }
> = {
  swarmer: { width: 16, height: 12, feet: 11, center: 8 },
  chaser: { width: 16, height: 14, feet: 13, center: 8 },
  ranged: { width: 12, height: 16, feet: 15, center: 6 },
  tank: { width: 24, height: 24, feet: 23, center: 12 },
  boss: { width: 48, height: 48, feet: 47, center: 24 },
};

/** Swarmer: a fast spike-ball with a single pale eye. */
const SWARMER = [
  "..M..........M..",
  "...M........M...",
  "....MMMMMMMM....",
  "...MMMMMMMMMM...",
  "..MMMMCMMMMMM...",
  "..MMMMMMMMMMMM..",
  "...MMMMMMMMMM...",
  "....M.M..M.M....",
  "....M.....M.....",
  "...M.......M....",
  "...M.......M....",
  "................",
] as const;

/** Chaser: low round brute, fanged jaw, rot-green hide. */
const CHASER = [
  "................",
  "....NNNNNNN.....",
  "...NNNNNNNNN....",
  "..NNNNNNNNNNN...",
  "..NCNNDDNNCNN...",
  ".NNNNNNNNNNNN...",
  ".NNNNNNNNNNNNN..",
  ".NNNCCCCCCNNNN..",
  "..NNCNCNCNCNN...",
  "..NNNNNNNNNNN...",
  "...NNN.NNN......",
  "...NN...NN......",
  "..MM.....MM.....",
  "..MMM...MMM.....",
] as const;

/** Ranged: tall thin spire, levitates - hem never touches the feet row. */
const RANGED = [
  ".....UU.....",
  "....UUUU....",
  "....UCCU....",
  "....UCCU....",
  "....UUUU....",
  ".....UU.....",
  "....UUUU....",
  "...UUUUUU...",
  "...UUDDUU...",
  "...UUUUUU...",
  "....UUUU....",
  "....UUUU....",
  "...UU..UU...",
  "...U....U...",
  "..U......U..",
  "............",
] as const;

/** Tank: huge round shell, ember cracks, tiny legs. */
const TANK = [
  "........KKKKKK........",
  "......KKCCCCCCKK......",
  "....KKCCCCCCCCCCCKK...",
  "...KCCCCCCCCCCCCCCCK..",
  "..KCCCCCCDDCCCCCCCCK..",
  "..CCCCCDDDDCDDCCCCCC..",
  ".CCCCCDDCDDDCDDCCCCC..",
  ".CCCCCDDCDDDCECDCCCC..",
  "CCCCCCCDDDDCECCCCCCC..",
  "CCCCCCCDDCCEECCCCCCC.",
  "CCCCCCCCCCCCEECCCCCCC.",
  ".CCCCCCCCCCCEECCCCCC..",
  ".CCCCECCCCCEEECCCCCC..",
  "..CCCECCCEEECCCCCC...",
  "..CCCCCEEEECCCCCCC...",
  "...CCCCEEECCCCCC.....",
  "...CCCCCCCCCCCC......",
  "....CCCCCCCCCC.......",
  ".....CC.CC.CC........",
  ".....CC.CC.CC........",
  "....KKK.KKK.KKK.......",
  "....KKK.KKK.KKK.......",
  "......................",
  "......................",
] as const;

/** Tank eyes: glowing ember pairs stamped over the dark sockets. */
const stamp = (row: string, at: Record<number, string>): string => {
  const arr = [...row];
  for (const [x, ch] of Object.entries(at)) arr[Number(x)] = ch;
  return arr.join("");
};

const TANK_ROWS: readonly string[] = TANK.map((row, y) => {
  if (y === 4) return stamp(row, { 8: "E", 9: "E", 10: "E" });
  if (y === 5 || y === 6) {
    const cleared = [...row]
      .map((ch, x) => (x >= 7 && x <= 14 && ch === "D" ? "C" : ch))
      .join("");
    return stamp(cleared, { 8: "E", 9: "E", 12: "E", 13: "E" });
  }
  return row;
});

export const ENEMY_BASES: Record<string, readonly string[]> = {
  swarmer: SWARMER,
  chaser: CHASER,
  ranged: RANGED,
  tank: TANK_ROWS,
};
