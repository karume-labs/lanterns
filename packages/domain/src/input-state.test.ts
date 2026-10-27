import { describe, expect, test } from "bun:test";
import {
  EMPTY_INPUT,
  type InputState,
  isValidInput,
  normalizeInput,
} from "./input-state";

function input(patch: Partial<InputState>): InputState {
  return { ...EMPTY_INPUT, ...patch };
}

describe("normalizeInput", () => {
  test("caps diagonal movement at unit length", () => {
    const normalized = normalizeInput(input({ moveX: 1, moveY: 1 }));
    expect(Math.hypot(normalized.moveX, normalized.moveY)).toBeCloseTo(1, 5);
    expect(normalized.moveX).toBeCloseTo(normalized.moveY, 5);
  });

  test("keeps sub-unit movement unchanged", () => {
    const normalized = normalizeInput(input({ moveX: 0.5, moveY: -0.25 }));
    expect(normalized.moveX).toBe(0.5);
    expect(normalized.moveY).toBe(-0.25);
  });

  test("clamps out-of-range axes", () => {
    const normalized = normalizeInput(input({ moveX: 9, moveY: -9 }));
    expect(Math.hypot(normalized.moveX, normalized.moveY)).toBeLessThanOrEqual(
      1.0000001,
    );
  });

  test("repairs a zero-length aim into a unit vector", () => {
    const normalized = normalizeInput(input({ aimX: 0, aimY: 0 }));
    expect(Math.hypot(normalized.aimX, normalized.aimY)).toBeCloseTo(1, 5);
  });

  test("normalizes a long aim vector", () => {
    const normalized = normalizeInput(input({ aimX: 12, aimY: 5 }));
    expect(normalized.aimX).toBeCloseTo(12 / 13, 5);
    expect(normalized.aimY).toBeCloseTo(5 / 13, 5);
  });
});

describe("isValidInput", () => {
  test("accepts the empty input", () => {
    expect(isValidInput(EMPTY_INPUT)).toBe(true);
  });

  test("rejects non-numeric axes", () => {
    expect(isValidInput(input({ moveX: Number.NaN }))).toBe(false);
    expect(isValidInput({ ...EMPTY_INPUT, moveX: "fast" })).toBe(false);
  });

  test("rejects an unknown construct kind", () => {
    expect(isValidInput({ ...EMPTY_INPUT, selectedConstruct: "ladder" })).toBe(
      false,
    );
  });

  test("rejects non-booleans and non-objects", () => {
    expect(isValidInput({ ...EMPTY_INPUT, shooting: 1 })).toBe(false);
    expect(isValidInput(null)).toBe(false);
    expect(isValidInput("input")).toBe(false);
  });
});
