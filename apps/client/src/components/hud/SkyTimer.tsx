import { MATCH_DURATION_SECONDS } from "@lanterns/domain";
import { useRef } from "react";
import { frameRefs } from "../../game/frame-refs";
import { useHudFrame } from "../../hooks/useHudFrame";

/** Top-center sky bar: time until dawn, dusk-to-dawn fill, sun marker. */
export const SkyTimer = () => {
  const fill = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useHudFrame(() => {
    const elapsed = frameRefs.snap?.el ?? 0;
    const ratio = Math.max(0, Math.min(1, elapsed / MATCH_DURATION_SECONDS));
    if (fill.current) {
      fill.current.style.width = `${ratio * 100}%`;
      fill.current.dataset.stage =
        ratio < 0.33 ? "dusk" : ratio < 0.72 ? "night" : "dawn";
    }
    if (marker.current) marker.current.style.left = `${ratio * 100}%`;
    if (label.current) {
      const remaining = Math.max(
        0,
        MATCH_DURATION_SECONDS - Math.floor(elapsed),
      );
      const minutes = Math.floor(remaining / 60);
      const seconds = String(remaining % 60).padStart(2, "0");
      label.current.textContent = `${minutes}:${seconds}`;
    }
  });

  return (
    <div aria-label="Time until dawn" className="sky-timer" role="img">
      <div className="sky-timer-track">
        <div className="sky-timer-fill" ref={fill} />
        <div className="sky-timer-marker" ref={marker} />
      </div>
      <span className="sky-timer-label num" ref={label}>
        10:00
      </span>
    </div>
  );
};
