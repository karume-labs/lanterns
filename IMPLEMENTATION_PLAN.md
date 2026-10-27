# Lanterns implementation plan

## Goal

Build a browser-based, four-player cooperative survival game. Players meet in a
roamable pixel-art hub, form a private room, choose a color role, and survive a
ten-minute night by defending a central lantern. The server is authoritative;
React owns screen-space UI and Pixi owns the world and in-world UI.

The first shippable version includes every item in the core scope below. The
stretch features remain deliberately out of the critical path.

## Technical direction

- **Runtime:** Bun workspaces managed by Turborepo.
- **Client:** Vite, React, TypeScript, PixiJS, and lightweight client stores.
- **Server:** Bun WebSocket server with a fixed-tick, server-authoritative
  simulation.
- **Shared package:** TypeScript domain types, constants, protocol messages,
  content tables, and deterministic rules shared by client and server.
- **Networking:** clients submit normalized `InputState` and discrete commands;
  the server validates them and sends snapshots/events. The client interpolates
  remote snapshots and never decides outcomes.
- **Deployment:** one container builds the client and serves it through the Bun
  server.

Use a single fixed palette, pixel-font assets, nearest-neighbor rendering, and
9-slice UI frames from the beginning so UI and world art do not drift apart.

## Delivery order

### 0. Establish the monorepo and engineering guardrails

Create the root workspace configuration and the directory layout described in
the product brief:

- Root `package.json`, `bun.lock`, `turbo.json`, `biome.json`, `lefthook.yml`,
  `Dockerfile`, `README.md`, and `AGENTS.md`.
- `packages/domain`, `apps/server`, `apps/client`, `docs`, and `tools`.
- Workspace scripts for development, type checking, unit tests, formatting,
  building, and protocol compatibility checks.
- A minimal client page and server health/static-file endpoint, wired through
  the Docker build.

Document key decisions before implementation:

1. `docs/ADR/001-SERVER-AUTHORITATIVE-NETCODE.md`: fixed tick, client command
   validation, snapshot cadence, reconnect identity, and anti-cheat boundary.
2. `docs/ADR/002-DOM-OVERLAY-PLUS-PIXI-WORLD.md`: React/Pixi ownership and the
   boundary between event-driven UI state and frame-driven render state.
3. `docs/PRD.md`: core scope, acceptance criteria, and the explicit stretch
   cut list.
4. `docs/PROTOCOL.md`: a human-readable version of all client/server messages
   and snapshot fields.

**Exit criteria:** a clean checkout can install, type-check, test, build both
apps, and load a page that connects to the server.

### 1. Define the shared domain contract

Implement `packages/domain` before gameplay code.

- Define entity and room state types: `Player`, `Enemy`, `Construct`,
  `Lantern`, `RoomState`, match phase, vectors, IDs, and end-of-run stats.
- Define the complete, versioned message vocabulary: create/join/rejoin room,
  input updates, color selection, ready/start, placement, revive/interact,
  level-up selection, pause/leave, snapshots, room events, errors, and ping.
- Define one device-agnostic `InputState` that has movement/aim axes plus
  shoot, construct selection/placement, role ability, and interaction intents.
- Centralize simulation constants: 10-minute duration, tick/snapshot rates,
  room and enemy caps, map bounds, cooldowns, fuel/energy limits, and revive
  timings.
- Create data tables for roles, enemies, waves, and upgrades. Keep balancing
  values declarative rather than spread across simulation modules.
- Unit-test pure rules: movement normalization, collision, damage, energy,
  upgrade eligibility, and content-table validation.

**Exit criteria:** both apps compile against the same types, protocol messages
are exhaustively handled, and pure game rules are covered by deterministic
tests.

### 2. Build rooms, connection lifecycle, and the lobby simulation

Implement room management and the roamable pre-game experience before the
full match.

- Generate short collision-resistant room codes; support creating and joining
  rooms, a maximum of four active players, host designation, and empty-room
  cleanup.
