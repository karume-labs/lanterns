import { useEffect, useRef } from "react";

type FrameCallback = (timeMs: number) => void;

/**
 * Runs `callback` every animation frame. HUD components use this to write
 * DOM text/styles directly so snapshot-rate values never touch React state.
 * The callback is kept in a ref, so identity changes never restart the loop.
 */
export const useHudFrame = (callback: FrameCallback): void => {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    let handle = 0;
    const tick = (timeMs: number) => {
      saved.current(timeMs);
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, []);
};
