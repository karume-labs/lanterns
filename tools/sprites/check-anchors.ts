import { catalog } from "./catalog";

const opaqueBox = (rows: readonly string[]) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === undefined) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  });
  return { minX, maxX, maxY };
};

const FAMILIES: Record<string, string[]> = {
  builder: [
    "builder_idle",
    "builder_walk_a",
    "builder_walk_b",
    "builder_attack",
    "builder_down",
  ],
  medic: [
    "medic_idle",
    "medic_walk_a",
    "medic_walk_b",
    "medic_attack",
    "medic_down",
  ],
  striker: [
    "striker_idle",
    "striker_walk_a",
    "striker_walk_b",
    "striker_attack",
    "striker_down",
  ],
  scout: [
    "scout_idle",
    "scout_walk_a",
    "scout_walk_b",
    "scout_attack",
    "scout_down",
  ],
  keeper: [
    "keeper_idle",
    "keeper_walk_a",
    "keeper_walk_b",
    "keeper_attack",
    "keeper_down",
  ],
  lumen: [
    "lumen_idle",
    "lumen_walk_a",
    "lumen_walk_b",
    "lumen_attack",
    "lumen_down",
  ],
  swarmer: [
    "swarmer_idle",
    "swarmer_walk_a",
    "swarmer_walk_b",
    "swarmer_attack",
    "swarmer_down",
  ],
  chaser: [
    "chaser_idle",
    "chaser_walk_a",
    "chaser_walk_b",
    "chaser_attack",
    "chaser_down",
  ],
  ranged: [
    "ranged_idle",
    "ranged_walk_a",
    "ranged_walk_b",
    "ranged_attack",
    "ranged_down",
  ],
  tank: ["tank_idle", "tank_walk_a", "tank_walk_b", "tank_attack", "tank_down"],
  boss: ["boss_idle"],
  lantern: [
    "lantern_full",
    "lantern_fuel-75",
    "lantern_fuel-50",
    "lantern_fuel-25",
    "lantern_flicker",
    "lantern_low",
    "lantern_out",
    "lantern_dawn",
  ],
};

const byName = new Map<string, readonly string[]>();
for (const [group, frames] of Object.entries(catalog())) {
  for (const [name, spriteDef] of Object.entries(frames)) {
    const key =
      group === "roles" || group === "enemies" || group === "lantern"
        ? name
        : group + "/" + name;
    byName.set(key, spriteDef.rows);
  }
}

let failures = 0;
for (const [family, names] of Object.entries(FAMILIES)) {
  const feetRows: number[] = [];
  const centers: number[] = [];
  for (const name of names) {
    const rows = byName.get(name);
    if (!rows) {
      console.error("missing frame " + name);
      failures += 1;
      continue;
    }
    const box = opaqueBox(rows);
    if (!name.endsWith("_down")) feetRows.push(box.maxY);
    centers.push((box.minX + box.maxX) / 2);
  }
  if (new Set(feetRows).size > 1) {
    console.error(family + ": feet rows differ: " + feetRows.join(","));
    failures += 1;
  }
  const spread = Math.max(...centers) - Math.min(...centers);
  const limit = family === "lantern" ? 1 : 2;
  if (spread > limit) {
    console.error(family + ": centers drift " + spread.toFixed(2) + "px");
    failures += 1;
  }
}

if (failures > 0) {
  console.error("anchor check FAILED: " + failures + " problem(s)");
  process.exit(1);
}
console.log("anchor check ok: feet rows planted, centers steady");
