import {
  type ClientMessage,
  isClientMessageType,
  isValidInput,
  MAX_MESSAGE_BYTES,
  ROLES,
  type Role,
} from "@lanterns/domain";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFinitePair = (value: unknown): value is { x: number; y: number } =>
  isRecord(value) &&
  typeof value.x === "number" &&
  Number.isFinite(value.x) &&
  typeof value.y === "number" &&
  Number.isFinite(value.y);

const cleanName = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

/**
 * Parse a raw frame into a fully validated `ClientMessage`. Anything that
 * does not match the documented shape returns null and is rejected.
 */
export const parseClientMessage = (raw: string): ClientMessage | null => {
  if (raw.length > MAX_MESSAGE_BYTES) return null;
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(decoded) || !isClientMessageType(decoded.type)) return null;

  switch (decoded.type) {
    case "create-room": {
      const name = cleanName(decoded.name);
      return name ? { type: "create-room", name } : null;
    }
    case "join-room":
    case "watch-room": {
      const name = cleanName(decoded.name);
      const code =
        typeof decoded.code === "string" ? decoded.code.toUpperCase() : "";
      if (!name || !/^[A-Z0-9]{5}$/.test(code)) return null;
      return { type: decoded.type, code, name };
    }
    case "rejoin-room":
      return typeof decoded.token === "string" && decoded.token.length > 8
        ? { type: "rejoin-room", token: decoded.token }
        : null;
    case "pause-match":
      return typeof decoded.paused === "boolean"
        ? { type: "pause-match", paused: decoded.paused }
        : null;
    case "input":
      return isValidInput(decoded.input)
        ? { type: "input", input: decoded.input }
        : null;
    case "select-role":
      return typeof decoded.role === "string" &&
        (ROLES as readonly string[]).includes(decoded.role)
        ? { type: "select-role", role: decoded.role as Role }
        : null;
    case "place-construct":
      return isFinitePair(decoded.position) &&
        (decoded.kind === undefined ||
          decoded.kind === "wall" ||
          decoded.kind === "turret")
        ? {
            type: "place-construct",
            position: decoded.position,
            kind: decoded.kind,
          }
        : null;
    case "choose-upgrade":
      return typeof decoded.upgradeId === "string" && decoded.upgradeId
        ? { type: "choose-upgrade", upgradeId: decoded.upgradeId }
        : null;
    case "ping":
      return typeof decoded.sentAt === "number"
        ? { type: "ping", sentAt: decoded.sentAt }
        : null;
    case "leave-room":
    case "start-match":
    case "return-lobby":
      return { type: decoded.type };
    default:
      return null;
  }
};
