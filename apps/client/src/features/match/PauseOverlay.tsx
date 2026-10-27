import { leaveRoom } from "../../app/room-actions";
import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";

/** In-match menu: the match keeps running for everyone else. */
export const PauseOverlay = () => {
  const go = useAppStore((state) => state.go);
  const previousScreen = useAppStore((state) => state.previousScreen);

  return (
    <div className="modal-dim screen-enter">
      <Panel className="pause-panel">
        <h2>Others are still playing</h2>
        <p>The night does not wait. Take what you need, then head back.</p>
        <button onClick={() => go(previousScreen)} type="button">
          Resume
        </button>
        <button onClick={() => go("settings")} type="button">
          Settings
        </button>
        <button onClick={() => go("howto")} type="button">
          How to Play
        </button>
        <button className="danger" onClick={leaveRoom} type="button">
          Leave Match
        </button>
      </Panel>
    </div>
  );
};
