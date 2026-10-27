import type { Vector2 } from "@lanterns/domain";
import { currentInput } from "../input/current-input";
import { RECONCILE_BLEND, RECONCILE_SNAP } from "./config";

/**
 * The local player renders immediately from input instead of waiting for the
 * interpolation window, then blends back toward each authoritative snapshot.
 */
export class LocalPlayer {
  x = 0;
  y = 0;
  aimDeg = 0;
  #lastAuthTick = -1;

  reset(position: Vector2, aimDeg: number): void {
    this.x = position.x;
    this.y = position.y;
    this.aimDeg = aimDeg;
    this.#lastAuthTick = -1;
  }

  get position(): Vector2 {
    return { x: this.x, y: this.y };
  }

  get hasAuth(): boolean {
    return this.#lastAuthTick >= 0;
  }

  /** Forget the last authoritative reference (phase or room change). */
  invalidate(): void {
    this.#lastAuthTick = -1;
  }

  /** Advance one render frame using the live input contract. */
  advance(dt: number, speed: number): void {
    const input = currentInput.value;
    this.x += input.moveX * speed * dt;
    this.y += input.moveY * speed * dt;
    this.aimDeg = (Math.atan2(input.aimY, input.aimX) * 180) / Math.PI;
  }

  /** Blend toward the authoritative row for this player index. */
  reconcile(auth: Vector2, tick: number): void {
    if (tick <= this.#lastAuthTick) return;
    this.#lastAuthTick = tick;
    const dx = auth.x - this.x;
    const dy = auth.y - this.y;
    const error = Math.hypot(dx, dy);
    if (error > RECONCILE_SNAP) {
      this.x = auth.x;
      this.y = auth.y;
      return;
    }
    this.x += dx * RECONCILE_BLEND;
    this.y += dy * RECONCILE_BLEND;
  }
}
