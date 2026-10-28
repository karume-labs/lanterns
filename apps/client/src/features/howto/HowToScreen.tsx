import { useState } from "react";
import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";

interface Page {
  title: string;
  touch: string;
  kbm: string;
  demo: string;
}

const PAGES: Page[] = [
  {
    title: "Move",
    touch: "Left stick walks. It appears where your thumb lands.",
    kbm: "WASD or arrow keys to move.",
    demo: "demo-move",
  },
  {
    title: "Shoot",
    touch: "Right stick aims and fires while held.",
    kbm: "Mouse aims; click or hold to fire.",
    demo: "demo-shoot",
  },
  {
    title: "Fuel the lantern",
    touch: "Walk over glowing shards and stand near the lantern.",
    kbm: "Same - shards are gathered by walking over them.",
    demo: "demo-fuel",
  },
  {
    title: "Build",
    touch: "Tap Wall or Turret on the right when you have energy.",
    kbm: "Q builds a wall, E a turret.",
    demo: "demo-build",
  },
  {
    title: "Revive",
    touch: "Hold Revive beside a downed friend.",
    kbm: "Hold F beside a downed friend.",
    demo: "demo-revive",
  },
  {
    title: "Roles",
    touch: "Tap your color at the rack. Each color plays differently.",
    kbm: "Walk to the rack and press F to claim a color.",
    demo: "demo-roles",
  },
  {
    title: "Win",
    touch: "Keep fuel above zero until the sky turns gold.",
    kbm: "Same - survive until dawn.",
    demo: "demo-win",
  },
];

/** Paged carousel; shows the control set for this device, toggleable. */
export const HowToScreen = () => {
  const go = useAppStore((state) => state.go);
  const previousScreen = useAppStore((state) => state.previousScreen);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const [page, setPage] = useState(0);
  const [showTouch, setShowTouch] = useState(coarse);
  const current = PAGES[page];

  return (
    <div className="modal-dim screen-enter">
      <Panel className="howto-panel">
        <h2>How to play</h2>
        <div className={`mini-demo ${current.demo}`} aria-hidden="true">
          <span className="demo-lantern" />
          <span className="demo-hero" />
        </div>
        <h3>{current.title}</h3>
        <p>{showTouch ? current.touch : current.kbm}</p>
        <div className="segmented">
          <button
            aria-pressed={showTouch}
            className={showTouch ? "selected" : ""}
            onClick={() => setShowTouch(true)}
            type="button"
          >
            Touch
          </button>
          <button
            aria-pressed={!showTouch}
            className={!showTouch ? "selected" : ""}
            onClick={() => setShowTouch(false)}
            type="button"
          >
            Keys
          </button>
        </div>
        <div className="howto-nav">
          <button
            className="secondary"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
            type="button"
          >
            Back
          </button>
          <span className="num">
            {page + 1} / {PAGES.length}
          </span>
          <button
            disabled={page === PAGES.length - 1}
            onClick={() => setPage((value) => value + 1)}
            type="button"
          >
            Next
          </button>
        </div>
        <button
          className="secondary"
          onClick={() => go(previousScreen)}
          type="button"
        >
          Close
        </button>
      </Panel>
    </div>
  );
};
