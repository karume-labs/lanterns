import type { Snapshot } from "@lanterns/domain";
import { INTERP_DELAY_MS } from "./config";

const BUFFER_SIZE = 12;
/** Offset samples kept for the min-filter; drops network-delay spikes. */
const OFFSET_WINDOW = 32;

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
  #offsets: number[] = [];
  /** Local receive time minus server snapshot time, min-filtered. */
  #offset = Number.NaN;

  get latestTick(): number {
    return this.#buffer.at(-1)?.t ?? 0;
  }

  get hasData(): boolean {
    return this.#buffer.length > 0;
  }

  clear(): void {
    this.#buffer = [];
    this.#offsets = [];
    this.#offset = Number.NaN;
  }

  /** Record a snapshot received at local time `receivedAt` (ms). */
  push(snap: Snapshot, receivedAt: number): void {
    this.#offsets.push(receivedAt - snap.ms);
    if (this.#offsets.length > OFFSET_WINDOW) this.#offsets.shift();
    this.#offset = Math.min(...this.#offsets);

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

  /**
   * Blend window for the local render clock `now` (ms), sampled
   * INTERP_DELAY_MS behind the estimated server time. Null before data.
   */
  sample(now: number): SampledState | null {
    if (Number.isNaN(this.#offset)) return null;
    const target = now - this.#offset - INTERP_DELAY_MS;
    const buffer = this.#buffer;
    if (buffer.length === 0) return null;
    const first = buffer[0];
    const last = buffer.at(-1);
    if (!first || !last) return null;
    if (buffer.length === 1 || target <= first.ms)
      return { a: first, b: first, alpha: 0 };
    if (target >= last.ms) return { a: last, b: last, alpha: 0 };
    for (let index = buffer.length - 1; index > 0; index--) {
      const older = buffer[index - 1];
      const newer = buffer[index];
      if (!older || !newer || target < older.ms) continue;
      if (target > newer.ms) continue;
      const span = newer.ms - older.ms;
      const alpha = span > 0 ? (target - older.ms) / span : 0;
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
