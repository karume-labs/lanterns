import {
  EMPTY_INPUT,
  HUB_CIRCLE,
  type InputState,
  type Role,
  type ServerMessage,
} from "../packages/domain/src/index.ts";

export const ROOM_CAPACITY = 4;
const ROLE_CYCLE: Role[] = ["builder", "medic", "striker", "scout"];

export interface BotCounters {
  matchesStarted: number;
}

export interface Bot {
  ws: WebSocket;
  group: number;
  role: Role;
  phase: string;
  playerId: string | null;
  myIndex: number;
  x: number;
  y: number;
  angle: number;
  nextFlipAt: number;
  gaveUpWaiting: boolean;
  joined: boolean;
}

export const send = (ws: WebSocket, message: unknown): void => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
};

export const inputFor = (bot: Bot, now: number): InputState => {
  if (now > bot.nextFlipAt) {
    bot.angle = Math.random() * Math.PI * 2;
    bot.nextFlipAt = now + 800 + Math.random() * 1600;
  }
  const inHub = bot.phase === "lobby" || bot.phase === "countdown";
  if (inHub) {
    const dx = HUB_CIRCLE.x - bot.x;
    const dy = HUB_CIRCLE.y - bot.y;
    if (Math.hypot(dx, dy) > HUB_CIRCLE.radius - 12) {
      const length = Math.hypot(dx, dy) || 1;
      return { ...EMPTY_INPUT, moveX: dx / length, moveY: dy / length };
    }
    return {
      ...EMPTY_INPUT,
      aimX: Math.cos(bot.angle),
      aimY: Math.sin(bot.angle),
    };
  }
  return {
    ...EMPTY_INPUT,
    moveX: Math.cos(bot.angle),
    moveY: Math.sin(bot.angle),
    aimX: Math.cos(bot.angle),
    aimY: Math.sin(bot.angle),
    shooting: true,
  };
};

export const makeBot = (
  index: number,
  server: string,
  rooms: (string | null)[],
  counters: BotCounters,
): Bot => {
  const group = Math.floor(index / ROOM_CAPACITY);
  const bot: Bot = {
    ws: new WebSocket(server),
    group,
    role: ROLE_CYCLE[index % ROLE_CYCLE.length],
    phase: "lobby",
    playerId: null,
    myIndex: -1,
    x: 0,
    y: 0,
    angle: Math.random() * Math.PI * 2,
    nextFlipAt: 0,
    gaveUpWaiting: false,
    joined: false,
  };
  const openedAt = Date.now();
  const joinWhenReady = (): void => {
    if (bot.ws.readyState !== WebSocket.OPEN) return;
    if (rooms[group]) {
      send(bot.ws, {
        type: "join-room",
        code: rooms[group],
        name: `Bot-${index}`,
      });
      return;
    }
    if (bot.gaveUpWaiting || Date.now() - openedAt > 4000) {
      bot.gaveUpWaiting = true;
      send(bot.ws, { type: "create-room", name: `Bot-${index}` });
      return;
    }
    setTimeout(joinWhenReady, 100);
  };
  bot.ws.addEventListener("open", () => {
    if (index % ROOM_CAPACITY === 0)
      send(bot.ws, { type: "create-room", name: `Bot-${index}` });
    else joinWhenReady();
  });
  bot.ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as ServerMessage;
    if (message.type === "welcome") {
      bot.playerId = message.playerId;
      if (!rooms[group]) rooms[group] = message.roomCode;
      send(bot.ws, { type: "select-role", role: bot.role });
    } else if (message.type === "room-state") {
      bot.joined = true;
      bot.phase = message.room.phase;
      bot.myIndex = message.room.players.findIndex(
        (player) => player.id === bot.playerId,
      );
    } else if (message.type === "snapshot") {
      bot.phase = message.snap.ph;
      const row = bot.myIndex >= 0 ? message.snap.pl[bot.myIndex] : undefined;
      if (row) {
        bot.x = row[0] ?? 0;
        bot.y = row[1] ?? 0;
      }
    } else if (message.type === "room-event") {
      if (message.event === "match-started") counters.matchesStarted += 1;
    } else if (message.type === "error" && !bot.gaveUpWaiting) {
      bot.gaveUpWaiting = true;
      send(bot.ws, { type: "create-room", name: `Bot-${index}` });
    }
  });
  return bot;
};
