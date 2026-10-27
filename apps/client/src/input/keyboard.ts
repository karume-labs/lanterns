import type { InputState } from "@lanterns/domain";

/**
 * Desktop input: WASD/arrows to move, pointer to aim, click to shoot,
 * Q/E to pick a construct, Space for the ability, F to interact.
 * Returns a detach function.
 */
export const attachKeyboard = (
  onInput: (input: InputState) => void,
): (() => void) => {
  const keys = new Set<string>();
  let aim = { x: 1, y: 0 };
  let shooting = false;

  const publish = () =>
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
      placeConstruct: keys.has("q"),
      useRoleAbility: keys.has(" "),
      interact: keys.has("f"),
    });

  const onKey = (pressed: boolean) => (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (pressed) keys.add(key);
    else keys.delete(key);
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
  const interval = window.setInterval(publish, 50);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
    window.clearInterval(interval);
  };
};
