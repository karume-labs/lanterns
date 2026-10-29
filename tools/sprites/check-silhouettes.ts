import { catalog } from "./catalog";
import { ENEMY_BASES } from "./enemies";
import { ROLE_BASES } from "./role-bases";

const mask = (rows: readonly string[]): boolean[][] =>
  rows.map((row) => [...row].map((ch) => ch !== "." && ch !== undefined));

const iou = (a: boolean[][], b: boolean[][]): number => {
  const h = Math.max(a.length, b.length);
  const w = Math.max(a[0]?.length ?? 0, b[0]?.length ?? 0);
  let inter = 0;
  let union = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pa = a[y]?.[x] ?? false;
      const pb = b[y]?.[x] ?? false;
      if (pa || pb) union += 1;
      if (pa && pb) inter += 1;
    }
  }
  return union === 0 ? 1 : inter / union;
};

let failures = 0;
const pairCheck = (
  label: string,
  names: string[],
  get: (n: string) => readonly string[],
  limit: number,
) => {
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i];
      const b = names[j];
      if (a === undefined || b === undefined) continue;
      const score = iou(mask(get(a)), mask(get(b)));
      console.log(label + " " + a + " vs " + b + ": " + score.toFixed(2));
      if (score > limit) {
        console.error("too similar: " + a + " vs " + b);
        failures += 1;
      }
    }
  }
};

const groups = catalog();
const idleOf = (group: string, name: string): readonly string[] =>
  groups[group]?.[name + "_idle"]?.rows ?? [];

pairCheck("role", Object.keys(ROLE_BASES), (n) => idleOf("roles", n), 0.75);
pairCheck("enemy", Object.keys(ENEMY_BASES), (n) => idleOf("enemies", n), 0.8);

if (failures > 0) {
  console.error(
    "silhouette check FAILED: " + failures + " pair(s) too similar",
  );
  process.exit(1);
}
console.log("silhouette check ok: roles and enemies read apart");
