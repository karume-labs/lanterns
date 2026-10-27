import {
  LANTERN_MAX_FUEL,
  LANTERN_POSITION,
  LANTERN_RADIUS_MAX,
  maxEnergy,
  type RoomState,
  xpThresholdFor,
} from "@lanterns/domain";
import type { SimRuntime } from "./runtime";

/** Reset state and runtime for a fresh run (countdown reached zero). */
export const beginMatch = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  state.phase = "active";
  state.countdownEndsAt = null;
  state.elapsedSeconds = 0;
  state.winner = null;
  state.enemies = [];
  state.constructs = [];
  state.shards = [];
  state.teamLevel = 1;
  state.teamXp = 0;
  state.nextXpThreshold = xpThresholdFor(1);
  state.upgradeChoices = [];
  state.lantern = {
    position: { ...LANTERN_POSITION },
    fuel: LANTERN_MAX_FUEL,
    health: 300,
    lightRadius: LANTERN_RADIUS_MAX,
  };
  rt.takenUpgrades = {};
  rt.lastShotAt.clear();
  rt.lastAbilityAt.clear();
  rt.lastPlaceAt.clear();
  rt.enemyOwner.clear();
  rt.events = [];
  rt.nextSpawnAt = now + 2000;
  rt.endedSent = false;

  const players = state.players;
  players.forEach((player, index) => {
    const angle = (index / Math.max(1, players.length)) * Math.PI * 2;
    player.position = {
      x: LANTERN_POSITION.x + Math.cos(angle) * 130,
      y: LANTERN_POSITION.y + Math.sin(angle) * 130,
    };
    player.aim = { x: 0, y: -1 };
    player.maxHealth = 100;
    player.health = 100;
    player.maxEnergy = maxEnergy(0);
    player.energy = player.maxEnergy;
    player.downed = false;
    player.invulnerableUntil = now + 2000;
    player.reviveProgress = 0;
    player.reviveTargetId = null;
    player.kills = 0;
    player.revives = 0;
    player.downs = 0;
  });
};

/** Return the room to the hub after a finished match. */
export const endToLobby = (
  state: RoomState,
  rt: SimRuntime,
  now: number,
): void => {
  state.phase = "lobby";
  state.countdownEndsAt = null;
  state.winner = null;
  state.lantern = null;
  state.enemies = [];
  state.constructs = [];
  state.shards = [];
  state.elapsedSeconds = 0;
  state.teamLevel = 1;
  state.teamXp = 0;
  state.nextXpThreshold = xpThresholdFor(1);
  state.upgradeChoices = [];
  rt.takenUpgrades = {};
  rt.events = [];
  rt.endedSent = false;
  state.players.forEach((player) => {
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.downed = false;
    player.reviveProgress = 0;
    player.reviveTargetId = null;
    player.kills = 0;
    player.revives = 0;
    player.downs = 0;
    player.invulnerableUntil = now + 1000;
  });
};
