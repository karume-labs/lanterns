import {
  type InputState,
  MAP_SIZE,
  moveWithCollision,
  PLAYER_RADIUS,
  PLAYER_SHOT_RANGE,
  PLAYER_SPEED,
  type Player,
  ROLES_TABLE,
  type RoomState,
  regenEnergy,
  round1,
  shotCooldownMs,
  shotDamage,
} from "@lanterns/domain";
import { castAbility } from "./abilities";
import { placeAt, wallSolids } from "./constructs";
import { SIM_DT, type SimRuntime, stacks } from "./runtime";

const AIM_SHOT_DOT = 0.75; // ~41 degree aim tolerance

const defaultInput = (player: Player): InputState => ({
  moveX: 0,
  moveY: 0,
  aimX: player.aim.x,
  aimY: player.aim.y,
  shooting: false,
  selectedConstruct: null,
  placeConstruct: false,
  useRoleAbility: false,
  interact: false,
});

export const aimPoint = (player: Player): { x: number; y: number } => ({
  x: player.position.x + player.aim.x * 64,
  y: player.position.y + player.aim.y * 64,
});

/** Advance every connected, standing player one authoritative tick. */
export const stepPlayers = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  const lantern = state.lantern;
  for (const player of state.players) {
    if (!player.connected || player.downed) continue;
    const input = rt.inputs.get(player.id) ?? defaultInput(player);

    const roleSpeed = player.role ? ROLES_TABLE[player.role].mods.speed : 1;
    const speed = PLAYER_SPEED * roleSpeed * (1 + 0.15 * stacks(rt, "haste"));
    player.position = moveWithCollision(
      player.position,
      { x: input.moveX * speed * SIM_DT, y: input.moveY * speed * SIM_DT },
      PLAYER_RADIUS,
      wallSolids(state),
      { width: MAP_SIZE.width, height: MAP_SIZE.height },
    );
    player.aim = { x: input.aimX, y: input.aimY };

    const inLight =
      lantern !== null &&
      Math.hypot(
        player.position.x - lantern.position.x,
        player.position.y - lantern.position.y,
      ) <= lantern.lightRadius;
    player.energy = regenEnergy(
      player.energy,
      SIM_DT,
      inLight,
      stacks(rt, "battery"),
    );

    const cooldown = shotCooldownMs(player.role, stacks(rt, "reload"));
    const lastShot = rt.lastShotAt.get(player.id) ?? -1e9;
    // Keepers never fire; their kit is fuel, mending, and the ward.
    if (
      input.shooting &&
      player.role !== "keeper" &&
      now - lastShot >= cooldown
    ) {
      rt.lastShotAt.set(player.id, now);
      fireShot(state, rt, player);
    }
    if (rt.pendingAbility.delete(player.id))
      castAbility(state, rt, player, now);
    if (rt.pendingPlace.delete(player.id)) {
      placeAt(
        state,
        rt,
        player,
        input.selectedConstruct ?? "wall",
        aimPoint(player),
        now,
      );
    }
  }
};

const fireShot = (state: RoomState, rt: SimRuntime, player: Player): void => {
  const aim = player.aim;
  let best: (typeof state.enemies)[number] | null = null;
  let bestDot = AIM_SHOT_DOT;
  for (const enemy of state.enemies) {
    const dx = enemy.position.x - player.position.x;
    const dy = enemy.position.y - player.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist > PLAYER_SHOT_RANGE || dist < 1) continue;
    const dot = (dx / dist) * aim.x + (dy / dist) * aim.y;
    if (dot > bestDot) {
      bestDot = dot;
      best = enemy;
    }
  }
  const damage = shotDamage(player.role, stacks(rt, "power"));
  rt.events.push({
    k: "shot",
    x: round1(player.position.x),
    y: round1(player.position.y),
    dx: round1(aim.x),
    dy: round1(aim.y),
    s: best ? damage : 0,
  });
  if (!best) return;
  best.health -= damage;
  rt.enemyOwner.set(best.id, player.id);
  rt.events.push({
    k: "hit",
    x: round1(best.position.x),
    y: round1(best.position.y),
    n: damage,
  });
};
