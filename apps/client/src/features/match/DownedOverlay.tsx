import { PLAYER_FLAG } from "@lanterns/domain";
import { useRef } from "react";
import { useAppStore } from "../../app/store";
import { frameRefs } from "../../game/frame-refs";
import { useHudFrame } from "../../hooks/useHudFrame";
import { myIndex, myRow } from "./frame-reads";

const SPECTATE_AFTER_MS = 12_000;

/** True while the local player is downed (reads the frame refs). */
const isDowned = (): boolean =>
  ((myRow()?.[5] ?? 0) & PLAYER_FLAG.downed) !== 0;

/**
 * Red vignette prompt while downed: revive timer ring, teammate hint, and a
 * late Spectate offer once the revive window is nearly over.
 */
export const DownedOverlay = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const spectateBtn = useRef<HTMLButtonElement>(null);
  const go = useAppStore((state) => state.go);
  const sinceDowned = useRef(0);

  useHudFrame(() => {
    const downed = isDowned();
    const root = rootRef.current;
    if (!root) return;
    root.hidden = !downed;
    if (!downed) {
      sinceDowned.current = 0;
      return;
    }
    if (!sinceDowned.current) sinceDowned.current = performance.now();
    const elapsed = performance.now() - sinceDowned.current;
    const index = myIndex();
    const snap = frameRefs.snap;
    const teammateNear =
      (snap?.pl ?? []).some((row, other) => {
        if (other === index) return false;
        const flags = row?.[5] ?? 0;
        if ((flags & PLAYER_FLAG.downed) !== 0) return false;
        const me = myRow();
        if (!me) return false;
        return (
          Math.hypot(
            (row?.[0] ?? 0) - (me[0] ?? 0),
            (row?.[1] ?? 0) - (me[1] ?? 0),
          ) < 96
        );
      }) ?? false;
    if (hintRef.current)
      hintRef.current.textContent = teammateNear
        ? "A teammate is close - hold near them to be revived."
        : "Downed. A teammate nearby can revive you.";
    if (ringRef.current)
      ringRef.current.style.setProperty(
        "--revive",
        `${Math.max(0, 360 - (elapsed / SPECTATE_AFTER_MS) * 360)}deg`,
      );
    if (spectateBtn.current)
      spectateBtn.current.hidden = elapsed < SPECTATE_AFTER_MS * 0.75;
  });

  return (
    <div className="downed-overlay" ref={rootRef} hidden>
      <div aria-hidden="true" className="revive-ring" ref={ringRef} />
      <p ref={hintRef}>Downed. A teammate nearby can revive you.</p>
      <button
        className="secondary"
        onClick={() => go("spectate")}
        ref={spectateBtn}
        type="button"
      >
        Spectate
      </button>
    </div>
  );
};
