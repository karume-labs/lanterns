import { describe, expect, test } from "bun:test";
import { MATCH_DURATION_SECONDS, UPGRADE_MAX_STACKS } from "../constants";
import { ENEMY_KINDS, ROLES } from "../types";
import { ENEMIES_TABLE } from "./enemies";
import { ROLE_ORDER, ROLES_TABLE } from "./roles";
import {
  findUpgrade,
  remainingStacks,
  UPGRADES_TABLE,
  upgradeOptions,
} from "./upgrades";
import { pickEnemyKind, WAVES, waveAt } from "./waves";

function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xffffffff;
  };
}

describe("roles table", () => {
  test("covers every role exactly once", () => {
    expect(Object.keys(ROLES_TABLE).sort()).toEqual([...ROLES].sort());
  });

  test("rack order lists every role exactly once", () => {
    expect([...ROLE_ORDER].sort()).toEqual([...ROLES].sort());
    expect(new Set(ROLE_ORDER).size).toBe(ROLES.length);
  });

  test("each role has a distinct color and a unique ability", () => {
    const colors = ROLES.map((role) => ROLES_TABLE[role].color);
    const abilities = ROLES.map((role) => ROLES_TABLE[role].abilityId);
    expect(new Set(colors).size).toBe(ROLES.length);
    expect(new Set(abilities).size).toBe(ROLES.length);
  });

  test("each role documents its modifiers", () => {
    for (const role of ROLES) {
      const mods = ROLES_TABLE[role].mods;
      for (const value of Object.values(mods)) {
        expect(value).toBeGreaterThan(0);
      }
    }
  });
});

describe("enemies table", () => {
  test("covers every enemy kind", () => {
    expect(Object.keys(ENEMIES_TABLE).sort()).toEqual([...ENEMY_KINDS].sort());
  });

  test("stats are positive and a brute outlasts a swarmer", () => {
    for (const kind of ENEMY_KINDS) {
      const def = ENEMIES_TABLE[kind];
      expect(def.maxHealth).toBeGreaterThan(0);
      expect(def.speed).toBeGreaterThan(0);
      expect(def.xp).toBeGreaterThan(0);
    }
    expect(ENEMIES_TABLE.tank.maxHealth).toBeGreaterThan(
      ENEMIES_TABLE.swarmer.maxHealth,
    );
  });
});

describe("wave table", () => {
  test("waves start in order and cover the whole match", () => {
    expect(WAVES[0]!.startSec).toBe(0);
    for (let index = 1; index < WAVES.length; index++)
      expect(WAVES[index]!.startSec).toBeGreaterThan(
        WAVES[index - 1]!.startSec,
      );
    expect(WAVES.at(-1)!.startSec).toBeLessThan(MATCH_DURATION_SECONDS);
  });

  test("pressure escalates: caps and bursts never decrease", () => {
    for (let index = 1; index < WAVES.length; index++) {
      expect(WAVES[index]!.cap).toBeGreaterThanOrEqual(WAVES[index - 1]!.cap);
      expect(WAVES[index]!.burst).toBeGreaterThanOrEqual(
        WAVES[index - 1]!.burst,
      );
    }
  });

  test("early waves only spawn the first enemy type", () => {
    const rng = seededRng(7);
    const early = waveAt(30);
    for (let index = 0; index < 50; index++)
      expect(pickEnemyKind(early.weights, rng)).toBe("swarmer");
    expect(waveAt(MATCH_DURATION_SECONDS - 1).weights.tank).toBeGreaterThan(0);
  });

  test("weighted pick respects weights and handles zero tables", () => {
    const rng = seededRng(11);
    const kind = pickEnemyKind(
      { swarmer: 1, tank: 0, ranged: 0, chaser: 0 },
      rng,
    );
    expect(kind).toBe("swarmer");
    expect(
      pickEnemyKind({ swarmer: 0, tank: 0, ranged: 0, chaser: 0 }, rng),
    ).toBeNull();
  });
});

describe("upgrades table", () => {
  test("ids are unique and every upgrade is findable", () => {
    const ids = UPGRADES_TABLE.map((upgrade) => upgrade.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(UPGRADES_TABLE.length).toBeGreaterThanOrEqual(6);
    for (const id of ids) expect(findUpgrade(id)).toBeDefined();
    expect(findUpgrade("nope")).toBeUndefined();
  });

  test("options are distinct and legal", () => {
    const rng = seededRng(3);
    const options = upgradeOptions({}, rng, 3);
    expect(options.length).toBe(3);
    expect(new Set(options.map((option) => option.id)).size).toBe(3);
  });

  test("stacked upgrades become ineligible at their cap", () => {
    expect(remainingStacks("power", { power: 3 })).toBe(0);
    expect(remainingStacks("power", { power: 2 })).toBe(1);
    const rng = seededRng(5);
    const taken = Object.fromEntries(
      UPGRADES_TABLE.filter((upgrade) => upgrade.id !== "fuel").map((u) => [
        u.id,
        UPGRADE_MAX_STACKS,
      ]),
    );
    const options = upgradeOptions(taken, rng, 3);
    expect(options.map((option) => option.id)).toEqual(["fuel"]);
  });
});
