import { describe, expect, test } from "bun:test";
import type { Snapshot } from "@lanterns/domain";
import { INTERP_DELAY_MS } from "./config";
import { Interpolator, lerpRows } from "./interpolator";

const snap = (t: number, ms: number, x: number): Snapshot => ({
  t,
  ms,
  ph: "active",
  el: 0,
  pl: [[x, 0, 0, 100, 100, 0]],
  en: [],
  cs: [],
  sh: [],
  ln: null,
  xp: 0,
  lvl: 1,
  ev: [],
  dm: null,
});

const xOf = (snapshot: Snapshot): number => snapshot.pl[0]?.[0] ?? Number.NaN;

/** Feed snapshots at 15 Hz with a steady network delay of `lag` ms. */
const feed = (interp: Interpolator, count: number, lag: number): void => {
  for (let index = 0; index < count; index++) {
    const serverMs = 1000 + index * 66.67;
    interp.push(snap(index, serverMs, index * 10), serverMs + lag);
  }
};

describe("Interpolator", () => {
  test("returns null before any snapshot arrives", () => {
    expect(new Interpolator().sample(0)).toBeNull();
  });

  test("blends smoothly between snapshots instead of holding at alpha 0", () => {
    const interp = new Interpolator();
    feed(interp, 10, 20);
    const base = 1000 + 5 * 66.67 + 20 + INTERP_DELAY_MS;
    const positions: number[] = [];
    // Sample the render clock every ~16 ms across one snapshot interval.
    for (let step = 0; step < 5; step++) {
      const sample = interp.sample(base + step * 16);
      if (!sample) throw new Error("expected a sample");
      const from = xOf(sample.a);
      positions.push(from + (xOf(sample.b) - from) * sample.alpha);
    }
    // Position advances continuously: every step moves forward, none repeat.
    for (let index = 1; index < positions.length; index++)
      expect(positions[index]).toBeGreaterThan(positions[index - 1] ?? 0);
  });

  test("a delayed stale packet does not shift the min-filtered clock", () => {
    const interp = new Interpolator();
    feed(interp, 6, 20);
    const before = interp.sample(1400);
    // A spike-delayed, older packet must not move the render clock.
    interp.push(snap(2, 1000 + 2 * 66.67, 20), 1000 + 2 * 66.67 + 400);
    const after = interp.sample(1400);
    expect(after?.a.t).toBe(before?.a.t);
    expect(after?.b.t).toBe(before?.b.t);
    expect(after?.alpha).toBeCloseTo(before?.alpha ?? -1, 10);
  });

  test("keeps the freshest copy for a repeated tick", () => {
    const interp = new Interpolator();
    interp.push(snap(3, 1000, 1), 1020);
    interp.push(snap(3, 1000, 9), 1020);
    expect(interp.latestTick).toBe(3);
    const sample = interp.sample(1000 + 20 + INTERP_DELAY_MS);
    expect(sample ? xOf(sample.a) : Number.NaN).toBe(9);
  });

  test("clear resets the offset so a new room starts fresh", () => {
    const interp = new Interpolator();
    feed(interp, 4, 20);
    interp.clear();
    expect(interp.hasData).toBe(false);
    expect(interp.sample(1000)).toBeNull();
  });
});

describe("lerpRows", () => {
  test("blends rows by index and keeps unmatched tail rows", () => {
    const rows = lerpRows(
      [
        [0, 0],
        [10, 10],
      ],
      [
        [10, 20],
        [30, 30],
        [5, 5],
      ],
      0.5,
    );
    expect(rows).toEqual([
      [5, 10],
      [20, 20],
      [5, 5],
    ]);
  });
});
