import {
  distance,
  INTERACTION_RADIUS,
  type Player,
  ROLES_TABLE,
  type RoomState,
  round1,
} from "@lanterns/domain";
import { SIM_DT, type SimRuntime } from "./runtime";

/** Hold `interact` beside a downed ally to channel their revive. */
export const stepRevives = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  for (const downed of state.players) {
    if (!downed.downed || !downed.connected) continue;
    let bestProgress = downed.reviveProgress;
    let reviverId: string | null = null;
    for (const helper of state.players) {
      if (helper.id === downed.id || !helper.connected || helper.downed)
        continue;
      if (distance(helper.position, downed.position) > INTERACTION_RADIUS)
        continue;
      const input = rt.inputs.get(helper.id);
      if (!input?.interact) continue;
      const mult = helper.role ? ROLES_TABLE[helper.role].mods.reviveSpeed : 1;
      const candidate = downed.reviveProgress + (mult / 3) * SIM_DT;
      if (candidate > bestProgress) {
        bestProgress = candidate;
        reviverId = helper.id;
      }
    }
    downed.reviveProgress = Math.min(1, bestProgress);
    if (reviverId) {
      const helper = state.players.find((player) => player.id === reviverId);
      if (helper) helper.reviveTargetId = downed.id;
    }
    if (downed.reviveProgress < 1) continue;

    downed.downed = false;
    downed.health = Math.max(50, Math.round(downed.maxHealth * 0.5));
    downed.reviveProgress = 0;
    downed.invulnerableUntil = now + 1500;
    const helper = state.players.find((player) => player.id === reviverId);
    if (helper) {
      helper.revives += 1;
      helper.reviveTargetId = null;
    }
    rt.events.push({ k: "revived", p: state.players.indexOf(downed) });
  }
};

/** Apply damage to a player, transitioning them to downed at zero health. */
export const damagePlayer = (
  state: RoomState,
  rt: SimRuntime,
  player: Player,
  amount: number,
  now: number,
): void => {
  if (!player.connected) return; // idle posts cannot be hurt
  if (now < player.invulnerableUntil) return;
  player.health = Math.max(0, player.health - amount);
  rt.events.push({
    k: "hit",
    x: round1(player.position.x),
    y: round1(player.position.y),
    n: amount,
  });
  if (player.health > 0 || player.downed) return;
  player.downed = true;
  player.downs += 1;
  player.reviveProgress = 0;
  player.reviveTargetId = null;
  rt.events.push({ k: "down", p: state.players.indexOf(player) });
  // A down is felt, not a quake: keep the kick well under the camera clamp.
  rt.events.push({ k: "shake", n: 4 });
};
