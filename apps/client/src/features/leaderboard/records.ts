import { readJson, writeJson } from "../../app/storage";

export interface LeaderboardEntry {
  name: string;
  seconds: number;
  date: number;
  roles: string[];
  outcome: "won" | "lost";
}

const KEY = "lanterns-leaderboard";
const MAX_PER_BUCKET = 10;

export const bucketFor = (players: number): string =>
  players <= 1 ? "solo" : players <= 2 ? "duo" : players <= 3 ? "trio" : "quad";

type Board = Record<string, LeaderboardEntry[]>;

const load = (): Board => readJson<Board>(KEY, {});

export const recordsFor = (bucket: string): LeaderboardEntry[] =>
  (load()[bucket] ?? [])
    .slice()
    .sort((a, b) =>
      a.outcome === b.outcome
        ? b.seconds - a.seconds
        : a.outcome === "won"
          ? -1
          : 1,
    );

export const saveRecord = (entry: LeaderboardEntry): void => {
  const board = load();
  const bucket = currentBucket;
  const list = board[bucket] ?? [];
  list.push(entry);
  list.sort((a, b) =>
    a.outcome === b.outcome
      ? b.seconds - a.seconds
      : a.outcome === "won"
        ? -1
        : 1,
  );
  board[bucket] = list.slice(0, MAX_PER_BUCKET);
  writeJson(KEY, board);
};

/** True when the entry beats this bucket's best winning time. */
export const isPersonalBest = (entry: LeaderboardEntry): boolean => {
  if (entry.outcome !== "won") return false;
  const best = recordsFor(currentBucket).find((r) => r.outcome === "won");
  return !best || entry.seconds < best.seconds;
};

/** Set by the end screen from the live room size before saving. */
export let currentBucket = "solo";

export const setBucket = (playerCount: number): void => {
  currentBucket = bucketFor(playerCount);
};
