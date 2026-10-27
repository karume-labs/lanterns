import type { SnapshotEvent } from "@lanterns/domain";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Camera } from "./camera";

const FLOAT_LIFE_SECONDS = 0.75;
const RING_LIFE_SECONDS = 0.35;
const RING_MAX_RADIUS = 16;

interface Ring {
  x: number;
  y: number;
  life: number;
  color: number;
}

interface Floater {
  text: Text;
  x: number;
  y: number;
  life: number;
  rise: number;
}

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

  ingest(events: readonly SnapshotEvent[]): void {
    for (const event of events) {
      if (event.k === "hit") {
        this.#spawnNumber(`-${event.n}`, event.x, event.y, 0xffffff);
        this.#ringRows.push({
          x: event.x,
          y: event.y,
          life: RING_LIFE_SECONDS * 0.7,
          color: 0xffffff,
        });
      } else if (event.k === "die") {
        this.#spawnNumber("KO", event.x, event.y, 0xef8354);
        this.#ringRows.push({
          x: event.x,
          y: event.y,
          life: RING_LIFE_SECONDS,
          color: 0xef8354,
        });
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

  render(camera: Camera): void {
    for (const floater of this.#floaters) {
      const screen = camera.worldToScreen(floater.x, floater.y);
      floater.text.position.set(
        Math.round(screen.x),
        Math.round(screen.y - floater.rise),
      );
      floater.text.alpha = Math.min(1, (floater.life / FLOAT_LIFE_SECONDS) * 2);
    }
    const rings = this.#rings.clear();
    for (const ring of this.#ringRows) {
      const progress = 1 - ring.life / RING_LIFE_SECONDS;
      const screen = camera.worldToScreen(ring.x, ring.y);
      rings.circle(screen.x, screen.y, 4 + progress * RING_MAX_RADIUS).stroke({
        width: 2,
        color: ring.color,
        alpha: ring.life / RING_LIFE_SECONDS,
      });
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
