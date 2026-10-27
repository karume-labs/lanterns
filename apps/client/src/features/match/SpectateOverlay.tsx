import { useEffect, useState } from "react";
import { useAppStore } from "../../app/store";
import { frameRefs, setSpectating } from "../../game/frame-refs";

const aliveTeammates = (): { id: string; name: string }[] => {
  const room = frameRefs.room;
  if (!room) return [];
  return room.players
    .filter(
      (player) =>
        player.connected &&
        player.id !== frameRefs.playerId &&
        player.role !== null,
    )
    .map((player) => ({ id: player.id, name: player.name }));
};

/**
 * Spectate banner: the camera follows alive teammates (Scene reads the
 * spectating flag), switch with the arrows, Stop returns to play.
 */
export const SpectateOverlay = () => {
  const go = useAppStore((state) => state.go);
  const room = useAppStore((state) => state.room);
  const [cursor, setCursor] = useState(0);
  const list = aliveTeammates();
  const current = list[cursor % Math.max(1, list.length)];

  useEffect(() => {
    const first = aliveTeammates()[0];
    setSpectating(true, first?.id ?? null);
    return () => setSpectating(false);
  }, []);

  if (!room) return null;
  const switchTo = (delta: number): void => {
    const nextCursor = cursor + delta;
    setCursor(nextCursor);
    const next = aliveTeammates();
    const target =
      next[((nextCursor % next.length) + next.length) % next.length];
    setSpectating(true, target?.id ?? null);
  };

  return (
    <div className="spectate-banner screen-enter">
      <span>Spectating {current?.name ?? "the fight"}</span>
      <button
        aria-label="Previous teammate"
        className="corner-btn"
        onClick={() => switchTo(-1)}
        type="button"
      >
        ◀
      </button>
      <button
        aria-label="Next teammate"
        className="corner-btn"
        onClick={() => switchTo(1)}
        type="button"
      >
        ▶
      </button>
      <button
        className="secondary"
        onClick={() => {
          setSpectating(false);
          go("hub");
        }}
        type="button"
      >
        Stop
      </button>
    </div>
  );
};
