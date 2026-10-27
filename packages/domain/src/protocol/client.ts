import type { InputState } from "../input-state";
import type { Role, Vector2 } from "../types";

export type ClientMessage =
  | { type: "create-room"; name: string }
  | { type: "join-room"; code: string; name: string }
  | { type: "watch-room"; code: string; name: string }
  | { type: "rejoin-room"; token: string }
  | { type: "leave-room" }
  | { type: "input"; input: InputState }
  | { type: "select-role"; role: Role }
  | { type: "start-match" }
  | { type: "return-lobby" }
  | { type: "place-construct"; position: Vector2; kind?: "wall" | "turret" }
  | { type: "choose-upgrade"; upgradeId: string }
  | { type: "ping"; sentAt: number };

export const CLIENT_MESSAGE_TYPES = [
  "create-room",
  "join-room",
  "watch-room",
  "rejoin-room",
  "leave-room",
  "input",
  "select-role",
  "start-match",
  "return-lobby",
  "place-construct",
  "choose-upgrade",
  "ping",
] as const;

export const isClientMessageType = (type: unknown): boolean =>
  typeof type === "string" &&
  (CLIENT_MESSAGE_TYPES as readonly string[]).includes(type);
