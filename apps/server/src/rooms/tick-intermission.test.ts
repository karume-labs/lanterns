import { describe, expect, test } from "bun:test";
import {
  LANTERN_MAX_FUEL,
  LANTERN_MAX_HEALTH,
  LANTERN_POSITION,
  type Player,
  type RoomState,
} from "@lanterns/domain";
import { createRoomState, createRuntimeRoom } from "./runtime";
import { tickRoom } from "./tick";
import { pickUpgrade } from "./upgrade-votes";

const T0 = 2_000_000;

const makePlayer = (id: string, name: string): Player => ({
  id,
  name,
  position: { x: 100, y: 100 },
  aim: { x: 1, y: 0 },
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  role: "builder",
  ready: true,
  connected: true,
  downed: false,
  invulnerableUntil: 0,
  reviveTargetId: null,
  reviveProgress: 0,
  kills: 0,
  revives: 0,
  downs: 0,
});

const choices = (): RoomState["upgradeChoices"] => [
  { id: "power", label: "Hot Shots", detail: "+25% shot damage" },
  { id: "fuel", label: "Fuel Top-off", detail: "+25 lantern fuel now" },
  { id: "vitality", label: "Warm Hearts", detail: "+25 max health" },
];

const activeRoom = () => {
  const state = createRoomState("ABCD", makePlayer("p1", "Alice"));
  state.players.push(makePlayer("p2", "Bob"));
  state.phase = "active";
  state.lantern = {
    position: { ...LANTERN_POSITION },
    fuel: LANTERN_MAX_FUEL,
    health: LANTERN_MAX_HEALTH,
    lightRadius: 300,
  };
  state.enemies.push({
    id: "e1",
    kind: "swarmer",
    position: { x: 500, y: 500 },
    health: 20,
    maxHealth: 20,
    attackAt: 0,
    aim: 0,
  });
  state.upgradeChoices = choices();
  const room = createRuntimeRoom(state, "tok1", "p1", "s1");
  const rooms = new Map([[state.code, room]]);
  return { room, rooms, state };
};

describe("level-up intermission", () => {
  test("the sim freezes until every connected player has voted", () => {
    const { room, rooms, state } = activeRoom();
    const before = tickRoom(room, T0);
    expect(before).not.toBeNull();
    expect(state.elapsedSeconds).toBe(0);
    expect(state.upgradeChoices).toHaveLength(3);

    const first = pickUpgrade(rooms, state.code, "p1", "power");
    expect(first.levelUp).toBe(true);
    expect(room.rt.takenUpgrades["power"]).toBe(1);
    tickRoom(room, T0 + 33);
    // p2 has not voted: still frozen, table still up.
    expect(state.elapsedSeconds).toBe(0);
    expect(state.upgradeChoices).toHaveLength(3);

    pickUpgrade(rooms, state.code, "p2", "vitality");
    // Second vote is an ack only: the first pick's effect stands.
    expect(room.rt.takenUpgrades["vitality"] ?? 0).toBe(0);
    tickRoom(room, T0 + 66);
    expect(state.upgradeChoices).toHaveLength(0);
    // Resumed: the clock advances again.
    tickRoom(room, T0 + 100);
    expect(state.elapsedSeconds).toBeGreaterThan(0);
  });

  test("the deadline applies the first choice instead of stalling", () => {
    const { room, rooms, state } = activeRoom();
    tickRoom(room, T0);
    expect(state.elapsedSeconds).toBe(0);
    const late = pickUpgrade(rooms, state.code, "p1", "fuel");
    expect(late.levelUp).toBe(true);
    // Only one vote, then the 25 s intermission lapses.
    tickRoom(room, T0 + 30_000);
    expect(state.upgradeChoices).toHaveLength(0);
    expect(room.rt.takenUpgrades["fuel"]).toBe(1);
  });
});
