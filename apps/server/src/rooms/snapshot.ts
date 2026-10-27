import {
  angleDeg,
  CONSTRUCT_KINDS,
  ENEMY_INDEX,
  PLAYER_FLAG,
  type RoomState,
  round0,
  round1,
  type Snapshot,
} from "@lanterns/domain";
import type { SimRuntime } from "../sim/runtime";

function playerFlags(state: RoomState, index: number, now: number): number {
  const player = state.players[index]!;
  let flags = 0;
  if (player.downed) flags |= PLAYER_FLAG.downed;
  if (!player.connected) flags |= PLAYER_FLAG.disconnected;
  if (now < player.invulnerableUntil) flags |= PLAYER_FLAG.invulnerable;
  if (player.ready) flags |= 8;
  return flags;
}

/**
 * Serialize the room into the compact wire snapshot. The runtime's event
 * buffer is drained here so every effect is delivered exactly once.
 */
export function buildSnapshot(
  state: RoomState,
  rt: SimRuntime,
  now: number,
  dummyHealth: number | null,
): Snapshot {
  const lantern = state.lantern;
  const snapshot: Snapshot = {
    t: rt.tick,
    ms: now,
    ph: state.phase,
    el: round1(state.elapsedSeconds),
    pl: state.players.map((player, index) => [
      round1(player.position.x),
      round1(player.position.y),
      Math.round(
        angleDeg({ x: 0, y: 0 }, { x: player.aim.x, y: player.aim.y }),
      ),
      round0(player.health),
      round0(player.energy),
      playerFlags(state, index, now),
    ]),
    en: state.enemies.map((enemy) => [
      round1(enemy.position.x),
      round1(enemy.position.y),
      ENEMY_INDEX[enemy.kind],
      round0(enemy.health),
    ]),
    cs: state.constructs.map((construct) => [
      round1(construct.position.x),
      round1(construct.position.y),
      CONSTRUCT_KINDS.indexOf(construct.kind),
      round0(construct.health),
      Math.max(
        0,
        state.players.findIndex((player) => player.id === construct.ownerId),
      ),
    ]),
    sh: state.shards
      .filter((shard) => !shard.carriedBy)
      .map((shard) => [round1(shard.position.x), round1(shard.position.y)]),
    ln: lantern
      ? [
          round1(lantern.position.x),
          round1(lantern.position.y),
          round1(lantern.fuel),
          round0(lantern.health),
          round0(lantern.lightRadius),
        ]
      : null,
    xp: round1(state.teamXp),
    lvl: state.teamLevel,
    ev: rt.events.splice(0),
    dm: dummyHealth === null ? null : round0(dummyHealth),
  };
  return snapshot;
}
