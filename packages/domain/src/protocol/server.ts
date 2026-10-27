import type { MatchStats, RoomEvent } from "../results";
import type { Snapshot } from "../snapshot";
import type { RoomState } from "../types";

export type ServerMessage =
  | {
      type: "welcome";
      playerId: string;
      reconnectToken: string;
      roomCode: string;
      protocol: number;
    }
  | { type: "room-state"; room: RoomState }
  | { type: "snapshot"; snap: Snapshot }
  | { type: "room-event"; event: RoomEvent; playerId?: string; name?: string }
  | {
      type: "level-up";
      choices: { id: string; label: string; detail: string }[];
      level: number;
    }
  | { type: "match-ended"; outcome: "won" | "lost"; stats: MatchStats }
  | { type: "notice"; code: string; message: string }
  | { type: "pong"; sentAt: number; serverTime: number }
  | { type: "error"; code: string; message: string };

export const SERVER_MESSAGE_TYPES = [
  "welcome",
  "room-state",
  "snapshot",
  "room-event",
  "level-up",
  "match-ended",
  "notice",
  "pong",
  "error",
] as const;

export const isServerMessageType = (type: unknown): boolean =>
  typeof type === "string" &&
  (SERVER_MESSAGE_TYPES as readonly string[]).includes(type);
