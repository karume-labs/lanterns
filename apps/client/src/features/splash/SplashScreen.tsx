import { useAppStore } from "../../app/store";
import { unlockAudio } from "../../game/audio";

/**
 * First-tap gate: unlocks audio, asks for fullscreen on touch devices where
 * allowed, then fades into the menu. No sound may exist before this gesture.
 */
export const SplashScreen = () => {
  const go = useAppStore((state) => state.go);
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const light = (): void => {
    unlockAudio();
    if (coarse) {
      const root = document.documentElement;
      void root.requestFullscreen?.().catch(() => {
        // fullscreen is optional; iOS may refuse without a user gesture chain
      });
    }
    go("menu");
  };

  return (
    <button
      aria-label={
        coarse ? "Tap to light the lantern" : "Click to light the lantern"
      }
      className="splash screen-enter"
      onClick={light}
      type="button"
    >
      <span className="splash-lantern pulse" aria-hidden="true" />
      <span className="splash-text">
        {coarse ? "Tap to light the lantern" : "Click to light the lantern"}
      </span>
    </button>
  );
};
