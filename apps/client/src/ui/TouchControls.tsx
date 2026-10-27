import { EMPTY_INPUT, type InputState } from "@lanterns/domain";
import { useRef } from "react";
import { Joystick } from "./Joystick";

interface TouchControlsProps {
  onInput: (input: InputState) => void;
}

const DEADZONE = 0.2;

/**
 * Left stick moves; right stick aims and holds-fire; the small buttons send
 * ability, wall, turret, and revive intents. Everything maps onto the same
 * InputState contract the keyboard uses.
 */
export const TouchControls = ({ onInput }: TouchControlsProps) => {
  const input = useRef<InputState>({ ...EMPTY_INPUT });
  const push = (patch: Partial<InputState>): void => {
    input.current = { ...input.current, ...patch };
    onInput(input.current);
  };

  const onMove = (x: number, y: number): void =>
    push(
      Math.hypot(x, y) < DEADZONE
        ? { moveX: 0, moveY: 0 }
        : { moveX: x, moveY: y },
    );
  const onAim = (x: number, y: number): void => {
    if (Math.hypot(x, y) < DEADZONE) push({ shooting: false });
    else push({ aimX: x, aimY: y, shooting: true });
  };

  const press = (patch: Partial<InputState>) => ({
    onPointerDown: () => push(patch),
    onPointerUp: () =>
      push({ placeConstruct: false, useRoleAbility: false, interact: false }),
    onPointerCancel: () =>
      push({ placeConstruct: false, useRoleAbility: false, interact: false }),
  });

  return (
    <>
      <div className="touch-move">
        <Joystick label="Move" onMove={onMove} />
      </div>
      <div className="touch-aim">
        <Joystick label="Aim and fire" onMove={onAim} />
      </div>
      <div className="touch-actions">
        <button
          aria-label="Role ability"
          type="button"
          {...press({ useRoleAbility: true })}
        >
          A
        </button>
        <button
          aria-label="Build wall"
          type="button"
          {...press({ selectedConstruct: "wall", placeConstruct: true })}
        >
          W
        </button>
        <button
          aria-label="Build turret"
          type="button"
          {...press({ selectedConstruct: "turret", placeConstruct: true })}
        >
          T
        </button>
        <button
          aria-label="Revive"
          type="button"
          {...press({ interact: true })}
        >
          R
        </button>
      </div>
    </>
  );
};
