import { useEffect, useRef, useState } from "react";
import { leaveRoom } from "../../app/room-actions";
import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";
import { playSfx } from "../../game/audio";
import { PlayerList, StartHint } from "./PlayerList";
import { RolePicker } from "./RolePicker";
import { HubCorner, RoomCodeChip } from "./RoomCodeChip";

const countdownText = (endsAt: number | null): string => {
  if (endsAt === null) return "";
  const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  return left > 0 ? String(left) : "Light!";
};

/** Big countdown number; identical updates bail out of rendering. */
const Countdown = ({ endsAt }: { endsAt: number | null }) => {
  const [text, setText] = useState("");
  const previous = useRef("");
  useEffect(() => {
    const update = (): void => setText(countdownText(endsAt));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  useEffect(() => {
    // One beep per new second; the first paint is silent (started event has
    // its own cue).
    if (text && text !== previous.current) {
      if (previous.current !== "" && /^\d$/.test(text)) playSfx("count");
      previous.current = text;
    }
  }, [text]);
  if (!text) return null;
  return (
    <div aria-live="assertive" className="countdown pulse">
      {text}
    </div>
  );
};

/** Roamable-lobby overlay: code, crew, rack prompt, countdown, corner. */
export const HubOverlay = () => {
  const room = useAppStore((state) => state.room);
  const playerId = useAppStore((state) => state.playerId);
  const go = useAppStore((state) => state.go);
  const [picking, setPicking] = useState(false);
  if (!room) return null;
  const myRole = room.players.find((player) => player.id === playerId)?.role;

  return (
    <div className="hub-overlay screen-enter">
      <div className="hub-top">
        <RoomCodeChip />
        <HubCorner />
      </div>
      <Panel className="crew-panel">
        <h2>The crew</h2>
        <PlayerList />
        <button
          className="secondary"
          onClick={() => setPicking(true)}
          type="button"
        >
          {myRole ? "Change color" : "Pick a color"}
        </button>
        <StartHint />
        <button className="danger" onClick={leaveRoom} type="button">
          Leave room
        </button>
        <p className="hint">
          Walk into the glowing circle to ready up. The match starts when
          everyone is in.
        </p>
      </Panel>
      <Countdown endsAt={room.countdownEndsAt} />
      <p className="hub-prompt">
        {myRole
          ? "Step into the ready circle with your crew."
          : "Pick a color at the rack, then step into the circle."}
      </p>
      <button
        aria-label="How to play"
        className="corner-btn howto-btn"
        onClick={() => go("howto")}
        type="button"
      >
        ?
      </button>
      {picking && <RolePicker onClose={() => setPicking(false)} />}
    </div>
  );
};
