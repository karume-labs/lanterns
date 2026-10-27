import type { Graphics, Text } from "pixi.js";
import type { Camera } from "./camera";

export const FLOAT_LIFE_SECONDS = 0.75;
export const RING_LIFE_SECONDS = 0.35;
export const RING_MAX_RADIUS = 16;

export interface Ring {
  x: number;
  y: number;
  life: number;
  color: number;
  max?: number;
}

export interface Floater {
  text: Text;
  x: number;
  y: number;
  life: number;
  rise: number;
}

/** Draw pooled damage numbers and impact rings in screen space. */
export const renderFx = (
  ringsG: Graphics,
  ringRows: Ring[],
  floaters: Floater[],
  camera: Camera,
): void => {
  for (const floater of floaters) {
    const screen = camera.worldToScreen(floater.x, floater.y);
    floater.text.position.set(
      Math.round(screen.x),
      Math.round(screen.y - floater.rise),
    );
    floater.text.alpha = Math.min(1, (floater.life / FLOAT_LIFE_SECONDS) * 2);
  }
  const rings = ringsG.clear();
  for (const ring of ringRows) {
    const total = ring.max ? 0.7 : RING_LIFE_SECONDS;
    const progress = 1 - ring.life / total;
    const screen = camera.worldToScreen(ring.x, ring.y);
    rings
      .circle(screen.x, screen.y, 4 + progress * (ring.max ?? RING_MAX_RADIUS))
      .stroke({
        width: 2,
        color: ring.color,
        alpha: Math.max(0, ring.life / total),
      });
  }
};
