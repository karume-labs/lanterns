import type { Player, RoomState, Snapshot } from "@lanterns/domain";
import { MATCH_DURATION_SECONDS } from "@lanterns/domain";

interface HudProps {
  room: RoomState;
  snap: Snapshot | null;
  player: Player | undefined;
}

/** Read the freshest value: snapshot while ticking, room-state as fallback. */
export const Hud = ({ room, snap, player }: HudProps) => {
  const elapsed = snap?.el ?? room.elapsedSeconds;
  const remaining = Math.max(0, Math.ceil(MATCH_DURATION_SECONDS - elapsed));
  const fuel = snap?.ln?.[2] ?? room.lantern?.fuel ?? 0;
  const index = player ? room.players.indexOf(player) : -1;
  const row = index >= 0 ? snap?.pl[index] : undefined;
  const health = row ? row[3] : (player?.health ?? 0);
  const energy = row ? row[4] : (player?.energy ?? 0);
  return (
    <aside className="hud" aria-live="off">
      <strong className="timer">{formatTime(remaining)}</strong>
      <span className="fuel">Fuel {Math.round(fuel)}</span>
      <span className="health">Health {Math.round(health)}</span>
      <span className="energy">Energy {Math.round(energy)}</span>
    </aside>
  );
};

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};
