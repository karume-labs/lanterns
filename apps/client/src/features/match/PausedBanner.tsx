import { useAppStore } from "../../app/store";

/**
 * Shown to everyone while the room is frozen by a teammate's menu. The
 * pauser's own screen is covered by the pause overlay itself.
 */
export const PausedBanner = () => {
  const paused = useAppStore((state) => state.room?.paused ?? false);
  const screen = useAppStore((state) => state.screen);
  // Hidden on the pauser's own screens (menu + its sub-screens).
  const mine =
    screen === "pause" || screen === "settings" || screen === "howto";
  if (!paused || mine) return null;
  return (
    <div className="paused-banner" role="status">
      <span className="paused-dot" />
      Paused — a teammate has the menu open
    </div>
  );
};
