import { describe, expect, test } from "bun:test";
import {
  COUNTDOWN_MS,
  EMPTY_INPUT,
  HUB_CIRCLE,
  RECONNECT_GRACE_MS,
} from "@lanterns/domain";
import { RoomError } from "./errors";
import { createRoomManager } from "./room-manager";

const T0 = 1_000_000;

describe("room membership", () => {
  test("creates a room and joins a second player by code", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const joined = manager.joinRoom(created.room.code, "p2", "Bob", "s2");
    expect(joined.room.players).toHaveLength(2);
    expect(joined.events[0]?.event).toBe("player-joined");
    expect(manager.playerCount).toBe(2);
  });

  test("rejects unknown codes, duplicates, and a fifth player", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    expect(() => manager.joinRoom("ZZZZZ", "pX", "X", "sX")).toThrow(RoomError);
    expect(() => manager.joinRoom(code, "p1", "Alice", "s1")).toThrow(
      RoomError,
    );
    manager.joinRoom(code, "p2", "Bob", "s2");
    manager.joinRoom(code, "p3", "Cara", "s3");
    manager.joinRoom(code, "p4", "Dan", "s4");
    expect(() => manager.joinRoom(code, "p5", "Eve", "s5")).toThrow(RoomError);
  });

  test("claims are exclusive: one player per color role", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    manager.joinRoom(created.room.code, "p2", "Bob", "s2");
    manager.selectRole(created.room.code, "p1", "builder");
    expect(() =>
      manager.selectRole(created.room.code, "p2", "builder"),
    ).toThrow(RoomError);
    manager.selectRole(created.room.code, "p2", "medic");
    expect(created.room.players[1]?.role).toBe("medic");
  });

  test("explicit leave removes the player and cleans up empty rooms", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const left = manager.leaveRoom("p1", "s1");
    expect(left).toBeNull();
    expect(manager.roomCount).toBe(0);
  });

  test("host role migrates when the host leaves", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    manager.joinRoom(created.room.code, "p2", "Bob", "s2");
    const left = manager.leaveRoom("p1", "s1");
    expect(left?.events.some((event) => event.event === "host-changed")).toBe(
      true,
    );
    expect(created.room.hostId).toBe("p2");
  });
});

describe("countdown flow", () => {
  const readyRoom = () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    manager.joinRoom(code, "p2", "Bob", "s2");
    manager.selectRole(code, "p1", "builder");
    manager.selectRole(code, "p2", "medic");
    for (const player of created.room.players)
      player.position = { x: HUB_CIRCLE.x, y: HUB_CIRCLE.y };
    return { manager, code, room: created.room };
  };

  test("starts when everyone claims a role and stands in the circle", () => {
    const { manager, code, room } = readyRoom();
    const [result] = manager.tick(T0);
    expect(result?.room.phase).toBe("countdown");
    expect(
      result?.events.some((event) => event.event === "countdown-started"),
    ).toBe(true);
    expect(room.countdownEndsAt).toBe(T0 + COUNTDOWN_MS);
  });

  test("cancels when a player disconnects mid-countdown", () => {
    const { manager, code, room } = readyRoom();
    manager.tick(T0);
    expect(room.phase).toBe("countdown");
    manager.disconnect(code, "p2", "s2", T0);
    const [result] = manager.tick(T0 + 100);
    expect(result?.room.phase).toBe("lobby");
    expect(
      result?.events.some((event) => event.event === "countdown-cancelled"),
    ).toBe(true);
  });

  test("cancels when a late player joins mid-countdown", () => {
    const { manager, code, room } = readyRoom();
    manager.tick(T0);
    manager.joinRoom(code, "p3", "Cara", "s3");
    const [result] = manager.tick(T0 + 100);
    expect(room.phase).toBe("lobby");
    expect(
      result?.events.some((event) => event.event === "countdown-cancelled"),
    ).toBe(true);
  });

  test("begins the match when the countdown expires", () => {
    const { manager, room } = readyRoom();
    manager.tick(T0);
    const [result] = manager.tick(T0 + COUNTDOWN_MS + 1);
    expect(
      result?.events.some((event) => event.event === "match-started"),
    ).toBe(true);
    expect(room.phase).toBe("active");
    expect(room.lantern).not.toBeNull();
    expect(room.players.every((player) => player.health === 100)).toBe(true);
  });

  test("host-only start, and only when everyone is ready", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    manager.selectRole(code, "p1", "builder");
    expect(() => manager.requestStart(code, "p1", T0)).toThrow(RoomError);
    const host = created.room.players[0];
    if (!host) throw new Error("missing host");
    host.position = { x: HUB_CIRCLE.x, y: HUB_CIRCLE.y };
    manager.joinRoom(code, "p2", "Bob", "s2");
    expect(() => manager.requestStart(code, "p2", T0)).toThrow(RoomError);
    expect(() => manager.requestStart(code, "p1", T0)).toThrow(RoomError);
  });
});

