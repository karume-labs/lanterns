# Lanterns protocol

The client connects to `/ws` and exchanges JSON text frames over WebSocket.
Messages use a discriminating `type` field. Client messages describe intent;
the server validates every message against player identity, room membership,
match phase, payload shape, and a per-socket rate limit before applying it.

The TypeScript definitions in `packages/domain/src/protocol` are the source of
truth; `tools/check-protocol.ts` fails when this document and those definitions
drift apart.

## Client messages

| Type              | Purpose                                                | Phase        |
| ----------------- | ------------------------------------------------------ | ------------ |
| `create-room`     | Create a private room and join as host.                | any          |
| `join-room`       | Join a room by its 5-character code.                   | any          |
| `rejoin-room`     | Reclaim a disconnected player using a reconnect token. | any          |
| `leave-room`      | Leave the current room voluntarily.                    | any          |
| `input`           | Submit normalized movement, aim, and action intents.   | lobby/active |
| `select-role`     | Claim a color role at the rack (one of each per room). | lobby        |
| `start-match`     | Host ignites the lantern to begin the countdown.       | lobby        |
| `return-lobby`    | After a match, return the room to the hub.             | won/lost     |
| `place-construct` | Request a wall/turret at an explicit position.         | lobby/active |
| `choose-upgrade`  | Select one presented level-up option for the team.     | active       |
| `pause-match`     | Open/close the in-match menu; freezes the whole room.  | active       |
| `ping`            | Measure round-trip latency.                            | any          |

Notes:

- `input` carries a normalized `InputState`: `moveX/moveY` in `[-1, 1]`,
  `aimX/aimY` as a unit direction, `shooting`, `selectedConstruct`,
  `placeConstruct`, `useRoleAbility`, `interact`. `placeConstruct` and
  `useRoleAbility` are edge intents latched server-side for one tick; `shooting`
  and `interact` are held states (holding `interact` next to a downed ally
  channels the revive).
- Readiness is physical: a player is ready when they have claimed a role and
  are standing inside the hub's ready circle. The server derives it each tick;
  there is no ready message.
- Construction placement during a match is driven by `input.placeConstruct`
  at the aim point (or `place-construct` for an explicit position); the server
  re-validates range, cost, cooldown, and overlap.
- Messages received in the wrong phase are rejected with an `error` and never
  mutate state.
- `pause-match` with `paused: true` freezes the whole room (clock, enemies,
  spawning, movement) while at least one player holds the menu open; the room
  resumes when the last requester closes it, leaves, or disconnects. Inputs
  and placements are dropped while paused, and the server's sim clock skips
  the frozen span entirely so no timer advances across a pause.

## Server messages

| Type          | Purpose                                                  | Reliability |
| ------------- | -------------------------------------------------------- | ----------- |
| `welcome`     | Supplies `playerId`, `reconnectToken`, `roomCode`.       | per-request |
| `room-state`  | Complete authoritative room/lobby state (full JSON).     | on change   |
| `snapshot`    | Compact authoritative match snapshot (see below).        | 15 Hz       |
| `room-event`  | Membership/countdown/phase announcements (see below).    | reliable    |
| `level-up`    | Presents 2–3 legal upgrade choices to the whole team.    | reliable    |
| `match-ended` | Outcome plus per-player and team statistics.             | reliable    |
| `notice`      | Non-fatal informational messages (reconnect, grace).     | best-effort |
| `pong`        | Replies to `ping` with the echoed client timestamp.      | per-request |
| `error`       | Rejected request: stable `code` plus player-facing text. | reliable    |

### `room-state`

A full `RoomState`: code, host, phase (`lobby | countdown | active | won |
lost`), countdown deadline, players (position, aim, health, energy, role,
ready, connected, downed, kills, revives), lantern, enemies, constructs, shards,
elapsed seconds, team XP/level, and current upgrade choices. Sent on every
lobby mutation and on reconnect; during `active` the compact `snapshot`
supersedes it for entity data.

### `snapshot` (15 Hz, compact)

```jsonc
{
  "type": "snapshot",
  "t": 4821,            // server tick index (30 ticks/s)
  "ms": 1234,           // server clock, for latency display only
  "ph": "active",       // match phase
  "el": 102.4,          // elapsed match seconds
  "pl": [[x, y, aimDeg, hp, energy, flags], ...],  // index-aligned with room players
  "en": [[x, y, kindIdx, hp], ...],               // kindIdx indexes ENEMY_KINDS
  "cs": [[x, y, kindIdx, hp, ownerIdx], ...],     // construct kindIdx indexes CONSTRUCT_KINDS
  "sh": [[x, y], ...],                            // fuel shards on the ground
  "ln": [x, y, fuel, hp, radius],                 // lantern, null in lobby
  "dm": 240,                                     // practice dummy hp, null in a match
  "ev": [ /* one-shot events since previous snapshot, see below */ ]
}
```

- Player `flags` is a bitfield: bit 0 downed, bit 1 disconnected (idle post),
  bit 2 invulnerable (spawn/revive protection).
- Snapshot arrays are index-aligned with `room.players`; membership changes are
  only broadcast through `room-state`, never mid-snapshot, so indices stay
  stable between `room-state` messages.
- Positions are rounded to 0.1 world units to keep frames small; the server
  logs snapshot byte size per room.

### Snapshot events (`ev`)

One-shot semantic events ride along on the snapshot so effects stay in sync:

```ts
type SnapshotEvent =
  | { k: "hit"; x: number; y: number; n: number } // damage number + hit flash
  | { k: "die"; x: number; y: number } // enemy death burst
  | { k: "shot"; x: number; y: number; dx: number; dy: number; s: number } // muzzle flash
  | { k: "down"; p: number } // player index downed
  | { k: "revived"; p: number } // player index revived
  | { k: "placed"; c: number } // construct index created
  | { k: "fuel"; n: number } // shard deposited (+fuel)
  | { k: "shake"; n: number }; // screen shake magnitude
```

### `room-event`

```ts
type RoomEvent =
  | "player-joined"
  | "player-left"
  | "player-reconnected"
  | "countdown-started"
  | "countdown-cancelled"
  | "match-started"
  | "host-changed"
  | "game-paused"
  | "game-resumed";
```

## Timing model

- Server tick: 30 Hz fixed step; snapshot: 15 Hz.
- The client buffers snapshots and renders remote entities ~100 ms in the past,
  interpolating between the two surrounding snapshots.
- The local player renders immediately from local input and reconciles toward
  the authoritative position, snapping when the error exceeds 64 px.
- `ping`/`pong` provides RTT for the connection indicator only; simulation time
  never comes from the client.

## Errors

Stable codes: `invalid-message`, `invalid-name`, `invalid-code`, `room-not-found`,
`room-full`, `match-in-progress`, `role-taken`, `wrong-phase`, `host-only`,
`not-in-room`, `player-not-found`, `rejoin-failed`, `rate-limited`,
`unsupported-message`, `server-error`. Messages never expose internals.

## Compatibility rules

- Adding an optional field to an existing message is backwards compatible.
- Renaming or removing a field/type requires bumping `PROTOCOL_VERSION` in
  `packages/domain` and updating this document in the same change.
- Clients must ignore unknown message types and unknown event kinds.
