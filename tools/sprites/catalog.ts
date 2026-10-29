import { BOSS_IDLE } from "./boss";
import {
  TURRET_BARRELS,
  TURRET_BASE,
  WALL_HURT,
  WALL_IDLE,
} from "./constructs";
import { ENEMY_BASES } from "./enemies";
import { enemyFrames } from "./enemy-frames";
import { BUILD_ICONS, ROLE_ICONS } from "./icons";
import { LANTERN_FRAMES } from "./lantern";
import {
  EMBER_0,
  EMBER_1,
  ORB_FUEL,
  RING_0,
  RING_1,
  RING_2,
  SHARD,
  SHOT_ENEMY,
  SHOT_FRIENDLY,
} from "./pickups-fx";
import { ROLE_COLOR, ROLES_LIST } from "./role-bases";
import { roleFrames } from "./roles";
import {
  CAMPFIRE,
  DUMMY_DOWN,
  DUMMY_IDLE,
  PRACTICE_HOOP,
  SIGNPOST,
  TILE_FRAMES,
} from "./tiles-props";

export interface SpriteDef {
  rows: readonly string[];
  /** pixel anchor from top-left (feet center for characters). */
  anchorX: number;
  anchorY: number;
}

/** Pad ragged rows so every row in a frame shares one width. */
export const normalize = (rows: readonly string[]): string[] => {
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => row.padEnd(width, "."));
};

const def = (
  rows: readonly string[],
  anchorX: number,
  anchorY: number,
): SpriteDef => ({ rows: normalize(rows), anchorX, anchorY });

const feetAnchor = (
  rows: readonly string[],
  feetRow: number,
  centerX: number,
): SpriteDef => def(rows, centerX, feetRow);

/** Every sprite in the game, grouped for the sheet and the atlas. */
export const catalog = (): Record<string, Record<string, SpriteDef>> => {
  const roles: Record<string, SpriteDef> = {};
  for (const role of ROLES_LIST) {
    const frames = roleFrames(role);
    roles[`${role}_idle`] = feetAnchor(frames.idle, 15, 8);
    roles[`${role}_walk_a`] = feetAnchor(frames.walkA, 15, 8);
    roles[`${role}_walk_b`] = feetAnchor(frames.walkB, 15, 8);
    roles[`${role}_attack`] = feetAnchor(frames.attack, 15, 8);
    roles[`${role}_down`] = feetAnchor(frames.down, 15, 8);
    const iconColor = ROLE_COLOR[role] ?? "T";
    roles[`icon_${role}`] = def(
      (ROLE_ICONS[role] ?? []).map((row) => row.replaceAll("c", iconColor)),
      4,
      4,
    );
  }
  const lantern: Record<string, SpriteDef> = {};
  for (const [name, rows] of Object.entries(LANTERN_FRAMES))
    lantern[`lantern_${name}`] = feetAnchor(rows, 16, 6);
  const enemies: Record<string, SpriteDef> = {};
  for (const kind of Object.keys(ENEMY_BASES)) {
    const frames = enemyFrames(kind);
    const feet =
      kind === "ranged"
        ? 14
        : kind === "chaser"
          ? 13
          : kind === "tank"
            ? 21
            : 10;
    const cx = kind === "ranged" ? 6 : kind === "tank" ? 12 : 8;
    enemies[`${kind}_idle`] = feetAnchor(frames.idle, feet, cx);
    enemies[`${kind}_walk_a`] = feetAnchor(frames.walkA, feet, cx);
    enemies[`${kind}_walk_b`] = feetAnchor(frames.walkB, feet, cx);
    enemies[`${kind}_attack`] = feetAnchor(frames.attack, feet, cx);
    enemies[`${kind}_down`] = feetAnchor(frames.down, feet, cx);
  }
  const tank = enemyFrames("tank");
  enemies.tank_idle = feetAnchor(ENEMY_BASES.tank ?? [], 21, 12);
  enemies.tank_walk_a = feetAnchor(tank.walkA, 21, 12);
  enemies.tank_walk_b = feetAnchor(tank.walkB, 21, 12);
  enemies.tank_attack = feetAnchor(tank.attack, 21, 12);
  enemies.tank_down = feetAnchor(tank.down, 21, 12);
  enemies.boss_idle = feetAnchor(BOSS_IDLE, 45, 24);
  const barrel = (dir: string): readonly string[] => {
    const rows = TURRET_BARRELS[dir];
    if (!rows) throw new Error(`missing turret barrel ${dir}`);
    return rows;
  };
  const constructs: Record<string, SpriteDef> = {
    wall: def(WALL_IDLE, 8, 10),
    wall_hurt: def(WALL_HURT, 8, 10),
    turret_base: def(TURRET_BASE, 7, 7),
    turret_S: def([...barrel("S"), ...TURRET_BASE], 7, 10),
    turret_E: def([...barrel("E"), ...TURRET_BASE], 7, 10),
    turret_N: def([...barrel("N"), ...TURRET_BASE], 7, 10),
    turret_W: def([...barrel("W"), ...TURRET_BASE], 7, 10),
    icon_wall: def(BUILD_ICONS["wall"] ?? [], 4, 4),
    icon_turret: def(BUILD_ICONS["turret"] ?? [], 4, 4),
    icon_ability: def(BUILD_ICONS["ability"] ?? [], 4, 4),
  };
  const tiles: Record<string, SpriteDef> = {};
  for (const [name, rows] of Object.entries(TILE_FRAMES))
    tiles[name] = def(rows, 0, 0);
  const props: Record<string, SpriteDef> = {
    dummy: feetAnchor(DUMMY_IDLE, 15, 8),
    dummy_down: feetAnchor(DUMMY_DOWN, 15, 8),
    campfire: def(CAMPFIRE, 8, 16),
    signpost: def(SIGNPOST, 5, 14),
    practice_hoop: def(PRACTICE_HOOP, 8, 10),
  };
  const fx: Record<string, SpriteDef> = {
    shard: def(SHARD, 4, 8),
    orb_fuel: def(ORB_FUEL, 3, 2),
    shot_friendly: def(SHOT_FRIENDLY, 1, 1),
    shot_enemy: def(SHOT_ENEMY, 1, 1),
    ring_0: def(RING_0, 8, 8),
    ring_1: def(RING_1, 8, 8),
    ring_2: def(RING_2, 8, 8),
    ember_0: def(EMBER_0, 1, 1),
    ember_1: def(EMBER_1, 1, 1),
  };
  return { roles, lantern, enemies, constructs, tiles, props, fx };
};
