import { leaveRoom } from "../../app/room-actions";
import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";

/**
 * In-match menu. Opening it freezes the whole room for everyone - the pause
 * itself is owned by useRoomPause, so it survives trips into Settings or
 * How to Play from this panel and releases on Resume or Leave.
 */
export const PauseOverlay = () => {
  const go = useAppStore((state) => state.go);

  // Resume always returns to the live match: previousScreen can be a sub-screen
  // (Settings or How to Play) that was opened from this panel.
  return (
    <div className="modal-dim screen-enter">
      <Panel className="pause-panel" onClose={() => go("match")}>
        <h2>The night holds its breath</h2>
        <p>The whole room is paused until you resume. Take what you need.</p>
        <button onClick={() => go("match")} type="button">
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
