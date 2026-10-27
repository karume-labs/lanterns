import {
  distance,
  HUB_CIRCLE,
  HUB_DUMMY,
  HUB_DUMMY_HEALTH,
  HUB_DUMMY_RESPAWN_MS,
  HUB_LANTERN,
  HUB_LIGHT_RADIUS,
  HUB_PLAYER_SPEED,
  HUB_RACK,
  HUB_SIZE,
  moveWithCollision,
  PLAYER_RADIUS,
  PLAYER_SHOT_RANGE,
  type Player,
  regenEnergy,
  round1,
  SHOT_COOLDOWN_MS,
  shotDamage,
  TICK_RATE,
} from "@lanterns/domain";
import { castAbility } from "../sim/abilities";
import { placeAt } from "../sim/constructs";
import type { RuntimeRoom } from "./runtime";

const HUB_SOLIDS = [
  { position: HUB_LANTERN, radius: 46 },
  { position: HUB_RACK, radius: 62 },
  { position: HUB_DUMMY, radius: 30 },
];
const DUMMY_AIM_TOLERANCE = 0.75;

/** Advance the roamable hub: movement, practice fire, readiness, dummy. */
export const stepLobby = (room: RuntimeRoom, now: number): void => {
  const state = room.state;
  const dt = 1 / TICK_RATE;

  for (const player of state.players) {
    if (!player.connected) continue;
    const input = room.rt.inputs.get(player.id);
    if (input) {
      player.position = moveWithCollision(
        player.position,
        {
          x: input.moveX * HUB_PLAYER_SPEED * dt,
          y: input.moveY * HUB_PLAYER_SPEED * dt,
        },
        PLAYER_RADIUS,
        HUB_SOLIDS,
        HUB_SIZE,
      );
      player.aim = { x: input.aimX, y: input.aimY };

      const inLight =
        distance(player.position, HUB_LANTERN) <= HUB_LIGHT_RADIUS;
      player.energy = regenEnergy(player.energy, dt, inLight, 0);

      const lastShot = room.rt.lastShotAt.get(player.id) ?? -1e9;
      if (input.shooting && now - lastShot >= SHOT_COOLDOWN_MS) {
        room.rt.lastShotAt.set(player.id, now);
        shootDummy(room, player, now);
      }
      if (room.rt.pendingPlace.delete(player.id)) {
        placeAt(
          state,
          room.rt,
          player,
          input.selectedConstruct ?? "wall",
          {
            x: player.position.x + player.aim.x * 64,
            y: player.position.y + player.aim.y * 64,
          },
          now,
        );
      }
      if (room.rt.pendingAbility.delete(player.id)) {
        castAbility(state, room.rt, player, now);
      }
    }

    player.ready =
      player.role !== null &&
      distance(player.position, HUB_CIRCLE) <= HUB_CIRCLE.radius;
  }

  if (room.dummy.health <= 0 && now >= room.dummy.deadUntil)
    room.dummy.health = HUB_DUMMY_HEALTH;
};

/** Practice fire at the dummy; the dummy regenerates after a short delay. */
const shootDummy = (room: RuntimeRoom, player: Player, now: number): void => {
  const toDummy = {
    x: HUB_DUMMY.x - player.position.x,
    y: HUB_DUMMY.y - player.position.y,
  };
  const dist = Math.hypot(toDummy.x, toDummy.y) || 1;
  const dot =
    (toDummy.x / dist) * player.aim.x + (toDummy.y / dist) * player.aim.y;
  const hit =
    dist <= PLAYER_SHOT_RANGE &&
    dot > DUMMY_AIM_TOLERANCE &&
    room.dummy.health > 0;
  const damage = shotDamage(player.role, 0);
  room.rt.events.push({
    k: "shot",
    x: round1(player.position.x),
    y: round1(player.position.y),
    dx: round1(player.aim.x),
    dy: round1(player.aim.y),
    s: hit ? damage : 0,
  });
  if (!hit) return;
  room.dummy.health = Math.max(0, room.dummy.health - damage);
  room.rt.events.push({
    k: "hit",
    x: round1(HUB_DUMMY.x),
    y: round1(HUB_DUMMY.y),
    n: damage,
  });
  if (room.dummy.health <= 0) room.dummy.deadUntil = now + HUB_DUMMY_RESPAWN_MS;
};
