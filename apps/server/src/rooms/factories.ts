import { HUB_SPAWN, MAX_PLAYERS_PER_ROOM, type Player } from "@lanterns/domain";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short, collision-resistant room code (no 0/O/1/I). */
export const createRoomCode = (taken: ReadonlyMap<string, unknown>): string => {
  let code = "";
  do {
    code = Array.from(
      { length: 5 },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
    ).join("");
  } while (taken.has(code));
  return code;
};

export const createPlayer = (
  id: string,
  name: string,
  index: number,
): Player => ({
  id,
  name: name.trim().slice(0, 16) || `Player${index + 1}`,
  position: {
    x: HUB_SPAWN.x + (index % 2) * 56 - 28,
    y: HUB_SPAWN.y + Math.floor(index / 2) * 56,
  },
  aim: { x: 1, y: 0 },
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  role: null,
  ready: false,
  connected: true,
  downed: false,
  invulnerableUntil: 0,
  reviveTargetId: null,
  reviveProgress: 0,
  kills: 0,
  revives: 0,
  downs: 0,
});

/** Count of connected players, capped by the room limit. */
export const connectedCount = (players: readonly Player[]): number =>
  players.filter((player) => player.connected).length;

export const isFull = (players: readonly Player[]): boolean =>
  connectedCount(players) >= MAX_PLAYERS_PER_ROOM;
