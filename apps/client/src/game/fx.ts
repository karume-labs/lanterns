import { LANTERN_POSITION, type SnapshotEvent } from "@lanterns/domain";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Camera } from "./camera";
import { COLORS } from "./config";
import { frameRefs } from "./frame-refs";
import {
  FLOAT_LIFE_SECONDS,
  type Floater,
  RING_LIFE_SECONDS,
  type Ring,
  renderFx,
} from "./fx-render";
import { fxSounds } from "./fx-sounds";

const styleCache = new Map<number, TextStyle>();

const styleFor = (color: number): TextStyle => {
  let style = styleCache.get(color);
  if (!style) {
    style = new TextStyle({
      fill: color,
      fontFamily: "monospace",
      fontSize: 9,
      fontWeight: "bold",
    });
    styleCache.set(color, style);
  }
  return style;
};

/**
 * Damage numbers and impact rings fed by the snapshot's one-shot event
 * buffer. Pooled text nodes; no per-frame allocation.
 */
export class FxTracker {
  readonly container = new Container();
  readonly #rings = new Graphics();
  #ringRows: Ring[] = [];
  #floaters: Floater[] = [];
  #free: Text[] = [];

  constructor() {
    this.container.addChild(this.#rings);
  }

  clear(): void {
    for (const floater of this.#floaters) this.#retire(floater);
    this.#floaters = [];
    this.#ringRows = [];
    this.#rings.clear();
  }

  render(camera: Camera): void {
    renderFx(this.#rings, this.#ringRows, this.#floaters, camera);
  }

  ingest(events: readonly SnapshotEvent[]): void {
    fxSounds(events);
    for (const event of events) {
      if (event.k === "hit") {
        if (frameRefs.damageNumbers)
          this.#spawnNumber(`-${event.n}`, event.x, event.y, 0xffffff);
        this.#ringRows.push({
          x: event.x,
          y: event.y,
          life: RING_LIFE_SECONDS * 0.7,
          color: 0xffffff,
        });
      } else if (event.k === "die") {
        if (frameRefs.damageNumbers)
          this.#spawnNumber("KO", event.x, event.y, 0xef8354);
        this.#ringRows.push({
          x: event.x,
          y: event.y,
          life: RING_LIFE_SECONDS,
          color: 0xef8354,
        });
      } else if (event.k === "flare") {
        this.#ringRows.push({
          x: LANTERN_POSITION.x,
          y: LANTERN_POSITION.y,
          life: 0.7,
          color: COLORS.lantern,
          max: 420,
        });
      } else if (event.k === "fuel" && frameRefs.damageNumbers) {
        this.#spawnNumber(
          `+${event.n}`,
          LANTERN_POSITION.x,
          LANTERN_POSITION.y,
          0x7be36b,
        );
      }
    }
  }

  update(dt: number): void {
    for (let index = this.#floaters.length - 1; index >= 0; index--) {
      const floater = this.#floaters[index];
      floater.life -= dt;
      floater.rise += dt * 26;
      if (floater.life <= 0) {
        this.#retire(floater);
        this.#floaters.splice(index, 1);
      }
    }
    for (let index = this.#ringRows.length - 1; index >= 0; index--) {
      const ring = this.#ringRows[index];
      ring.life -= dt;
      if (ring.life <= 0) this.#ringRows.splice(index, 1);
    }
  }

  #spawnNumber(text: string, x: number, y: number, color: number): void {
    const label =
      this.#free.pop() ?? new Text({ text: "", style: styleFor(color) });
    label.visible = true;
    label.alpha = 1;
    label.text = text;
    label.style = styleFor(color);
    label.anchor.set(0.5, 0.5);
    this.container.addChild(label);
    this.#floaters.push({
      text: label,
      x,
      y,
      life: FLOAT_LIFE_SECONDS,
      rise: 0,
    });
  }

  #retire(floater: Floater): void {
    floater.text.visible = false;
    this.#free.push(floater.text);
  }
}
