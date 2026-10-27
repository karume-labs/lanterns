import { useAppStore } from "../../app/store";

/** Tap-to-copy room code chip with confirmation toast. */
export const RoomCodeChip = () => {
  const room = useAppStore((state) => state.room);
  const toast = useAppStore((state) => state.toast);
  if (!room) return null;
  const copy = (): void => {
    void navigator.clipboard
      ?.writeText(room.code)
      .then(() => toast("Copied - share it with your crew."))
      .catch(() => toast(`Code: ${room.code}`));
  };
  return (
    <button
      aria-label={`Room code ${room.code}, tap to copy`}
      className="code-chip num"
      onClick={copy}
      type="button"
    >
      {room.code}
    </button>
  );
};

/** Leave + settings buttons for the hub corner. */
export const HubCorner = () => {
  const go = useAppStore((state) => state.go);
  const leave = (): void => {
    void import("../../app/room-actions").then((module) => module.leaveRoom());
  };
  return (
    <div className="hub-corner">
      <button
        aria-label="Settings"
        className="corner-btn"
        onClick={() => go("settings")}
        type="button"
      >
        Settings
      </button>
      <button className="corner-btn danger" onClick={leave} type="button">
        Leave
      </button>
    </div>
  );
};
