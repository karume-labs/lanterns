import { describe, expect, test } from "bun:test";
import { EMPTY_INPUT, type InputState } from "../input-state";
import {
  circlesOverlap,
  moveWithCollision,
  resolveStaticCollisions,
} from "./collision";
import { applyDamage, shotCooldownMs, shotDamage } from "./damage";
import {
  canAfford,
  constructCost,
  maxEnergy,
  regenEnergy,
  spendEnergy,
} from "./energy";
import { stepPosition } from "./movement";
import { isLegalChoice, shouldLevelUp, xpThresholdFor } from "./xp";

const BOUNDS = { width: 1000, height: 800 };

function input(patch: Partial<InputState>): InputState {
  return { ...EMPTY_INPUT, ...patch };
}

describe("movement", () => {
  test("moves at speed per second scaled by dt", () => {
    const next = stepPosition(
      { x: 100, y: 100 },
      input({ moveX: 1 }),
      200,
      0.5,
      10,
      BOUNDS,
    );
    expect(next.x).toBe(200);
    expect(next.y).toBe(100);
  });

  test("diagonal movement is not faster than straight movement", () => {
    const straight = stepPosition(
      { x: 0, y: 0 },
      input({ moveX: 1 }),
      200,
      1,
      10,
      BOUNDS,
    );
    const diagonal = stepPosition(
      { x: 0, y: 0 },
      input({ moveX: 1, moveY: 1 }),
      200,
      1,
      10,
      BOUNDS,
    );
    const straightDistance = Math.hypot(straight.x, straight.y);
    const diagonalDistance = Math.hypot(diagonal.x, diagonal.y);
    expect(diagonalDistance).toBeLessThanOrEqual(straightDistance + 0.001);
  });

  test("keeps the body inside map bounds", () => {
    const next = stepPosition(
      { x: 995, y: 400 },
      input({ moveX: 1 }),
      200,
      1,
      10,
      BOUNDS,
    );
    expect(next.x).toBe(990);
  });
});

describe("collision", () => {
  test("detects overlapping circles and ignores separated ones", () => {
    const a = { position: { x: 0, y: 0 }, radius: 10 };
    expect(circlesOverlap(a, { position: { x: 15, y: 0 }, radius: 10 })).toBe(
      true,
    );
    expect(circlesOverlap(a, { position: { x: 25, y: 0 }, radius: 10 })).toBe(
      false,
    );
  });

  test("pushes a body out of a wall it overlaps", () => {
    const resolved = resolveStaticCollisions({ x: 25, y: 0 }, 10, [
      { position: { x: 0, y: 0 }, radius: 20 },
    ]);
    expect(Math.hypot(resolved.x, resolved.y)).toBeCloseTo(30, 5);
  });

  test("stops at a wall instead of passing through", () => {
    const next = moveWithCollision(
      { x: 90, y: 100 },
      { x: 40, y: 0 },
      10,
      [{ position: { x: 140, y: 100 }, radius: 20 }],
      BOUNDS,
    );
    expect(next.x).toBeLessThanOrEqual(110.001);
    expect(next.y).toBe(100);
  });

  test("handles a degenerate full-overlap without dividing by zero", () => {
    const resolved = resolveStaticCollisions({ x: 0, y: 0 }, 10, [
      { position: { x: 0, y: 0 }, radius: 20 },
    ]);
    expect(Number.isFinite(resolved.x)).toBe(true);
    expect(Number.isFinite(resolved.y)).toBe(true);
    expect(resolved.y).toBe(-30);
  });
});

describe("damage", () => {
  test("never takes health below zero", () => {
    expect(applyDamage(10, 25)).toBe(0);
    expect(applyDamage(10, -5)).toBe(10);
    expect(applyDamage(10, Number.NaN)).toBe(10);
  });

  test("striker shots hit harder than base shots", () => {
    expect(shotDamage("striker", 0)).toBeGreaterThan(shotDamage(null, 0));
    expect(shotDamage(null, 0)).toBe(shotDamage("medic", 0));
  });

  test("power stacks scale shot damage", () => {
    expect(shotDamage(null, 2)).toBeGreaterThan(shotDamage(null, 1));
    expect(shotDamage(null, 1)).toBeGreaterThan(shotDamage(null, 0));
  });

  test("reload stacks shorten the cooldown", () => {
    expect(shotCooldownMs(null, 1)).toBeLessThan(shotCooldownMs(null, 0));
    expect(shotCooldownMs(null, 3)).toBeLessThan(shotCooldownMs(null, 1));
  });
});

describe("energy", () => {
  test("builder builds walls cheaper than other roles", () => {
    expect(constructCost("wall", "builder")).toBeLessThan(
      constructCost("wall", "striker"),
    );
  });

  test("spending cannot drop below zero and checks affordability", () => {
    expect(spendEnergy(10, 25)).toBe(0);
    expect(canAfford(10, 25)).toBe(false);
    expect(canAfford(30, 25)).toBe(true);
  });

  test("recharges toward the role-independent cap", () => {
    const charged = regenEnergy(0, 10, true, 0);
    expect(charged).toBeLessThanOrEqual(maxEnergy(0));
    expect(charged).toBeGreaterThan(0);
  });

  test("battery stacks raise the cap", () => {
    expect(maxEnergy(1)).toBeGreaterThan(maxEnergy(0));
  });

  test("regeneration is faster inside the light", () => {
    const inside = regenEnergy(0, 1, true, 0);
    const outside = regenEnergy(0, 1, false, 0);
    expect(inside).toBeGreaterThan(outside);
  });
});

describe("level-ups", () => {
  test("thresholds grow with level", () => {
    expect(xpThresholdFor(2)).toBeGreaterThan(xpThresholdFor(1));
    expect(shouldLevelUp(999, 1)).toBe(true);
    expect(shouldLevelUp(1, 1)).toBe(false);
  });

  test("only presented choices are legal", () => {
    const choices = [{ id: "power", label: "Hot Shots", detail: "+25%" }];
    expect(isLegalChoice(choices, "power")).toBe(true);
    expect(isLegalChoice(choices, "haste")).toBe(false);
    expect(isLegalChoice(choices, "not-an-upgrade")).toBe(false);
  });
});
