import type { Bounds, Vector2 } from "../types";
import { clampToBounds, distance } from "./geometry";

export interface Circle {
  position: Vector2;
  radius: number;
}

export const circlesOverlap = (a: Circle, b: Circle): boolean => {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const radii = a.radius + b.radius;
  return dx * dx + dy * dy < radii * radii;
};

/**
 * Move `position` out of any overlapping static circle. Resolution is applied
 * along the smallest push needed, so walls slide naturally instead of
 * tunneling.
 */
export const resolveStaticCollisions = (
  position: Vector2,
  radius: number,
  statics: Circle[],
): Vector2 => {
  let { x, y } = position;
  for (const solid of statics) {
    const dx = x - solid.position.x;
    const dy = y - solid.position.y;
    const minDistance = radius + solid.radius;
    const length = Math.hypot(dx, dy);
    if (length >= minDistance) continue;
    if (length < 1e-6) {
      // Degenerate overlap: push straight up.
      y = solid.position.y - minDistance;
      continue;
    }
    const push = (minDistance - length) / length;
    x += dx * push;
    y += dy * push;
  }
  return { x, y };
};

/**
 * Axis-separated movement that stops at solid circles instead of passing
 * through them. Returns the resolved position.
 */
export const moveWithCollision = (
  position: Vector2,
  velocity: { x: number; y: number },
  radius: number,
  statics: Circle[],
  bounds: Bounds,
): Vector2 => {
  const afterX = resolveStaticCollisions(
    { x: position.x + velocity.x, y: position.y },
    radius,
    statics,
  );
  const afterY = resolveStaticCollisions(
    { x: afterX.x, y: position.y + velocity.y },
    radius,
    statics,
  );
  return clampToBounds({ x: afterY.x, y: afterY.y }, radius, bounds);
};

export const isInside = (
  point: Vector2,
  center: Vector2,
  radius: number,
): boolean => distance(point, center) <= radius;
