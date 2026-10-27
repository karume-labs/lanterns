/**
 * Headless load test: `bun tools/bots.ts 20` spreads bots across rooms of
 * four, claims roles, walks into the ready circle so the match auto-starts,
 * then wanders and fires for the run window. Prints /metrics at the end.
 */
import {
  type Bot,
  type BotCounters,
  inputFor,
  makeBot,
  ROOM_CAPACITY,
  send,
} from "./bot-client.ts";

const COUNT = Number.parseInt(process.argv[2] ?? "20", 10);
const SERVER = process.argv[3] ?? "ws://localhost:3000/ws";
const METRICS_URL = process.argv[4] ?? "http://localhost:3000/metrics";
const RUN_SECONDS = Number.parseInt(process.argv[5] ?? "25", 10);
const INPUT_MS = 66;

const counters: BotCounters = { matchesStarted: 0 };
const rooms: (string | null)[] = Array.from(
  { length: Math.ceil(COUNT / ROOM_CAPACITY) },
  () => null,
);
const bots: Bot[] = Array.from({ length: COUNT }, (_, index) =>
  makeBot(index, SERVER, rooms, counters),
);

setInterval(() => {
  const now = Date.now();
  for (const bot of bots) {
    if (!bot.joined) continue;
    send(bot.ws, { type: "input", input: inputFor(bot, now) });
  }
}, INPUT_MS);

setTimeout(async () => {
  const metrics = (await fetch(METRICS_URL).then((response) =>
    response.json(),
  )) as Record<string, number>;
  const ticks = metrics.ticks ?? 0;
  const avgTickMs =
    ticks > 0
      ? Number(((metrics.tickMicrosTotal ?? 0) / ticks / 1000).toFixed(3))
      : 0;
  console.log(
    JSON.stringify(
      {
        bots: COUNT,
        avgTickMs,
        matchesStarted: counters.matchesStarted,
        ...metrics,
      },
      null,
      2,
    ),
  );
  for (const bot of bots) bot.ws.close();
  process.exit(0);
}, RUN_SECONDS * 1000);