- Assign reconnect tokens after joining. On disconnect, retain the player for a
  defined grace period as an idle post; allow the token to reclaim that player.
- Add server-side lobby movement, collision, player names, role/color rack,
  practice dummy, wall placement/shooting tutorial behavior, and ready circle.
- Start countdown when all connected players are ready/in the circle, and let
  the host start through the lantern interaction. Cancel or adjust the
  countdown safely when a player joins, leaves, or disconnects.
- Send lifecycle events for joining, leaving, countdown, start, and errors so
  the client can communicate state clearly.

**Exit criteria:** up to four browser sessions can create/join by code, roam,
choose distinct roles, practice core actions, recover a dropped connection, and
reliably enter a match together.

### 3. Implement the authoritative match loop

Add `apps/server/src/sim` as a fixed-rate simulation with no browser concerns.

- Implement phase transitions: countdown, active night, won, and lost.
- Create the central lantern: fuel, light radius, fuel drain, incoming damage,
  and the win/lose checks (dawn, dead lantern, or all players down).
- Implement player movement, aiming, basic shots, health, downed state, revive
  window, nearby revive interaction, and energy recharge inside lantern range.
- Implement construct placement validation and lifetime: walls block enemy
  movement; turrets acquire and fire at targets. Enforce collision, cost,
  cooldown, and placement-range rules on the server.
- Implement the four roles and one role ability each:
  Builder (cheaper/sturdier constructs), Medic (healing pulse and faster
  revive), Striker (burst damage), and Scout (loot pull and speed).
- Implement enemy spawn, steering, collision, attacks, damage, deaths, and
  fuel-shard drops. Prioritize the lantern, then players when appropriate.
- Add swarmer, tank, ranged shooter, and fast chaser behavior; drive escalating
  spawns from the wave table and cap active enemies near 150.
- Implement fuel shard carry/deposit and shared team XP.
- Implement level-up pauses or choice windows, generate 2--3 legal options
  from 6--8 upgrades, resolve one team choice, and apply it in the simulation.
- Record kills, revives, and survival time for the result event.

**Exit criteria:** headless simulation tests can run a complete ten-minute
match, exercise every loss/win condition, enforce caps, and validate each role,
enemy, construct, revive, and upgrade path.

### 4. Implement networking snapshots and simulation observability

- Build per-socket routing and validate all messages by phase, player identity,
  room membership, rate limit, and payload shape.
- Send compact snapshots at a fixed cadence plus reliable semantic events for
  phase, level-up, end-of-run, room membership, and connection status.
- Maintain a short client snapshot buffer and interpolate remote state; render
  the local player responsively while reconciling to authoritative snapshots.
- Add server metrics/logging for room count, player count, tick duration,
  snapshot size, active-enemy count, reconnects, and rejected commands.
- Build `tools/check-protocol.ts` and fixture generators to prevent contract
  drift. Add `tools/bots.ts` to join rooms, move, shoot, reconnect, and sustain
  basic load tests.

**Exit criteria:** intentionally malformed or out-of-phase commands cannot
change match state; simulated network delay remains visually smooth; four bots
can complete repeated room/match runs without a server crash.

### 5. Create the Pixi game client

Build a `Game` owner that switches between hub and match scenes and contains no
React components.

- Load atlas, font, palette, and audio assets with clear fallback/error states.
- Render pixel-aligned tiles, entities, animations, camera tracking, and build
  previews using `image-rendering: pixelated` / nearest-neighbor settings.
- Render Pixi in-world UI: player names, health bars, damage numbers, lantern
  fuel, construction previews, and tutorial markers.
- Render the night-to-dawn progression and lantern light: a dark overlay with
  a lantern-centered cutout that changes with fuel.
- Add effects: hit flashes, screen shake, particles, and damage-number motion.
- Connect scene state to snapshots/events; keep render-frame values out of
  React state.

**Exit criteria:** the hub and match visibly mirror authoritative server state,
with readable pixel art, smooth remote motion, correct lighting, and no React
rerender tied to every simulation tick.

### 6. Add React UI and complete input parity

