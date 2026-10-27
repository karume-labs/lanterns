import { useEffect } from "react";
import { useAppStore } from "../../app/store";
import { getSocket } from "../../net/connection";

const PICK_WINDOW_MS = 8000;

/** Three upgrade cards for 8 seconds; the first auto-picks at timeout. */
export const LevelUpOverlay = () => {
  const levelUp = useAppStore((state) => state.levelUp);
  const setLevelUp = useAppStore((state) => state.setLevelUp);

  const pick = (upgradeId: string): void => {
    getSocket()?.chooseUpgrade(upgradeId);
    setLevelUp(null);
  };

  useEffect(() => {
    if (!levelUp) return;
    const timer = window.setTimeout(() => {
      const current = useAppStore.getState().levelUp;
      const leading = current?.choices[0]?.id;
      if (leading) getSocket()?.chooseUpgrade(leading);
      useAppStore.getState().setLevelUp(null);
    }, PICK_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [levelUp]);

  if (!levelUp) return null;
  return (
    <div aria-live="polite" className="levelup-overlay screen-enter">
      <h3>Level {levelUp.level} - choose one</h3>
      <div className="levelup-cards">
        {levelUp.choices.map((choice) => (
          <button
            className="levelup-card pixel-frame"
            key={choice.id}
            onClick={() => pick(choice.id)}
            type="button"
          >
            <strong>{choice.label}</strong>
            <small>{choice.detail}</small>
          </button>
        ))}
      </div>
    </div>
  );
};
