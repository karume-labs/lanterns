import { ABILITY_GLOBAL_COOLDOWN_MS, type InputState } from "@lanterns/domain";
import { useRef } from "react";
import { useAppStore } from "../../app/store";
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
      }),
    90,
  );
};

interface BuildPadProps {
  hotkeys: boolean;
}

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
      </button>
    </div>
  );
};

/** Role ability with a cooldown ring drawn from local press timing. */
export const AbilityButton = ({ hotkeys }: BuildPadProps) => {
  const ring = useRef<HTMLSpanElement>(null);
  const lastPress = useRef(0);
  const scheme = useAppStore((state) => state.settings.scheme);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const touch = scheme === "touch" || (scheme === "auto" && coarse);

  const press = (): void => {
    lastPress.current = performance.now();
    pulse({ useRoleAbility: true });
  };

  const update = (): void => {
    const node = ring.current;
    if (!node) return;
    const elapsed = performance.now() - lastPress.current;
    const ratio = Math.max(0, 1 - elapsed / ABILITY_GLOBAL_COOLDOWN_MS);
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
      {touch && <small className="num">A</small>}
    </button>
  );
};
