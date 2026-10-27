import {
  type Bounds,
  HUB_DUMMY_HEALTH,
  HUB_LANTERN,
  HUB_LIGHT_RADIUS,
  type RoomState,
} from "@lanterns/domain";
import { Container, Graphics } from "pixi.js";
import { drawDummy, drawPlayer, roleColor } from "./actors";
import type { Camera } from "./camera";
import { COLORS, VIEW_H, VIEW_W, VIEW_WORLD, WORLD_SCALE } from "./config";
import {
  drawConstructs,
  drawEnemies,
  drawLantern,
  drawShards,
  drawTiles,
  skyColor,
} from "./draw";
import { drawPlayerNames } from "./draw-labels";
import type { SampledState } from "./interpolator";
import { lerpRows } from "./interpolator";
import { LabelLayer } from "./labels";
import type { LocalPlayer } from "./local-player";

const lerpLn = (
  a: number[] | null,
  b: number[] | null,
  alpha: number,
): number[] | null => {
  if (!a && !b) return null;
  if (!a) return b ? [...b] : null;
  if (!b) return [...a];
  return a.map((value, index) => value + ((b[index] ?? value) - value) * alpha);
};

export interface PainterFrame {
  room: RoomState;
  sample: SampledState | null;
  camera: Camera;
  local: LocalPlayer;
  myIndex: number;
  moving: boolean;
  bounds: Bounds;
  hub: boolean;
}

/** Owns every Graphics/Text object; Scene decides what goes in each frame. */
export class Painter {
  readonly #world = new Container();
  readonly #bg = new Graphics();
  readonly #paint = new Graphics();
  readonly #overlay = new Graphics();
  readonly #labels = new LabelLayer();

  constructor(stage: Container) {
    this.#world.scale.set(WORLD_SCALE);
    this.#world.addChild(this.#paint);
    stage.addChild(
      this.#bg,
      this.#world,
      this.#overlay,
      this.#labels.container,
    );
  }

  clear(): void {
    this.#bg.clear().rect(0, 0, VIEW_W, VIEW_H).fill(COLORS.night);
    this.#paint.clear();
    this.#overlay.clear();
    this.#labels.begin();
    this.#labels.end();
  }

  draw(frame: PainterFrame): void {
    const { room, sample, camera, bounds, hub } = frame;
    const active = room.phase === "active";
    this.#bg
      .clear()
      .rect(0, 0, VIEW_W, VIEW_H)
      .fill(skyColor(room.elapsedSeconds, active));

    const topLeft = {
      x: camera.x - VIEW_WORLD.width / 2,
      y: camera.y - VIEW_WORLD.height / 2,
    };
    const paint = this.#paint.clear();
    drawTiles(paint, bounds, topLeft, VIEW_WORLD.width, VIEW_WORLD.height);

    const ln = sample ? lerpLn(sample.a.ln, sample.b.ln, sample.alpha) : null;
    if (hub) drawLantern(paint, HUB_LANTERN, 1, HUB_LIGHT_RADIUS);
    else if (ln) drawLantern(paint, { x: ln[0], y: ln[1] }, ln[2] / 100, ln[4]);

    const dummyHp = sample ? (sample.b.dm ?? sample.a.dm) : null;
    if (hub && dummyHp !== null) drawDummy(paint, dummyHp / HUB_DUMMY_HEALTH);

    if (sample) {
      drawConstructs(paint, lerpRows(sample.a.cs, sample.b.cs, sample.alpha));
      drawShards(paint, lerpRows(sample.a.sh, sample.b.sh, sample.alpha));
      drawEnemies(paint, lerpRows(sample.a.en, sample.b.en, sample.alpha));
      this.#drawPlayers(frame, paint);
    }

    const scroll = camera.scroll();
    this.#world.position.set(scroll.x, scroll.y);
    this.#overlay
      .clear()
      .rect(0, 0, VIEW_W, VIEW_H)
      .fill({ color: 0x000000, alpha: active ? 0.3 : 0 });
    drawPlayerNames(this.#labels, frame);
  }

  #drawPlayers(frame: PainterFrame, paint: Graphics): void {
    const { room, sample, local, myIndex, moving } = frame;
    if (!sample) return;
    const rows = lerpRows(sample.a.pl, sample.b.pl, sample.alpha);
    room.players.forEach((player, index) => {
      const row = rows[index];
      if (!row) return;
      const localRow = index === myIndex && moving;
      const x = localRow ? local.x : (row[0] ?? player.position.x);
      const y = localRow ? local.y : (row[1] ?? player.position.y);
      const aim = localRow ? local.aimDeg : (row[2] ?? 0);
      drawPlayer(
        paint,
        x,
        y,
        aim,
        roleColor(player.role),
        Math.round(row[5] ?? 0),
      );
    });
  }
}
