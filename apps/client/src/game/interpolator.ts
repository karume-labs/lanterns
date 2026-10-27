import type { Snapshot } from "@lanterns/domain";
import { INTERP_DELAY_TICKS } from "./config";

const BUFFER_SIZE = 10;

export interface SampledState {
  a: Snapshot;
  b: Snapshot;
  /** 0..1 blend from a to b */
  alpha: number;
}

/**
 * Holds recent snapshots and samples them ~133 ms in the past so remote
 * entities glide between authoritative positions instead of snapping.
 */
export class Interpolator {
  #buffer: Snapshot[] = [];

  get latestTick(): number {
    return this.#buffer.at(-1)?.t ?? 0;
  }

  get hasData(): boolean {
    return this.#buffer.length > 0;
  }

  clear(): void {
    this.#buffer = [];
  }

  push(snap: Snapshot): void {
    const last = this.#buffer.at(-1);
    if (last && snap.t <= last.t) {
      // Same or older tick: keep the freshest copy.
      if (snap.t < last.t) return;
      this.#buffer[this.#buffer.length - 1] = snap;
      return;
    }
    this.#buffer.push(snap);
    while (this.#buffer.length > BUFFER_SIZE) this.#buffer.shift();
  }

  /** Blend window for `nowTick`; null before enough data arrives. */
  sample(nowTick: number): SampledState | null {
    const target = nowTick - INTERP_DELAY_TICKS;
    const buffer = this.#buffer;
    if (buffer.length === 0) return null;
    const first = buffer[0];
    const last = buffer.at(-1);
    if (!first || !last) return null;
    if (buffer.length === 1 || target <= first.t)
      return { a: first, b: first, alpha: 0 };
    if (target >= last.t) return { a: last, b: last, alpha: 0 };
    for (let index = buffer.length - 1; index > 0; index--) {
      const older = buffer[index - 1];
      const newer = buffer[index];
      if (!older || !newer || target < older.t) continue;
      if (target > newer.t) continue;
      const span = newer.t - older.t;
      const alpha = span > 0 ? (target - older.t) / span : 0;
      return { a: older, b: newer, alpha };
    }
    return { a: last, b: last, alpha: 0 };
  }
}

/** Linear blend of two snapshot arrays by index. */
export const lerpRows = (
  a: number[][],
  b: number[][],
  alpha: number,
): number[][] => {
  const rows: number[][] = [];
  const count = Math.max(a.length, b.length);
  for (let index = 0; index < count; index++) {
    const from = a[index];
    const to = b[index] ?? from;
    if (!from || !to) {
      if (to) rows.push([...to]);
      continue;
    }
    const mixed: number[] = [];
    for (let field = 0; field < to.length; field++) {
      const start = from[field] ?? to[field];
      mixed.push(start + ((to[field] ?? start) - start) * alpha);
    }
    rows.push(mixed);
  }
  return rows;
};
