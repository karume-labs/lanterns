import type {
  Construct,
  InputState,
  SnapshotEvent,
  Vector2,
} from "@lanterns/domain";

export const SIM_DT = 1 / 30;

export interface Solid {
  position: Vector2;
  radius: number;
  construct: Construct;
}

/**
 * Per-room mutable simulation state that must not leak into snapshots.
 * `RoomState` is what clients see; `SimRuntime` is the machinery behind it.
 */
export interface SimRuntime {
  /** Latest normalized input per player id. */
  inputs: Map<string, InputState>;
  /**
   * Sticky edge intents (one per press) queued when an input message arrives
   * and consumed by the next tick, so a later poll that clears the flags in
   * `inputs` can no longer swallow the press.
   */
  pendingAbility: Set<string>;
  pendingPlace: Set<string>;
  /** ms timestamps of the last accepted shot per player */
  lastShotAt: Map<string, number>;
  /** ms timestamps of the last role ability per player */
  lastAbilityAt: Map<string, number>;
  /** ms timestamps of the last construct placement per player */
  lastPlaceAt: Map<string, number>;
  /** enemy id -> player id credited for the kill */
  enemyOwner: Map<string, string>;
  /** upgrade id -> stacks taken this run */
  takenUpgrades: Record<string, number>;
  /** one-shot effects buffered until the next snapshot */
  events: SnapshotEvent[];
  /** ms clock for the next spawn event */
  nextSpawnAt: number;
  /** Lumen beacon: light stays wide until this ms timestamp */
  beaconUntil: number;
  /** fixed tick counter since the room was created */
  tick: number;
  /** injectable randomness so headless tests are reproducible */
  rng: () => number;
  /** whether match-ended stats were already broadcast */
  endedSent: boolean;
}

export const createRuntime = (rng: () => number = Math.random): SimRuntime => ({
  inputs: new Map(),
  pendingAbility: new Set(),
  pendingPlace: new Set(),
  lastShotAt: new Map(),
  lastAbilityAt: new Map(),
  lastPlaceAt: new Map(),
  enemyOwner: new Map(),
  takenUpgrades: {},
  events: [],
  nextSpawnAt: 0,
  beaconUntil: 0,
  tick: 0,
  rng,
  endedSent: false,
});

/** Small deterministic PRNG (mulberry32) for tests and bot runs. */
export const seededRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Stacks taken for an upgrade id this run (0 when untouched). */
export const stacks = (rt: SimRuntime, id: string): number =>
  rt.takenUpgrades[id] ?? 0;
