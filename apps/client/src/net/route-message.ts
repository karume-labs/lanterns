import type { ServerMessage } from "@lanterns/domain";
import type { SocketHandlers } from "./handlers";

/**
 * Route one raw server frame to the right handler. Unknown types are ignored
 * so a newer server stays backwards compatible (see docs/PROTOCOL.md).
 */
export const routeServerMessage = (
  raw: string,
  handlers: SocketHandlers,
  onToken: (token: string, playerId: string) => void,
): void => {
  let message: ServerMessage;
  try {
    message = JSON.parse(raw) as ServerMessage;
  } catch {
    return;
  }
  switch (message.type) {
    case "welcome":
      onToken(message.reconnectToken, message.playerId);
      handlers.onWelcome(message.playerId, message.roomCode);
      return;
    case "room-state":
      handlers.onRoom(message.room);
      return;
    case "snapshot":
      handlers.onSnapshot(message.snap);
      return;
    case "room-event":
      handlers.onEvent(message.event, message.playerId, message.name);
      return;
    case "level-up":
      handlers.onLevelUp(message.choices, message.level);
      return;
    case "match-ended":
      handlers.onMatchEnded(message.stats);
      return;
    case "notice":
      handlers.onNotice(message.message);
      return;
    case "pong":
      handlers.onLatency(Math.round(performance.now() - message.sentAt));
      return;
    case "error":
      handlers.onError(message.message, message.code);
      return;
  }
};