describe("whole-room pause", () => {
  const activeRoom = () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    manager.joinRoom(code, "p2", "Bob", "s2");
    manager.selectRole(code, "p1", "builder");
    manager.selectRole(code, "p2", "medic");
    for (const player of created.room.players)
      player.position = { x: HUB_CIRCLE.x, y: HUB_CIRCLE.y };
    manager.tick(T0); // lobby -> countdown
    manager.tick(T0 + COUNTDOWN_MS + 1); // countdown -> active
    expect(created.room.phase).toBe("active");
    return { manager, code, room: created.room };
  };

  test("opening the menu freezes the clock for the whole room", () => {
    const { manager, code, room } = activeRoom();
    manager.tick(T0 + COUNTDOWN_MS + 2);
    const frozenAt = room.elapsedSeconds;
    expect(frozenAt).toBeGreaterThan(0);
    manager.setPause(code, "p1", true, T0 + COUNTDOWN_MS + 3);
    expect(room.paused).toBe(true);
    manager.tick(T0 + COUNTDOWN_MS + 1_003);
    manager.tick(T0 + COUNTDOWN_MS + 2_003);
    expect(room.elapsedSeconds).toBe(frozenAt);
    manager.setPause(code, "p1", false, T0 + COUNTDOWN_MS + 3_003);
    expect(room.paused).toBe(false);
    manager.tick(T0 + COUNTDOWN_MS + 4_003);
    expect(room.elapsedSeconds).toBeGreaterThan(frozenAt);
  });

  test("stays paused until every requester closes the menu", () => {
    const { manager, code, room } = activeRoom();
    manager.setPause(code, "p1", true, T0 + 100);
    manager.setPause(code, "p2", true, T0 + 150);
    manager.setPause(code, "p1", false, T0 + 200);
    expect(room.paused).toBe(true);
    manager.setPause(code, "p2", false, T0 + 250);
    expect(room.paused).toBe(false);
  });

  test("only a running match can be paused", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    expect(() => manager.setPause(created.room.code, "p1", true, T0)).toThrow(
      RoomError,
    );
  });

  test("leaving or disconnecting releases that player's pause", () => {
    const { manager, code, room } = activeRoom();
    manager.setPause(code, "p1", true, T0 + 100);
    manager.setPause(code, "p2", true, T0 + 150);
    manager.disconnect(code, "p1", "s1", T0 + 200);
    expect(room.paused).toBe(true); // p2 still holds it
    manager.leaveRoom("p2", "s2");
    expect(room.paused).toBe(false);
    expect(room.players).toHaveLength(1);
  });

  test("inputs are dropped while the room is frozen", () => {
    const { manager, code, room } = activeRoom();
    manager.setPause(code, "p1", true, T0 + 100);
    const before = room.players[0]?.position.x ?? 0;
    manager.setInput(code, "p1", { ...EMPTY_INPUT, moveX: 1 });
    manager.tick(T0 + 1_100);
    manager.tick(T0 + 2_100);
    expect(room.players[0]?.position.x).toBe(before);
  });
});

