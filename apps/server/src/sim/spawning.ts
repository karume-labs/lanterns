import {
  clampToBounds,
  ENEMIES_TABLE,
  LANTERN_POSITION,
  LANTERN_RADIUS_MAX,
  MAP_SIZE,
  MAX_ENEMIES_PER_ROOM,
  pickEnemyKind,
  type RoomState,
  waveAt,
} from "@lanterns/domain";
import type { SimRuntime } from "./runtime";

const SPAWN_REACH = LANTERN_RADIUS_MAX + 180;
const SPAWN_JITTER = 160;

/** Spawn one wave burst just outside the lantern light when the timer fires. */
export const spawnWave = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  if (now < rt.nextSpawnAt) return;
  const wave = waveAt(state.elapsedSeconds);
  rt.nextSpawnAt = now + wave.intervalMs;
  const cap = Math.min(MAX_ENEMIES_PER_ROOM, wave.cap);
  for (let index = 0; index < wave.burst; index++) {
    if (state.enemies.length >= cap) break;
    const kind = pickEnemyKind(wave.weights, rt.rng);
    if (!kind) break;
    const def = ENEMIES_TABLE[kind];
    const angle = rt.rng() * Math.PI * 2;
    const reach = SPAWN_REACH + rt.rng() * SPAWN_JITTER;
    const position = clampToBounds(
      {
        x: LANTERN_POSITION.x + Math.cos(angle) * reach * 1.25,
        y: LANTERN_POSITION.y + Math.sin(angle) * reach * 0.8,
      },
      def.radius,
      { width: MAP_SIZE.width, height: MAP_SIZE.height },
    );
    state.enemies.push({
      id: crypto.randomUUID(),
      kind,
      position,
      health: def.maxHealth,
      maxHealth: def.maxHealth,
      attackAt: now + 500,
      aim: 0,
    });
  }
};
