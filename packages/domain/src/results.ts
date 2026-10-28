import type { Role } from "./types";

export const ROOM_EVENTS = [
  "player-joined",
  "player-left",
  "player-reconnected",
  "countdown-started",
  "countdown-cancelled",
  "match-started",
  "host-changed",
  "game-paused",
  "game-resumed",
] as const;
export type RoomEvent = (typeof ROOM_EVENTS)[number];

export interface PlayerStats {
  id: string;
  name: string;
  role: Role | null;
  kills: number;
  revives: number;
  downs: number;
}

export interface MatchStats {
  outcome: "won" | "lost";
  survivalSeconds: number;
  teamKills: number;
  teamRevives: number;
  lanternFuel: number;
  teamLevel: number;
  players: PlayerStats[];
}

export interface UpgradeChoice {
  id: string;
  label: string;
  detail: string;
}
