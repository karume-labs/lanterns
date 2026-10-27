import type { InputState } from "@lanterns/domain";

interface TouchControlsProps {
  onInput: (input: InputState) => void;
}

const emptyInput = (patch: Partial<InputState> = {}): InputState => ({
  moveX: 0,
  moveY: 0,
  aimX: 1,
  aimY: 0,
  shooting: false,
  selectedConstruct: null,
  placeConstruct: false,
  useRoleAbility: false,
  interact: false,
  ...patch,
});

/** Coarse-pointer devices get action buttons; full joysticks land later. */
export const TouchControls = ({ onInput }: TouchControlsProps) => {
  if (!matchMedia("(pointer: coarse)").matches) return null;
  return (
    <div className="touch-controls">
      <button
        onPointerDown={() => onInput(emptyInput({ shooting: true }))}
        onPointerUp={() => onInput(emptyInput())}
        onPointerLeave={() => onInput(emptyInput())}
        type="button"
      >
        Fire
      </button>
      <button
        onPointerDown={() => onInput(emptyInput({ useRoleAbility: true }))}
        onPointerUp={() => onInput(emptyInput())}
        type="button"
      >
        Ability
      </button>
      <button
        onPointerDown={() => onInput(emptyInput({ placeConstruct: true }))}
        onPointerUp={() => onInput(emptyInput())}
        type="button"
      >
        Build
      </button>
      <button
        onPointerDown={() => onInput(emptyInput({ interact: true }))}
        onPointerUp={() => onInput(emptyInput())}
        type="button"
      >
        Help
      </button>
    </div>
  );
};
