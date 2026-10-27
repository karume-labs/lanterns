# Lanterns product requirements

## Product

Lanterns is a private-room cooperative survival game for up to four players.
Players roam a pixel-art hub, select a color role, practice core actions, and
defend a central lantern through a ten-minute night.

## Core experience

- Create or join a room with a short code; show the code in the hub and UI.
- Support up to four players and recover a player who reconnects.
- Start from a roamable hub with role selection, tutorial dummy, ready circle,
  and host start interaction.
- Survive escalating enemies until dawn; lose if the lantern dies or every
  player is down.
- Use shooting, energy, constructs, color-role abilities, revives, fuel shards,
  and shared upgrades.
- Support keyboard/mouse and landscape touch controls through one input model.

## Core scope (first shippable version)

1. Room create/join by code, host designation, reconnect tokens, idle posts for
   dropped players, empty-room cleanup.
2. Hub: free movement and collision, color rack with one-of-each roles, practice
   dummy, ready circle, host-lit start, countdown that reacts safely to joins,
   leaves, and disconnects.
3. Authoritative fixed-tick match: movement, aiming, shooting, energy pool,
   walls and turrets, four enemy types driven by a wave table, downed state and
   revives, lantern fuel/light radius, fuel shards, shared XP with three-choice
   level-ups, four role abilities, win at dawn, loss on dark lantern or
   all players down, end screen with per-player stats.
4. Networking: validated client commands, compact snapshots at fixed cadence,
   client interpolation of remote entities, local-player reconciliation,
   reconnect mid-match as an idle post.
5. Client: React overlay (menu, lobby, HUD, level-up, pause/settings, how-to-play,
   end screen), Pixi world (integer-scaled low-res rendering, camera, tiles,
   sprites with names, lantern light, dawn shift, hit flashes, damage numbers,
   screen shake), desktop and touch input behind one `InputState`.
6. Audio: SFX and looping music starting only after a user gesture.
7. Observability: server metrics for rooms, players, tick time, snapshot size,
   rejects; bot harness for load and balance runs.

## Acceptance criteria (exit tests)

- `bun run check` (format, lint, typecheck, tests) passes on a clean checkout.
- Server and client both start locally; the client loads a canvas.
- Two browser sessions join the same room by code and see each other in the
  player list; a dropped session reclaims its player within the grace window.
- Two sessions walk around the hub and see each other move smoothly; the server
  sustains ~20 bots without crashing or exceeding its tick budget.
- Both players pick roles, step into the ready circle, and start a match; a
  disconnect mid-countdown neither strands nor silently starts the match.
- A full match can be won and lost; the end screen shows correct stats.
- Touch: dual joysticks, buttons, multi-touch, safe areas, portrait prompt,
  no page zoom/scroll/pull-to-refresh, audio starts on first tap; settings can
  override device detection.
- Every ability, construct, enemy type, revive, and upgrade works; a headless
  ten-minute match completes with both outcomes reachable.
- A first-time player can join and play using only the in-game how-to-play.
- Bad conditions (slow network, background tab, refresh mid-match, host
  leaving, single-player room) recover without a crash.

## Non-goals / explicitly deferred

Accounts, matchmaking, chat, persistent progression, spectator mode, best-time
leaderboard, the Keeper support role, and a final boss are out of scope until
the core exit criteria are met.

## Technical requirements

- Bun server with server-authoritative fixed-tick simulation and WebSockets.
- React overlay for menus and high-level UI; Pixi for the world and in-world UI.
- Mobile play prevents page zoom, scrolling, and pull-to-refresh during play.
- Production deployment uses Railway; test all touch behavior on physical
  devices rather than browser emulation alone.

## Success criteria

Two players on different devices can join a room, complete a match, reconnect
after a brief drop, and understand the game without a verbal walkthrough.
