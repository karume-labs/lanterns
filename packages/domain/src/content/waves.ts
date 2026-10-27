import type { EnemyKind } from "../types";

export interface WaveDef {
  /** seconds into the match when this wave becomes current */
  startSec: number;
  /** ms between spawn events */
  intervalMs: number;
  /** enemies spawned per event */
  burst: number;
  /** relative spawn weights; 0 excludes the kind */
  weights: Record<EnemyKind, number>;
  /** active-enemy cap while this wave is current */
  cap: number;
}

export const WAVES: WaveDef[] = [
  {
    startSec: 0,
    intervalMs: 3000,
    burst: 1,
    weights: { swarmer: 1, chaser: 0, ranged: 0, tank: 0 },
    cap: 10,
  },
  {
    startSec: 60,
    intervalMs: 2700,
    burst: 1,
    weights: { swarmer: 3, chaser: 1, ranged: 0, tank: 0 },
    cap: 16,
  },
  {
    startSec: 120,
    intervalMs: 2400,
    burst: 2,
    weights: { swarmer: 3, chaser: 1, ranged: 1, tank: 0 },
    cap: 24,
  },
  {
    startSec: 180,
    intervalMs: 2200,
    burst: 2,
    weights: { swarmer: 3, chaser: 2, ranged: 1, tank: 1 },
    cap: 32,
  },
  {
    startSec: 240,
    intervalMs: 2000,
    burst: 2,
    weights: { swarmer: 3, chaser: 2, ranged: 2, tank: 1 },
    cap: 40,
  },
  {
    startSec: 300,
    intervalMs: 1800,
    burst: 3,
    weights: { swarmer: 3, chaser: 2, ranged: 2, tank: 1 },
    cap: 55,
  },
  {
    startSec: 360,
    intervalMs: 1650,
    burst: 3,
    weights: { swarmer: 3, chaser: 3, ranged: 2, tank: 2 },
    cap: 70,
  },
  {
    startSec: 420,
    intervalMs: 1500,
    burst: 3,
    weights: { swarmer: 2, chaser: 3, ranged: 3, tank: 2 },
    cap: 85,
  },
  {
    startSec: 480,
    intervalMs: 1300,
    burst: 4,
    weights: { swarmer: 2, chaser: 3, ranged: 3, tank: 3 },
    cap: 100,
  },
  {
    startSec: 540,
    intervalMs: 1100,
    burst: 4,
    weights: { swarmer: 2, chaser: 3, ranged: 3, tank: 4 },
    cap: 120,
  },
];

/** The wave in force at `elapsedSeconds` (the last one that has started). */
export const waveAt = (elapsedSeconds: number): WaveDef => {
  const first = WAVES[0];
  if (!first) throw new Error("wave table must not be empty");
  let current = first;
  for (const wave of WAVES) if (elapsedSeconds >= wave.startSec) current = wave;
  return current;
};

/** Weighted pick from a wave's table; returns null when nothing can spawn. */
export const pickEnemyKind = (
  weights: Record<EnemyKind, number>,
  rng: () => number,
): EnemyKind | null => {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const [kind, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll < 0) return kind as EnemyKind;
  }
  return null;
};
