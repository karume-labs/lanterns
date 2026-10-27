import type { ConstructKind } from "./types";

/**
 * One device-agnostic input contract. Keyboard/mouse, gamepad, and touch
 * joysticks all normalize into this shape; the server treats every field as
 * untrusted intent and re-validates it.
 *
 * `placeConstruct` and `useRoleAbility` are edge intents (the server latches
 * them for one tick). `interact` is a held state used for revive channeling.
 * `shooting` is held state.
 */
export interface InputState {
  /** [-1, 1] horizontal movement */
  moveX: number;
  /** [-1, 1] vertical movement */
  moveY: number;
  /** unit-aim direction, x */
  aimX: number;
  /** unit-aim direction, y */
  aimY: number;
  shooting: boolean;
  selectedConstruct: ConstructKind | null;
  placeConstruct: boolean;
  useRoleAbility: boolean;
  interact: boolean;
}

export const EMPTY_INPUT: InputState = {
  moveX: 0,
  moveY: 0,
  aimX: 1,
  aimY: 0,
  shooting: false,
  selectedConstruct: null,
  placeConstruct: false,
  useRoleAbility: false,
  interact: false,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** Clamp axes into range and cap the move vector at unit length. */
export const normalizeInput = (input: InputState): InputState => {
  const moveX = clamp(input.moveX, -1, 1);
  const moveY = clamp(input.moveY, -1, 1);
  const length = Math.hypot(moveX, moveY);
  const scale = length > 1 ? 1 / length : 1;
  const aimLength = Math.hypot(input.aimX, input.aimY);
  const aimScale = aimLength > 1e-6 ? 1 / aimLength : 1;
  return {
    moveX: moveX * scale,
    moveY: moveY * scale,
    aimX: aimLength > 1e-6 ? input.aimX * aimScale : 1,
    aimY: aimLength > 1e-6 ? input.aimY * aimScale : 0,
    shooting: Boolean(input.shooting),
    selectedConstruct:
      input.selectedConstruct === "wall" || input.selectedConstruct === "turret"
        ? input.selectedConstruct
        : null,
    placeConstruct: Boolean(input.placeConstruct),
    useRoleAbility: Boolean(input.useRoleAbility),
    interact: Boolean(input.interact),
  };
};

export const isValidInput = (value: unknown): value is InputState => {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;
  const number = (key: string, min: number, max: number): boolean =>
    typeof input[key] === "number" &&
    Number.isFinite(input[key]) &&
    (input[key] as number) >= min &&
    (input[key] as number) <= max;
  return (
    number("moveX", -1, 1) &&
    number("moveY", -1, 1) &&
    number("aimX", -1.0001, 1.0001) &&
    number("aimY", -1.0001, 1.0001) &&
    typeof input.shooting === "boolean" &&
    (input.selectedConstruct === null ||
      input.selectedConstruct === "wall" ||
      input.selectedConstruct === "turret") &&
    typeof input.placeConstruct === "boolean" &&
    typeof input.useRoleAbility === "boolean" &&
    typeof input.interact === "boolean"
  );
};