Implement the React overlay in small feature modules, backed by low-frequency
stores only.

- Menu: create room, join code validation, loading/errors, and reconnection.
- Lobby overlay: room code in a corner, player list/role selection state,
  ready/countdown notices, tutorial cues, and connection status.
- Match overlay: ref-driven fuel/energy/timer HUD, level-up cards, pause,
  settings, and connection status.
- End screen: result, survival time, kills, revives, retry/return actions.
- How-to-play/first-run guide with device-specific controls.
- Desktop input: WASD/arrows, pointer aiming, click-to-shoot, number/Q/E
  construct selection, Space ability, and F interaction.
- Mobile landscape input: independent left/right multi-touch joysticks,
  auto-fire while aiming, construct/ability buttons, and contextual revive.
- Merge both control schemes into the shared `InputState`; expose a persisted
  settings override when device detection is wrong.
- Disable in-play page zoom, scrolling, and pull-to-refresh; add safe-area
  padding and a portrait rotate prompt. Start audio only after the first user
  gesture.

**Exit criteria:** keyboard/mouse and touch emit equivalent intents, movement
and shooting can occur simultaneously on a real phone, and all menus are usable
without obscuring the critical play area.

### 7. Balance, polish, deploy, and validate

- Tune content tables using repeatable bot runs and four-human playtests. Focus
  on lantern fuel economy, role usefulness, wave pressure, enemy cap behavior,
  and revive fairness.
- Add SFX and looping chiptune music, volume controls, and audio-unlock
  messaging.
- Test reconnects during lobby, countdown, active match, level-up, and end
  screen; confirm disconnected players remain safely idle.
- Test Chrome/Safari/Firefox desktop and real iOS/Android devices in landscape,
  including multi-touch, browser chrome/safe areas, orientation, and audio.
- Build the Docker image, test production static-file and WebSocket behavior,
  then deploy to the selected host (Fly, Railway, or Render) with runtime
  configuration documented in the README.

**Exit criteria:** a production build supports a four-player external playtest
from create-room through end screen, with reconnect handling and no high-severity
gameplay, control, or networking failures.

## Suggested implementation slices

Keep pull requests small and independently testable:

1. Workspace, tooling, app skeleton, and CI checks.
2. Domain types, input contract, content tables, and protocol tests.
3. WebSocket connection, room creation/joining, and reconnect tokens.
4. Lobby simulation plus minimal hub renderer/UI.
5. Player/lantern/combat simulation and match transition.
6. Enemies, waves, fuel shards, and win/loss/results.
7. Constructs, roles, revives, XP, and upgrades.
8. Snapshot interpolation and full Pixi rendering/lighting.
9. Desktop UI/input and mobile multi-touch controls.
10. Audio, effects, bot/load testing, balancing, deployment, and real-device QA.

## Risks and decisions to settle early

- **Simulation feel vs. responsiveness:** decide whether to add client-side
  prediction for the local player after basic interpolation. Start without
  prediction unless playtesting shows latency is unacceptable.
- **Level-up flow:** a shared XP system needs a clear policy: either a brief
  team-wide choice pause or a deterministic host/team vote. Specify this in the
  protocol before UI work.
- **Disconnected-player behavior:** define exactly whether an idle post can be
  damaged, revived, and count toward the all-downed loss condition; make that
  choice visible to teammates.
- **Role selection:** decide whether duplicate colors/roles are permitted. The
  default recommendation is one of each color role per four-player room.
- **Asset licensing:** do not ship placeholder art/audio without recording its
  source/license in `apps/client/public/CREDITS.md`.
- **Mobile QA:** browser emulation is insufficient for multi-touch, safe areas,
  audio unlock, and pull-to-refresh; schedule real-device checks as a release
  gate rather than a final polish task.

## Explicitly deferred

Do not begin these until the core exit criteria are met:

- Keeper support role.
- Final boss near dawn.
- Spectator mode.
- Best-time leaderboard.
- Accounts, matchmaking, chat, and persistent progression.
