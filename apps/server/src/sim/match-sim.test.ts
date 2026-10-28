import { describe, expect, test } from "bun:test";
import {
  EMPTY_INPUT,
  ENEMIES_TABLE,
  type Enemy,
  HUB_CIRCLE,
  type InputState,
  LANTERN_POSITION,
  MATCH_DURATION_SECONDS,
  MAX_ENEMIES_PER_ROOM,
  type Role,
  type RoomState,
  TURRET_RANGE,
} from "@lanterns/domain";
import { castAbility } from "./abilities";
import { placeAt } from "./constructs";
import { processDeaths } from "./deaths";
import { stepEnemies } from "./enemies";
import { beginMatch, endToLobby } from "./lifecycle";
import { stepMatch } from "./match-sim";
import { stepPlayers } from "./players";
import { damagePlayer, stepRevives } from "./revives";
import { createRuntime, type SimRuntime, seededRng } from "./runtime";
import { stepTurrets } from "./turrets";
import { chooseUpgrade } from "./upgrades";

const T0 = 1_000_000;
const TICK_MS = 1000 / 30;

const input = (patch: Partial<InputState>): InputState => ({
  ...EMPTY_INPUT,
  ...patch,
});

const makeState = (roles: Role[] = ["builder", "medic"]): RoomState => ({
  code: "TEST1",
  hostId: "p1",
  phase: "active",
  players: roles.map((role, index) => ({
    id: `p${index + 1}`,
    name: `Player${index + 1}`,
    position: { x: 0, y: 0 },
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
  lantern: null,
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
  paused: false,
});

const setup = (
  roles: Role[] = ["builder", "medic"],
): { state: RoomState; rt: SimRuntime } => {
  const state = makeState(roles);
  const rt = createRuntime(seededRng(42));
  beginMatch(state, rt, T0);
  return { state, rt };
};

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

describe("match lifecycle", () => {
  test("beginMatch arms the lantern and resets every player", () => {
    const { state } = setup();
    expect(state.phase).toBe("active");
    expect(state.lantern?.fuel).toBe(100);
    expect(state.players.every((player) => player.health === 100)).toBe(true);
    expect(state.players[0]?.position.x).toBeGreaterThan(0);
  });

  test("a full ten-minute match reaches dawn with the enemy cap enforced", () => {
    const { state, rt } = setup(["builder", "medic", "striker", "scout"]);
    // Invulnerable run so the clock is what decides the outcome.
    if (state.lantern) state.lantern.health = Number.MAX_SAFE_INTEGER;
    for (const player of state.players)
      player.invulnerableUntil = Number.MAX_SAFE_INTEGER;
    let peakEnemies = 0;
    let steps = 0;
    while (state.phase === "active" && steps < 20_000) {
      stepMatch(state, rt, T0 + steps * TICK_MS);
      peakEnemies = Math.max(peakEnemies, state.enemies.length);
      steps += 1;
    }
    expect(state.phase).toBe("won");
    expect(state.elapsedSeconds).toBeGreaterThanOrEqual(MATCH_DURATION_SECONDS);
    expect(peakEnemies).toBeLessThanOrEqual(MAX_ENEMIES_PER_ROOM);
    expect(steps).toBeGreaterThan(MATCH_DURATION_SECONDS * 30 - 60);
  });

  test("lantern fuel exhaustion loses the match", () => {
    const { state, rt } = setup();
    if (state.lantern) state.lantern.fuel = 0;
    stepMatch(state, rt, T0);
    expect(state.phase).toBe("lost");
    expect(state.winner).toBe("lost");
  });

  test("every connected player downed loses the match", () => {
    const { state, rt } = setup();
    for (const player of state.players)
      damagePlayer(state, rt, player, 999, T0 + 5000);
    expect(state.players.every((player) => player.downed)).toBe(true);
    stepMatch(state, rt, T0 + 5000);
    expect(state.phase).toBe("lost");
  });

  test("returning to the hub clears the run and restores players", () => {
    const { state, rt } = setup();
    state.enemies.push(makeEnemy({ position: { x: 10, y: 10 } }));
    endToLobby(state, rt, T0);
    expect(state.phase).toBe("lobby");
    expect(state.lantern).toBeNull();
    expect(state.enemies).toHaveLength(0);
    expect(state.players[0]?.position.y).toBeGreaterThan(HUB_CIRCLE.y - 200);
  });
});

describe("combat", () => {
  test("shots kill enemies, credit kills, and drop fuel shards", () => {
    const { state, rt } = setup();
    const player = state.players[0]!;
    player.position = { x: 500, y: 500 };
    player.aim = { x: 1, y: 0 };
    state.enemies.push(makeEnemy({ position: { x: 600, y: 500 } }));
    rt.inputs.set(player.id, input({ shooting: true }));
    let now = T0 + 3000;
    for (let index = 0; index < 10 && state.enemies.length > 0; index++) {
      stepPlayers(state, rt, now);
      processDeaths(state, rt);
      now += 300;
    }
    expect(state.enemies).toHaveLength(0);
    expect(player.kills).toBe(1);
    expect(state.teamXp).toBeGreaterThan(0);
    expect(state.shards.length).toBe(1);
  });

  test("enemies attack players within reach", () => {
    const { state, rt } = setup();
    const player = state.players[0]!;
    state.enemies.push(
      makeEnemy({
        position: { x: player.position.x + 10, y: player.position.y },
      }),
    );
    stepEnemies(state, rt, T0 + 5000);
    expect(player.health).toBeLessThan(100);
  });

  test("walls block enemies and absorb their attacks", () => {
    const { state, rt } = setup();
    const player = state.players[0]!;
    player.position = {
      x: LANTERN_POSITION.x + 300,
      y: LANTERN_POSITION.y + 50,
    };
    const wall = placeAt(
      state,
      rt,
      player,
      "wall",
      { x: LANTERN_POSITION.x + 300, y: LANTERN_POSITION.y },
      T0 + 3000,
    );
    expect(wall).toBe(true);
    const construct = state.constructs[0];
    if (!construct) throw new Error("wall not placed");
    state.enemies.push(
      makeEnemy({
        position: { x: construct.position.x + 30, y: construct.position.y },
      }),
    );
    stepEnemies(state, rt, T0 + 4000);
    expect(construct.health).toBeLessThan(construct.maxHealth);
  });

  test("turrets acquire and damage enemies in range", () => {
    const { state, rt } = setup();
    const player = state.players[0]!;
    player.position = { x: LANTERN_POSITION.x + 400, y: LANTERN_POSITION.y };
    const placed = placeAt(
      state,
      rt,
      player,
      "turret",
      { x: LANTERN_POSITION.x + 460, y: LANTERN_POSITION.y },
      T0 + 3000,
    );
    expect(placed).toBe(true);
    const turret = state.constructs[0];
    if (!turret) throw new Error("turret not placed");
    turret.fireAt = T0;
    state.enemies.push(
      makeEnemy({
        position: {
          x: turret.position.x + TURRET_RANGE - 20,
          y: turret.position.y,
        },
      }),
    );
    stepTurrets(state, rt, T0 + 4000);
    expect(state.enemies[0]?.health).toBeLessThan(
      ENEMIES_TABLE.swarmer.maxHealth,
    );
  });

  test("placement enforces range, cooldown, and energy", () => {
    const { state, rt } = setup();
    const player = state.players[0]!;
    player.position = { x: LANTERN_POSITION.x + 500, y: LANTERN_POSITION.y };
    player.energy = 0;
    expect(
      placeAt(
        state,
        rt,
        player,
        "wall",
        { x: player.position.x + 40, y: player.position.y },
        T0 + 3000,
      ),
    ).toBe(false);
    player.energy = 100;
    expect(
      placeAt(state, rt, player, "wall", { x: 10, y: 10 }, T0 + 3000),
    ).toBe(false);
    expect(
      placeAt(
        state,
        rt,
        player,
        "wall",
        { x: player.position.x + 40, y: player.position.y },
        T0 + 3000,
      ),
    ).toBe(true);
    expect(
      placeAt(
        state,
        rt,
        player,
        "wall",
        { x: player.position.x + 90, y: player.position.y },
        T0 + 3100,
      ),
    ).toBe(false);
  });
});

describe("revives and abilities", () => {
  test("a downed player is revived by a channeling teammate", () => {
    const { state, rt } = setup(["builder", "medic"]);
    const downed = state.players[0]!;
    const helper = state.players[1]!;
    damagePlayer(state, rt, downed, 999, T0 + 5000);
    expect(downed.downed).toBe(true);
    helper.position = { x: downed.position.x + 20, y: downed.position.y };
    rt.inputs.set(helper.id, input({ interact: true }));
    let now = T0 + 5000;
    for (let index = 0; index < 150 && downed.downed; index++) {
      stepRevives(state, rt, now);
      now += TICK_MS;
    }
    expect(downed.downed).toBe(false);
    expect(downed.health).toBeGreaterThan(0);
    expect(helper.revives).toBe(1);
  });

  test("idle posts cannot be damaged", () => {
    const { state, rt } = setup();
    const player = state.players[0]!;
    player.connected = false;
    damagePlayer(state, rt, player, 999, T0 + 5000);
    expect(player.health).toBe(100);
  });

  test("medic mend heals nearby allies", () => {
    const { state, rt } = setup(["medic", "striker"]);
    const medic = state.players[0]!;
    const ally = state.players[1]!;
    ally.health = 30;
    ally.position = { x: medic.position.x + 40, y: medic.position.y };
    castAbility(state, rt, medic, T0 + 3000);
    expect(ally.health).toBe(65);
    expect(medic.energy).toBeLessThan(100);
  });

  test("consecutive casts land while energy remains", () => {
    const { state, rt } = setup(["medic", "striker"]);
    const medic = state.players[0]!;
    const ally = state.players[1]!;
    ally.health = 1;
    ally.position = { x: medic.position.x + 40, y: medic.position.y };
    castAbility(state, rt, medic, T0 + 3000);
    const afterFirst = medic.energy;
    castAbility(state, rt, medic, T0 + 3100);
    expect(medic.energy).toBeLessThan(afterFirst);
    expect(ally.health).toBe(71);
  });

  test("striker flare damages every enemy in range", () => {
    const { state, rt } = setup(["striker", "medic"]);
    const striker = state.players[0]!;
    state.enemies.push(
      makeEnemy({
        position: { x: striker.position.x + 50, y: striker.position.y },
      }),
      makeEnemy({
        position: { x: striker.position.x - 50, y: striker.position.y },
      }),
    );
    castAbility(state, rt, striker, T0 + 3000);
    expect(state.enemies.every((enemy) => enemy.health < enemy.maxHealth)).toBe(
      true,
    );
  });

  test("builder bulwark raises a free wall at the aim point", () => {
    const { state, rt } = setup(["builder", "medic"]);
    const builder = state.players[0]!;
    builder.position = { x: LANTERN_POSITION.x + 400, y: LANTERN_POSITION.y };
    builder.aim = { x: -1, y: 0 };
    const before = state.constructs.length;
    castAbility(state, rt, builder, T0 + 3000);
    expect(state.constructs.length).toBe(before + 1);
    expect(state.constructs[0]?.kind).toBe("wall");
    expect(builder.energy).toBeLessThan(100);
  });

  test("scout glimmer pulls loose shards closer", () => {
    const { state, rt } = setup(["scout", "medic"]);
    const scout = state.players[0]!;
    state.shards.push({
      id: "shard-1",
      position: { x: scout.position.x + 300, y: scout.position.y },
      value: 8,
      carriedBy: null,
    });
    castAbility(state, rt, scout, T0 + 3000);
    const shard = state.shards[0];
    if (!shard) throw new Error("shard missing");
    expect(shard.position.x).toBeLessThan(scout.position.x + 300);
    expect(shard.position.x).toBeGreaterThan(scout.position.x);
  });
});

describe("upgrades", () => {
  test("illegal picks are rejected and legal picks apply once", () => {
    const { state, rt } = setup();
    state.upgradeChoices = [
      { id: "power", label: "Hot Shots", detail: "+25% shot damage" },
    ];
    expect(chooseUpgrade(state, rt, "haste")).toBe(false);
    expect(chooseUpgrade(state, rt, "power")).toBe(true);
    expect(rt.takenUpgrades.power).toBe(1);
    expect(state.upgradeChoices).toHaveLength(0);
  });

  test("kills bank XP until a level-up presents three choices", () => {
    const { state, rt } = setup();
    state.nextXpThreshold = 1;
    state.enemies.push(makeEnemy({ position: { x: 9000, y: 9000 } }));
    const spawned = state.enemies[0];
    if (!spawned) throw new Error("enemy missing");
    rt.enemyOwner.set(spawned.id, "p1");
    spawned.health = 0;
    processDeaths(state, rt);
    expect(state.teamLevel).toBe(2);
    expect(state.upgradeChoices).toHaveLength(3);
    expect(state.players[0]?.kills).toBe(1);
  });
});
