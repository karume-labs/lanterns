import { useEffect } from "react";
import { useAppStore } from "../app/store";
import { getSocket } from "../net/connection";

/**
 * Whole-room pause: while the in-match menu family is open - the pause
 * panel plus its Settings and How to Play sub-screens - and the match is
 * live, hold the room's pause; release it the moment the player is back in
 * the game. One owner for the request, so screen changes can't double-send.
 */
export const useRoomPause = (): void => {
  const screen = useAppStore((state) => state.screen);
  const room = useAppStore((state) => state.room);
  const spectator = useAppStore((state) => state.spectator);

  const paused = room?.paused ?? false;
  const wants =
    room !== null &&
    !spectator &&
    room.phase === "active" &&
    (screen === "pause" || screen === "settings" || screen === "howto");

  // The server echoes `paused` back, so this converges after one round trip
  // and never re-fires when a request was ignored.
  useEffect(() => {
    if (wants === paused) return;
    getSocket()?.setPause(wants);
  }, [wants, paused]);
};
