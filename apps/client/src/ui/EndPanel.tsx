import type { MatchStats, RoomState } from "@lanterns/domain";

interface EndPanelProps {
  room: RoomState;
  stats: MatchStats | null;
  isHost: boolean;
  onReturn: () => void;
}

export const EndPanel = ({ room, stats, isHost, onReturn }: EndPanelProps) => (
  <section className="panel end" aria-live="polite">
    <h1>{room.phase === "won" ? "Dawn survived" : "The lantern went dark"}</h1>
    {stats ? (
      <>
        <p>
          Survived {formatTime(stats.survivalSeconds)} · level {stats.teamLevel}
           · fuel {stats.lanternFuel}
        </p>
        <ul className="player-list">
          {stats.players.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.name}</strong>
              <span>{entry.role ?? "-"}</span>
              <span>
                {entry.kills} kills · {entry.revives} revives · {entry.downs}{" "}
                downs
              </span>
            </li>
          ))}
        </ul>
      </>
    ) : (
      <p>The night is over.</p>
    )}
    {isHost && (
      <button onClick={onReturn} type="button">
        Return to the hub
      </button>
    )}
  </section>
);

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};
