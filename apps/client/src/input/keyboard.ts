import type { InputState } from "@lanterns/domain";

/**
 * Desktop input: WASD/arrows to move, pointer to aim, click to shoot,
 * Q builds a wall, E builds a turret, Space casts the ability, F interacts.
 * Returns a detach function.
 */
export const attachKeyboard = (
  onInput: (input: InputState) => void,
): (() => void) => {
  const keys = new Set<string>();
  let aim = { x: 1, y: 0 };
  let shooting = false;
  // One-shot intents: a press queues exactly one build or cast, and holding
  // a key never repeats it (browser auto-repeat is ignored).
  let placeEdge = false;
  let abilityEdge = false;

  const publish = () => {
    const placeConstruct = placeEdge;
    const useRoleAbility = abilityEdge;
    placeEdge = false;
    abilityEdge = false;
    onInput({
      moveX:
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
      moveY:
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
        (keys.has("w") || keys.has("arrowup") ? 1 : 0),
      aimX: aim.x,
      aimY: aim.y,
      shooting,
      selectedConstruct: keys.has("e") ? "turret" : "wall",
      placeConstruct,
      useRoleAbility,
      interact: keys.has("f"),
    });
  };

  const onKey = (pressed: boolean) => (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (pressed) {
      keys.add(key);
      if (!event.repeat) {
        if (key === "q" || key === "e") placeEdge = true;
        if (key === " ") abilityEdge = true;
      }
    } else {
      keys.delete(key);
    }
    if (key === " " || key.startsWith("arrow")) event.preventDefault();
    publish();
  };
  const onKeyDown = onKey(true);
  const onKeyUp = onKey(false);

  const onMouseMove = (event: MouseEvent) => {
    const dx = event.clientX - window.innerWidth / 2;
    const dy = event.clientY - window.innerHeight / 2;
    const length = Math.hypot(dx, dy) || 1;
    aim = { x: dx / length, y: dy / length };
    publish();
  };
  const onMouseDown = () => {
    shooting = true;
    publish();
  };
  const onMouseUp = () => {
    shooting = false;
    publish();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  const interval = window.setInterval(() => {
    // Stream only while keys or the mouse are driving something: otherwise a
    // held-but-still touch joystick would be overwritten with an empty state.
    if (keys.size > 0 || shooting) publish();
  }, 50);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
    window.clearInterval(interval);
  };
};
