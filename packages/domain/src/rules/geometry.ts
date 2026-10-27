import type { Bounds, Vector2 } from "../types";

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

export const distance = (a: Vector2, b: Vector2): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const distanceSq = (a: Vector2, b: Vector2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

/** Angle in degrees from `from` toward `to`. */
export const angleDeg = (from: Vector2, to: Vector2): number =>
  (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

/** Round to 1 decimal so snapshots stay small without visible jitter. */
export const round1 = (value: number): number => Math.round(value * 10) / 10;

export const round0 = (value: number): number => Math.round(value);

/** Clamp a point so a circle of `radius` stays inside the bounds. */
export const clampToBounds = (
  position: Vector2,
  radius: number,
  bounds: Bounds,
): Vector2 => ({
  x: clamp(position.x, radius, bounds.width - radius),
  y: clamp(position.y, radius, bounds.height - radius),
});
