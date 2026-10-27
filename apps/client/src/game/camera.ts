import type { Bounds, Vector2 } from "@lanterns/domain";
import { VIEW_WORLD, WORLD_SCALE } from "./config";

const FOLLOW_RATE = 10;

/**
 * Camera centered on a target in world units. The rendered scroll position is
 * rounded to whole pixels so tiles never shimmer during movement.
 */
export class Camera {
  x = 0;
  y = 0;
  #shake = 0;

  snapTo(target: Vector2): void {
    this.x = target.x;
    this.y = target.y;
  }

  /** Kick the camera by a decaying random offset for impact feedback. */
  addShake(magnitude: number): void {
    this.#shake = Math.min(16, this.#shake + magnitude);
  }

  update(target: Vector2, bounds: Bounds, dt: number): void {
    const blend = Math.min(1, FOLLOW_RATE * dt);
    this.x += (target.x - this.x) * blend;
    this.y += (target.y - this.y) * blend;
    const halfW = VIEW_WORLD.width / 2;
    const halfH = VIEW_WORLD.height / 2;
    this.x = Math.max(halfW, Math.min(bounds.width - halfW, this.x));
    this.y = Math.max(halfH, Math.min(bounds.height - halfH, this.y));
    this.#shake = Math.max(0, this.#shake - 26 * dt);
  }

  /** World-unit offset that keeps the camera center at the viewport middle. */
  scroll(): Vector2 {
    const px = Math.round((this.x - VIEW_WORLD.width / 2) * WORLD_SCALE);
    const py = Math.round((this.y - VIEW_WORLD.height / 2) * WORLD_SCALE);
    const jitter = (value: number): number =>
      this.#shake > 0.3 ? Math.round((Math.random() * 2 - 1) * value) : 0;
    return { x: -px + jitter(this.#shake), y: -py + jitter(this.#shake) };
  }

  /** Project a world position into screen pixels (same rounding as the world layer). */
  worldToScreen(x: number, y: number): Vector2 {
    const scroll = this.scroll();
    return {
      x: x * WORLD_SCALE + scroll.x,
      y: y * WORLD_SCALE + scroll.y,
    };
  }
}
