import { type InputState, normalizeInput } from "../input-state";
import { clampToBounds } from "./geometry";

/**
 * Advance a moving circle by `input` for `dt` seconds at `speed` world units
 * per second. Movement is normalized so diagonals are not faster, and the
 * result is kept inside `bounds`.
 */
export const stepPosition = (
  position: { x: number; y: number },
  input: InputState,
  speed: number,
  dt: number,
  radius: number,
  bounds: { width: number; height: number },
): { x: number; y: number } => {
  const { moveX, moveY } = normalizeInput(input);
  const next = {
    x: position.x + moveX * speed * dt,
    y: position.y + moveY * speed * dt,
  };
  return clampToBounds(next, radius, bounds);
};

/** Diagonal movement must not exceed axis movement. */
export const isNormalized = (input: InputState): boolean => {
  const { moveX, moveY } = normalizeInput(input);
  return Math.hypot(moveX, moveY) <= 1 + 1e-9;
};
