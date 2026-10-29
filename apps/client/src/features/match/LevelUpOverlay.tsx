import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "../../app/store";
import { getSocket } from "../../net/connection";

/** The sim stays frozen until every connected player votes (25 s cap). */
const PICK_WINDOW_MS = 24_000;
const HOTKEYS = ["1", "2", "3"];

/**
 * Full-screen level-up intermission: the match sim is frozen while this is
 * up. Pick with click, tap, or keys 1-3; after voting, the overlay shows who
 * is still choosing and closes once the server clears the table.
 */
export const LevelUpOverlay = () => {
  const levelUp = useAppStore((state) => state.levelUp);
  const room = useAppStore((state) => state.room);
  const [pickedId, setPickedId] = useState<string | null>(null);

  // A new pick round resets the local vote. Server re-broadcasts the same
  // choices on every vote, so identity alone must not clear a cast vote.
  const lastLevel = useRef<number | null>(null);
  useEffect(() => {
    if (levelUp && levelUp.level !== lastLevel.current) {
      lastLevel.current = levelUp.level;
      setPickedId(null);
    }
  }, [levelUp]);

  // Safety net: an unvoted player auto-votes instead of stalling the crew.
  useEffect(() => {
    if (!levelUp || pickedId) return;
    const timer = window.setTimeout(() => {
      const current = useAppStore.getState().levelUp;
      const leading = current?.choices[0]?.id;
      if (leading) {
        getSocket()?.chooseUpgrade(leading);
        setPickedId(leading);
      }
    }, PICK_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [levelUp, pickedId]);

  const crewSize = room?.players.filter((player) => player).length ?? 1;

  const pick = useCallback(
    (upgradeId: string): void => {
      if (pickedId) return;
      getSocket()?.chooseUpgrade(upgradeId);
      setPickedId(upgradeId);
    },
    [pickedId],
  );

  useEffect(() => {
    if (!levelUp || pickedId) return;
    const onKey = (event: KeyboardEvent): void => {
      const index = HOTKEYS.indexOf(event.key);
      const choice = levelUp.choices[index];
      if (choice) {
        event.preventDefault();
        pick(choice.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [levelUp, pickedId, pick]);

  if (!levelUp) return null;
  const waiting = pickedId !== null;
  return (
    <div
      aria-label="Choose a team upgrade"
      aria-live="polite"
      className="levelup-overlay levelup-big screen-enter"
      role="dialog"
    >
      <h3>Level {levelUp.level} — the crew grows stronger</h3>
      <p className="levelup-freeze">
        The night holds still while the crew chooses.
      </p>
      <div className="levelup-cards">
        {levelUp.choices.map((choice, index) => {
          const hotkey = HOTKEYS[index] ?? "";
          const voted = pickedId === choice.id;
          return (
            <button
              className={`levelup-card pixel-frame${voted ? " picked" : ""}`}
              disabled={waiting}
              key={choice.id}
              onClick={() => pick(choice.id)}
              type="button"
            >
              <strong>{choice.label}</strong>
              <small>{choice.detail}</small>
              {!waiting && hotkey !== "" && <kbd className="key">{hotkey}</kbd>}
              {voted && <small className="voted">Your pick ✓</small>}
            </button>
          );
        })}
      </div>
      {waiting && (
        <p className="levelup-wait">
          Picked! Waiting on the rest of the crew
          {crewSize > 1 ? ` (${crewSize} lanterns)` : ""}…
        </p>
      )}
    </div>
  );
};
