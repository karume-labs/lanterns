import {
  MAX_MESSAGE_BYTES,
  MESSAGE_RATE_LIMIT_PER_SEC,
  ROOM_TICK_MS,
  type ServerMessage,
} from "@lanterns/domain";
import { env, isPortValid } from "./env";
import { createMetrics, formatLog, recordReject, recordTick } from "./metrics";
import { handleMessage } from "./net/messages";
import { parseClientMessage } from "./net/parse";
import { serveStatic } from "./net/static";
import { publish, reply, type SocketData, type WireServer } from "./net/wire";
import { createRoomManager } from "./rooms/room-manager";

if (!isPortValid) throw new Error(`Invalid PORT: ${env.port}`);

const rooms = createRoomManager();
const metrics = createMetrics();
let server: WireServer;

const allowMessage = (data: SocketData, now: number): boolean => {
  if (now - data.rateWindow >= 1000) {
    data.rateWindow = now;
    data.rateCount = 0;
  }
  data.rateCount += 1;
  return data.rateCount <= MESSAGE_RATE_LIMIT_PER_SEC;
};

server = Bun.serve<SocketData>({
  port: env.port,
  hostname: env.host,
  fetch(request, bunServer) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const upgraded = bunServer.upgrade(request, {
        data: {
          playerId: crypto.randomUUID(),
          socketId: crypto.randomUUID(),
          rateCount: 0,
          rateWindow: Date.now(),
        },
      });
      return upgraded
        ? undefined
        : new Response("WebSocket upgrade failed", { status: 400 });
    }
    if (url.pathname === "/health")
      return new Response("ok", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    if (url.pathname === "/metrics")
      return Response.json({
        ...metrics,
        rooms: rooms.roomCount,
        players: rooms.playerCount,
      });
    return serveStatic(url.pathname);
  },
  websocket: {
    message(socket, raw) {
      const now = Date.now();
      if (!allowMessage(socket.data, now)) {
        recordReject(metrics, "rate-limited");
        return;
      }
      const frame = typeof raw === "string" ? raw : raw.toString();
      if (frame.length > MAX_MESSAGE_BYTES) {
        recordReject(metrics, "invalid-message");
        reply(socket, error("invalid-message", "Message too large."));
        return;
      }
      const message = parseClientMessage(frame);
      if (!message) {
        recordReject(metrics, "invalid-message");
        reply(socket, error("invalid-message", "Message must be valid JSON."));
        return;
      }
      handleMessage(socket, message, { rooms, server, now, metrics });
    },
    close(socket) {
      const result = rooms.disconnect(
        socket.data.roomCode,
        socket.data.playerId,
        socket.data.socketId,
        Date.now(),
      );
      if (result)
        publish(server, result.room.code, {
          type: "room-state",
          room: result.room,
        });
    },
  },
});

const error = (code: string, message: string): ServerMessage => ({
  type: "error",
  code,
  message,
});

setInterval(() => {
  const now = Date.now();
  for (const result of rooms.tick(now)) {
    const code = result.room.code;
    if (result.roomState)
      publish(server, code, { type: "room-state", room: result.room });
    for (const event of result.events)
      publish(server, code, {
        type: "room-event",
        event: event.event,
        playerId: event.playerId,
        name: event.name,
      });
    if (result.levelUp)
      publish(server, code, {
        type: "level-up",
        choices: result.room.upgradeChoices,
        level: result.room.teamLevel,
      });
    if (result.matchEnded)
      publish(server, code, {
        type: "match-ended",
        outcome: result.matchEnded.outcome,
        stats: result.matchEnded,
      });
    if (result.snapshotFrame) server.publish(code, result.snapshotFrame);
    recordTick(metrics, result.tickMicros, result.snapshotBytes);
  }
}, ROOM_TICK_MS);

setInterval(() => {
  console.log(formatLog(metrics, rooms.roomCount, rooms.playerCount));
}, env.logIntervalMs);

console.log(`Lanterns server listening on http://localhost:${server.port}`);
