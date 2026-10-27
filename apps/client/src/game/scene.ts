import {
  type Bounds,
  HUB_PLAYER_SPEED,
  HUB_SIZE,
  MAP_SIZE,
  PLAYER_FLAG,
  PLAYER_SPEED,
  ROLES_TABLE,
  type RoomState,
  type Snapshot,
} from "@lanterns/domain";
import type { Container } from "pixi.js";
import { Camera } from "./camera";
import { Interpolator } from "./interpolator";
import { LocalPlayer } from "./local-player";
import { Painter } from "./painter";

export interface FrameView {
  room: RoomState | null;
  snap: Snapshot | null;
  playerId: string | null;
}

const HUB_BOUNDS = { width: HUB_SIZE.width, height: HUB_SIZE.height };

/** Owns everything rendered per frame; no React state lives here. */
export class Scene {
  readonly #camera = new Camera();
  readonly #local = new LocalPlayer();
  readonly #interp = new Interpolator();
  readonly #painter: Painter;
  #lastSnapT = -1;
  #lastRoomKey = "";

  constructor(stage: Container) {
    this.#painter = new Painter(stage);
  }

  update(dt: number, view: FrameView): void {
    const { room, snap, playerId } = view;
    if (!room) {
      this.#painter.clear();
      return;
    }
    const roomKey = `${room.code}:${room.players.length}:${room.phase}`;
    if (roomKey !== this.#lastRoomKey) {
      this.#lastRoomKey = roomKey;
      this.#interp.clear();
      this.#lastSnapT = -1;
      this.#local.invalidate();
    }
    if (snap && snap.t !== this.#lastSnapT) {
      this.#lastSnapT = snap.t;
      this.#interp.push(snap);
      this.#reconcile(room, snap, playerId);
    }

    const hub = room.phase === "lobby" || room.phase === "countdown";
    const bounds: Bounds = hub ? HUB_BOUNDS : MAP_SIZE;
    const myIndex = playerId
      ? room.players.findIndex((player) => player.id === playerId)
      : -1;
    const me = myIndex >= 0 ? room.players[myIndex] : undefined;
    const flags = myIndex >= 0 ? (snap?.pl[myIndex]?.[5] ?? 0) : 0;
    const moving =
      this.#lastSnapT > 0 &&
      !!me?.connected &&
      (flags & PLAYER_FLAG.downed) === 0;
    if (moving) {
      const roleSpeed = me?.role ? ROLES_TABLE[me.role].mods.speed : 1;
      const speed = hub ? HUB_PLAYER_SPEED : PLAYER_SPEED * roleSpeed;
      this.#local.advance(dt, speed);
    }
    const target = moving
      ? this.#local.position
      : { x: bounds.width / 2, y: bounds.height / 2 };
    this.#camera.update(target, bounds, dt);

    this.#painter.draw({
      room,
      sample: this.#interp.sample(this.#interp.latestTick),
      camera: this.#camera,
      local: this.#local,
      myIndex,
      moving,
      bounds,
      hub,
    });
  }

  #reconcile(room: RoomState, snap: Snapshot, playerId: string | null): void {
    if (!playerId) return;
    const index = room.players.findIndex((player) => player.id === playerId);
    const row = index >= 0 ? snap.pl[index] : undefined;
    if (!row) return;
    const auth = { x: row[0], y: row[1] };
    if (!this.#local.hasAuth) {
      this.#local.reset(auth, row[2] ?? 0);
      this.#camera.snapTo(auth);
      return;
    }
    this.#local.reconcile(auth, snap.t);
  }
}
