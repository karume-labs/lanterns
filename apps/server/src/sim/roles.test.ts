import { describe, expect, test } from "bun:test";
import {
  BEACON_DURATION_MS,
  BEACON_RADIUS_MULT,
  EMPTY_INPUT,
  ENEMIES_TABLE,
  type Enemy,
  type InputState,
  LANTERN_MAX_FUEL,
  LANTERN_POSITION,
  LANTERN_RADIUS_MAX,
  LANTERN_RADIUS_MIN,
  LUMEN_RADIUS_MULT,
  type Role,
  type RoomState,
  SHARD_DEPOSIT_RADIUS,
  WARD_LIFETIME_MS,
} from "@lanterns/domain";
import { castAbility } from "./abilities";
import { stepLantern } from "./lantern";
import { stepPlayers } from "./players";
import { createRuntime, seededRng } from "./runtime";
import { stepShards } from "./shards";

const T0 = 1_000_000;

const input = (patch: Partial<InputState>): InputState => ({
  ...EMPTY_INPUT,
  ...patch,
});

const makeState = (roles: Role[]): RoomState => ({
  code: "ROLES1",
  hostId: "p1",
  phase: "active",
  players: roles.map((role, index) => ({
    id: `p${index + 1}`,
    name: `P${index + 1}`,
    position: { ...LANTERN_POSITION },
    aim: { x: 1, y: 0 },
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    role,
    ready: true,
    connected: true,
    downed: false,
    invulnerableUntil: 0,
    reviveTargetId: null,
    reviveProgress: 0,
    kills: 0,
    revives: 0,
    downs: 0,
  })),
  lantern: {
    position: { ...LANTERN_POSITION },
    fuel: 50,
    health: 300,
    lightRadius: LANTERN_RADIUS_MIN,
  },
  countdownEndsAt: null,
  enemies: [],
  constructs: [],
  shards: [],
  elapsedSeconds: 0,
  teamLevel: 1,
  teamXp: 0,
  nextXpThreshold: 60,
  upgradeChoices: [],
  winner: null,
});

const makeEnemy = (patch: Partial<Enemy>): Enemy => ({
  id: crypto.randomUUID(),
  kind: "swarmer",
  position: { x: 0, y: 0 },
  health: ENEMIES_TABLE.swarmer.maxHealth,
  maxHealth: ENEMIES_TABLE.swarmer.maxHealth,
  attackAt: 0,
  aim: 0,
  ...patch,
});

describe("keeper", () => {
  test("never fires even while shooting is held", () => {
    const state = makeState(["keeper"]);
    const rt = createRuntime(seededRng(7));
    const enemy = makeEnemy({
      position: {
        x: LANTERN_POSITION.x + 100,
        y: LANTERN_POSITION.y,
      },
    });
    state.enemies.push(enemy);
    rt.inputs.set("p1", input({ shooting: true, aimX: 1, aimY: 0 }));
    for (let tick = 0; tick < 30; tick++)
      stepPlayers(state, rt, T0 + tick * 34);
    expect(enemy.health).toBe(enemy.maxHealth);
    expect(rt.events.some((event) => event.k === "shot")).toBe(false);
  });

  test("banks 1.5x fuel per shard deposit", () => {
    const state = makeState(["keeper"]);
    const rt = createRuntime(seededRng(7));
    state.shards.push({
      id: "shard-1",
      position: { ...LANTERN_POSITION },
      value: 10,
      carriedBy: "p1",
    });
    stepShards(state, rt);
    expect(state.lantern?.fuel).toBe(65);
    expect(state.shards.length).toBe(0);
  });

  test("ward construct expires early", () => {
    const state = makeState(["keeper"]);
    const rt = createRuntime(seededRng(7));
    state.players[0].position = {
      x: LANTERN_POSITION.x + 300,
      y: LANTERN_POSITION.y,
    };
    castAbility(state, rt, state.players[0], T0);
    const ward = state.constructs[state.constructs.length - 1];
    expect(ward).toBeDefined();
    expect(ward?.expiresAt).toBe(T0 + WARD_LIFETIME_MS);
  });
});

describe("lumen", () => {
  const baseRadius = (fuel: number): number =>
    LANTERN_RADIUS_MIN +
    (fuel / LANTERN_MAX_FUEL) * (LANTERN_RADIUS_MAX - LANTERN_RADIUS_MIN);

  test("a standing lumen widens the light", () => {
    const withLumen = makeState(["lumen"]);
    const without = makeState(["scout"]);
    const rtA = createRuntime(seededRng(3));
    const rtB = createRuntime(seededRng(3));
    stepLantern(withLumen, rtA, T0);
    stepLantern(without, rtB, T0);
    const fuelA = withLumen.lantern?.fuel ?? 0;
    const fuelB = without.lantern?.fuel ?? 0;
    expect(withLumen.lantern?.lightRadius).toBeCloseTo(
      baseRadius(fuelA) * LUMEN_RADIUS_MULT,
      5,
    );
    expect(without.lantern?.lightRadius).toBeCloseTo(baseRadius(fuelB), 5);
    expect(fuelA).toBe(fuelB);
  });

  test("beacon flares the light wider and emits a flare event", () => {
    const state = makeState(["lumen"]);
    const rt = createRuntime(seededRng(3));
    castAbility(state, rt, state.players[0], T0);
    expect(rt.beaconUntil).toBe(T0 + BEACON_DURATION_MS);
    expect(rt.events.some((event) => event.k === "flare")).toBe(true);
    stepLantern(state, rt, T0 + 10);
    const fuelOn = state.lantern?.fuel ?? 0;
    expect(state.lantern?.lightRadius).toBeCloseTo(
      Math.min(
        LANTERN_RADIUS_MAX,
        baseRadius(fuelOn) * LUMEN_RADIUS_MULT * BEACON_RADIUS_MULT,
      ),
      5,
    );
    stepLantern(state, rt, T0 + BEACON_DURATION_MS + 1);
    const fuelOff = state.lantern?.fuel ?? 0;
    expect(state.lantern?.lightRadius).toBeCloseTo(
      baseRadius(fuelOff) * LUMEN_RADIUS_MULT,
      5,
    );
    expect(fuelOff).toBeLessThan(fuelOn);
  });
});

describe("deposit radius", () => {
  test("lantern deposit radius constant stays sane", () => {
    expect(SHARD_DEPOSIT_RADIUS).toBeGreaterThan(0);
  });
});
