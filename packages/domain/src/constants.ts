/** Bump when a message shape changes; see docs/PROTOCOL.md. */
export const PROTOCOL_VERSION = 1;

export const TICK_RATE = 30;
export const SNAPSHOT_RATE = 15;
export const ROOM_TICK_MS = 1000 / TICK_RATE;
export const SNAPSHOT_MS = 1000 / SNAPSHOT_RATE;

export const MAX_PLAYERS_PER_ROOM = 4;
export const MAX_ENEMIES_PER_ROOM = 150;
export const MAX_CONSTRUCTS_PER_ROOM = 60;
export const MAX_SHARDS_PER_ROOM = 120;

export const MATCH_DURATION_SECONDS = 10 * 60;
export const COUNTDOWN_MS = 5000;
export const RECONNECT_GRACE_MS = 60_000;
export const EMPTY_ROOM_TTL_MS = 60_000;
export const MAX_MESSAGE_BYTES = 8 * 1024;
export const MESSAGE_RATE_LIMIT_PER_SEC = 60;

export const MAP_SIZE = { width: 3200, height: 1800 } as const;
export const LANTERN_POSITION = {
  x: MAP_SIZE.width / 2,
  y: MAP_SIZE.height / 2,
} as const;

// Player
export const PLAYER_SPEED = 170;
export const PLAYER_RADIUS = 14;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_ENERGY = 100;
export const PLAYER_SHOT_DAMAGE = 14;
export const PLAYER_SHOT_RANGE = 420;
export const SHOT_COOLDOWN_MS = 240;
export const ENERGY_REGEN_IN_LIGHT = 7;
export const ENERGY_REGEN_OUTSIDE = 2;
export const INTERACTION_RADIUS = 64;

// Downed and revives
export const REVIVE_PROGRESS_MS = 3000;
export const REVIVE_HEALTH = 50;
export const DOWNED_HEALTH_REGEN = 0;

// Constructs
export const WALL_COST = 25;
export const TURRET_COST = 45;
export const WALL_MAX_HEALTH = 160;
export const TURRET_MAX_HEALTH = 90;
export const WALL_LIFETIME_MS = 45_000;
export const TURRET_LIFETIME_MS = 60_000;
export const CONSTRUCT_PLACEMENT_RANGE = 96;
export const CONSTRUCT_PLACEMENT_COOLDOWN_MS = 350;
export const TURRET_RANGE = 240;
export const TURRET_DAMAGE = 9;
export const TURRET_FIRE_MS = 600;
export const TURRET_ROTATION_SPEED = 6;

// Lantern
export const LANTERN_MAX_FUEL = 100;
export const LANTERN_MAX_HEALTH = 300;
export const LANTERN_FUEL_DRAIN_PER_SEC = 0.16;
export const LANTERN_RADIUS_MIN = 110;
export const LANTERN_RADIUS_MAX = 560;
export const SHARD_FUEL_BASE = 8;
export const SHARD_COLLECT_RADIUS = 34;
export const SHARD_DEPOSIT_RADIUS = 72;
export const SHARD_MERGE_RADIUS = 22;

// XP and level-ups
export const XP_PER_LEVEL_BASE = 60;
export const XP_LEVEL_GROWTH = 1.35;
export const UPGRADE_OPTIONS_COUNT = 3;
export const UPGRADE_MAX_STACKS = 3;

// Abilities
export const ABILITY_GLOBAL_COOLDOWN_MS = 1500;
export const WARD_LIFETIME_MS = 15_000;
export const BEACON_DURATION_MS = 8000;
export const BEACON_RADIUS_MULT = 1.6;
export const LUMEN_RADIUS_MULT = 1.35;

// Hub layout (pre-match roamable area)
export const HUB_SIZE = { width: 1440, height: 900 } as const;
export const HUB_LANTERN = { x: 720, y: 420 } as const;
export const HUB_SPAWN = { x: 720, y: 640 } as const;
export const HUB_RACK = { x: 300, y: 240 } as const;
export const HUB_DUMMY = { x: 1120, y: 300 } as const;
export const HUB_CIRCLE = { x: 720, y: 660, radius: 76 } as const;
export const HUB_LIGHT_RADIUS = 420;
export const HUB_DUMMY_HEALTH = 300;
export const HUB_DUMMY_RESPAWN_MS = 3000;
export const HUB_PLAYER_SPEED = 210;