describe("match end", () => {
  test("a finished run marks the room dirty so clients get the end state", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    manager.selectRole(code, "p1", "builder");
    const room = created.room;
    const host = room.players[0];
    if (!host) throw new Error("missing host");
    host.position = { x: HUB_CIRCLE.x, y: HUB_CIRCLE.y };
    manager.tick(T0);
    manager.tick(T0 + COUNTDOWN_MS + 1);
    expect(room.phase).toBe("active");
    if (!room.lantern) throw new Error("lantern missing");

    room.lantern.fuel = 0;
    const [result] = manager.tick(T0 + COUNTDOWN_MS + 100);
    expect(room.phase).toBe("lost");
    expect(result?.roomState).toBe(true);
    expect(result?.matchEnded?.outcome).toBe("lost");
  });
});

describe("reconnect handling", () => {
  test("disconnect keeps an idle post that the token can reclaim", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    manager.disconnect(code, "p1", "s1", T0);
    expect(created.room.players[0]?.connected).toBe(false);
    expect(manager.tick(T0 + 1000)[0]?.room.players).toHaveLength(1);

    const rejoined = manager.rejoinRoom(created.token, "s9");
    expect(rejoined.playerId).toBe("p1");
    expect(rejoined.events[0]?.event).toBe("player-reconnected");
    expect(created.room.players[0]?.connected).toBe(true);
  });

  test("idle posts expire after the grace window and their tokens die", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    const joined = manager.joinRoom(code, "p2", "Bob", "s2");
    manager.disconnect(code, "p2", "s2", T0);
    const [result] = manager.tick(T0 + RECONNECT_GRACE_MS + 1);
    expect(result?.room.players).toHaveLength(1);
    expect(result?.events.some((event) => event.event === "player-left")).toBe(
      true,
    );
    expect(() => manager.rejoinRoom(joined.token, "s9")).toThrow(RoomError);
  });

  test("a stale socket close does not mark the reclaimed player offline", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    manager.disconnect(code, "p1", "s1", T0);
    manager.rejoinRoom(created.token, "s2");
    const stale = manager.disconnect(code, "p1", "s1", T0 + 5);
    expect(stale).toBeNull();
    expect(created.room.players[0]?.connected).toBe(true);
  });
});

describe("mid-match spectators", () => {
  const activeRoom = () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    const code = created.room.code;
    manager.selectRole(code, "p1", "builder");
    const host = created.room.players[0];
    if (!host) throw new Error("missing host");
    host.position = { x: HUB_CIRCLE.x, y: HUB_CIRCLE.y };
    manager.tick(T0);
    manager.tick(T0 + COUNTDOWN_MS + 1);
    return { manager, code, room: created.room };
  };

  test("refuses a watcher while the room is still in the hub", () => {
    const manager = createRoomManager();
    const created = manager.createRoom("p1", "Alice", "s1");
    expect(() =>
      manager.watchRoom(created.room.code, "w1", "Wendy", "s9"),
    ).toThrow(RoomError);
  });

  test("a watcher joins a running match and never drives a player", () => {
    const { manager, code, room } = activeRoom();
    const watched = manager.watchRoom(code, "w1", "Wendy", "s9");
    expect(watched.spectator).toBe(true);
    expect(room.players).toHaveLength(1);

    const before = JSON.stringify(room.players[0]?.position);
    manager.setInput(code, "w1", { ...EMPTY_INPUT, moveX: 1 });
    expect(JSON.stringify(room.players[0]?.position)).toBe(before);

    // Reconnects come back as watchers, and leaving clears them entirely.
    manager.disconnect(code, "w1", "s9", T0);
    const rejoined = manager.rejoinRoom(watched.token, "s10");
    expect(rejoined.spectator).toBe(true);
    manager.leaveRoom("w1", "s10");
    expect(() => manager.setInput(code, "w1", EMPTY_INPUT)).toThrow(RoomError);
    expect(() => manager.rejoinRoom(watched.token, "s11")).toThrow(RoomError);
  });
});
