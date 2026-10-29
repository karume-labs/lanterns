import type { InputState } from "@lanterns/domain";
import { useRef } from "react";
import { useHudFrame } from "../../hooks/useHudFrame";
import { currentInput, dispatchInput } from "../../input/current-input";

const pulse = (patch: Partial<InputState>): void => {
  dispatchInput({ ...currentInput.value, ...patch });
  window.setTimeout(
    () =>
      dispatchInput({
        ...currentInput.value,
        placeConstruct: false,
        useRoleAbility: false,
        interact: false,
      }),
    90,
  );
};

/**
 * Desktop twins of the touch buttons: hold Shoot to fire like a mouse
 * click, tap Revive to interact like the F key. Every control scheme can
 * reach every verb with a pointer alone.
 */
export const ActionPad = ({ hotkeys }: BuildPadProps) => {
  const setShooting = (shooting: boolean): void => {
    dispatchInput({ ...currentInput.value, shooting });
  };
  return (
    <div className="action-pad">
      <button
        aria-label="Hold to shoot"
        onPointerCancel={() => setShooting(false)}
        onPointerDown={() => setShooting(true)}
        onPointerLeave={() => setShooting(false)}
        onPointerUp={() => setShooting(false)}
        title={hotkeys ? "Shoot - Click" : "Hold to shoot"}
        type="button"
      >
        Shoot
        {hotkeys && <kbd className="key">Click</kbd>}
      </button>
      <button
        aria-label="Revive nearby teammate"
        onClick={() => pulse({ interact: true })}
        title={hotkeys ? "Revive - F" : "Revive nearby teammate"}
        type="button"
      >
        Revive
        {hotkeys && <kbd className="key">F</kbd>}
      </button>
    </div>
  );
};

interface BuildPadProps {
  hotkeys: boolean;
}

/** How long the ability ring flashes after a press. */
const PRESS_FLASH_MS = 400;

/** Wall (Q) and turret (E) build buttons with costs. */
export const BuildPad = ({ hotkeys }: BuildPadProps) => {
  return (
    <div className="build-pad">
      <button
        onClick={() =>
          pulse({ selectedConstruct: "wall", placeConstruct: true })
        }
        title={hotkeys ? "Wall - Q" : "Build wall"}
        type="button"
      >
        Wall
        <small className="num">25</small>
        {hotkeys && <kbd className="key">Q</kbd>}
      </button>
      <button
        onClick={() =>
          pulse({ selectedConstruct: "turret", placeConstruct: true })
        }
        title={hotkeys ? "Turret - E" : "Build turret"}
        type="button"
      >
        Turret
        <small className="num">45</small>
        {hotkeys && <kbd className="key">E</kbd>}
      </button>
    </div>
  );
};

/** Role ability with a press-feedback ring; energy alone gates recasts. */
export const AbilityButton = ({ hotkeys }: BuildPadProps) => {
  const ring = useRef<HTMLSpanElement>(null);
  const lastPress = useRef(0);

  const press = (): void => {
    lastPress.current = performance.now();
    pulse({ useRoleAbility: true });
  };

  const update = (): void => {
    const node = ring.current;
    if (!node) return;
    const elapsed = performance.now() - lastPress.current;
    const ratio = Math.max(0, 1 - elapsed / PRESS_FLASH_MS);
    node.style.setProperty("--cooldown", `${ratio * 360}deg`);
  };
  useHudFrame(update);

  return (
    <button
      aria-label="Role ability"
      className="ability-btn"
      onClick={press}
      title={hotkeys ? "Ability - Space" : "Role ability"}
      type="button"
    >
      <span aria-hidden="true" className="cooldown-ring" ref={ring} />
      <span>Ability</span>
      {hotkeys && <kbd className="key">Space</kbd>}
    </button>
  );
};
