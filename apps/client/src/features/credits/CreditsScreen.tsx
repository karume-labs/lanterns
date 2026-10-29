import { useEffect, useState } from "react";
import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";

const FALLBACK = `Lanterns - original game.
Art, music, code, and design created for this project.
Fonts: Silkscreen and Pixelify Sans (SIL Open Font License 1.1).`;

/** Renders public/CREDITS.md (assets, fonts, tools, generated audio notes). */
export const CreditsScreen = () => {
  const go = useAppStore((state) => state.go);
  const previousScreen = useAppStore((state) => state.previousScreen);
  const [text, setText] = useState(FALLBACK);

  useEffect(() => {
    void fetch("/CREDITS.md")
      .then((response) => (response.ok ? response.text() : FALLBACK))
      .then(setText)
      .catch(() => setText(FALLBACK));
  }, []);

  return (
    <div className="modal-dim screen-enter">
      <Panel className="credits-panel" onClose={() => go(previousScreen)}>
        <h2>Credits</h2>
        <pre className="credits-text">{text}</pre>
        <button onClick={() => go(previousScreen)} type="button">
          Back
        </button>
      </Panel>
    </div>
  );
};
