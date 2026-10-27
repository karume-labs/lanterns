import {
  HUB_DUMMY_HEALTH,
  type MatchStats,
  type Player,
  type RoomEvent,
  type RoomState,
  type Snapshot,
} from "@lanterns/domain";
import { createRuntime, type SimRuntime } from "../sim/runtime";

export interface RoomEventMsg {
  event: RoomEvent;
  playerId?: string;
  name?: string;
}

export interface MutationResult {
  room: RoomState;
  events: RoomEventMsg[];
  /** a level-up choice set rolled as part of this mutation */
  levelUp: boolean;
  /** true when the caller joined as a mid-match spectator */
  spectator?: boolean;
}

export interface TickResult {
  room: RoomState;
  snapshot: Snapshot | null;
  /** broadcast a full room-state frame */
  roomState: boolean;
  events: RoomEventMsg[];
  levelUp: boolean;
  matchEnded: MatchStats | null;
  /** microseconds spent stepping this room */
  tickMicros: number;
  snapshotBytes: number;
}

export interface RuntimeRoom {
  state: RoomState;
  rt: SimRuntime;
  /** reconnect token -> player id */
  tokens: Map<string, string>;
  /** player id -> active socket id */
  sockets: Map<string, string>;
  /** player id -> ms timestamp of the disconnect */
  disconnectedAt: Map<string, number>;
  /** mid-match watchers: player id -> display name (never simulated) */
  spectators: Map<string, string>;
  dummy: { health: number; deadUntil: number };
  prevReady: Map<string, boolean>;
  dirty: boolean;
  pending: RoomEventMsg[];
  pendingLevelUp: boolean;
  snapshotCounter: number;
}

export const createRuntimeRoom = (
  state: RoomState,
  token: string,
  playerId: string,
  socketId: string,
): RuntimeRoom => ({
  state,
  rt: createRuntime(),
  tokens: new Map([[token, playerId]]),
  sockets: new Map([[playerId, socketId]]),
  disconnectedAt: new Map(),
  spectators: new Map(),
  dummy: { health: HUB_DUMMY_HEALTH, deadUntil: 0 },
  prevReady: new Map([[playerId, false]]),
  dirty: true,
  pending: [],
  pendingLevelUp: false,
  snapshotCounter: 0,
});

/** Initial room state for a brand-new room created by `hostId`. */
export const createRoomState = (code: string, player: Player): RoomState => ({
  code,
  hostId: player.id,
  phase: "lobby",
  players: [player],
  lantern: null,
  countdownEndsAt: null,
  enemies: [],
  constructs: [],
  shards: [],
  elapsedSeconds: 0,
  teamLevel: 1,
  teamXp: 0,
  nextXpThreshold: 60,
  upgradeChoices: [],
  winner: null,
});
