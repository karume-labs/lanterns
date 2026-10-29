import { ENEMY_BASES } from "./enemies";

const SWARMER_FALLBACK = ENEMY_BASES["swarmer"] ?? [];

export interface EnemyFrames {
  idle: string[];
  walkA: string[];
  walkB: string[];
  attack: string[];
  down: string[];
}

/** Leg-row scuttle: alternate the bottom leg pixels left/right. */
const scuttle = (base: string[], dir: number): string[] => {
  const out = [...base];
  const last = out.length - 1;
  const feet = out[last] ?? "";
  out[last] =
    dir > 0
      ? `${feet.slice(1)}.`
      : `.${feet.slice(0, Math.max(0, feet.length - 1))}`;
  return out;
};

/** Attack: eyes flare ember, spikes/fangs jut one pixel. */
const enemyAttack = (base: string[]): string[] =>
  base.map((row) => row.replaceAll("C", "W").replace(/^(\.*)M/, "$1WM"));

/** Down: eyes gutter out (pale -> slate), mass slumps one row. */
const enemyDown = (base: string[]): string[] => {
  const slumped = base.map((row) => row.replaceAll("C", "S"));
  slumped.shift();
  slumped.push(".".repeat(slumped[0]?.length ?? 16));
  return slumped;
};

export const enemyFrames = (kind: string): EnemyFrames => {
  const idle = [...(ENEMY_BASES[kind] ?? SWARMER_FALLBACK)];
  return {
    idle,
    walkA: scuttle(idle, 1),
    walkB: scuttle(idle, -1),
    attack: enemyAttack(idle),
    down: enemyDown(idle),
  };
};
