import type { Role, RoomState } from "@lanterns/domain";

const ROLE_LABELS: Role[] = ["builder", "medic", "striker", "scout"];

interface LobbyPanelProps {
  room: RoomState;
  isHost: boolean;
  playerId: string | null;
  onSelectRole: (role: Role) => void;
  onStart: () => void;
  onLeave: () => void;
}

export const LobbyPanel = ({
  room,
  isHost,
  playerId,
  onSelectRole,
  onStart,
  onLeave,
}: LobbyPanelProps) => {
  const myRole =
    room.players.find((player) => player.id === playerId)?.role ?? null;
  return (
    <section className="panel lobby" aria-live="polite">
      <h2>
        Room <span className="room-code">{room.code}</span>
      </h2>
      <p>Share this code. Everyone picks a color and steps into the circle.</p>
      <ul className="player-list">
        {room.players.map((player) => (
          <li key={player.id} className={player.ready ? "ready" : ""}>
            <strong>{player.name}</strong>
            <span>{player.role ?? "no color yet"}</span>
            <span>
              {!player.connected
                ? "reconnecting…"
                : player.ready
                  ? "in the circle"
                  : "not ready"}
            </span>
          </li>
        ))}
      </ul>
      <div className="roles">
        {ROLE_LABELS.map((role) => {
          const taken = room.players.some(
            (player) => player.role === role && player.id !== playerId,
          );
          return (
            <button
              key={role}
              className={myRole === role ? "selected" : ""}
              disabled={taken && myRole !== role}
              onClick={() => onSelectRole(role)}
              type="button"
            >
              {role}
            </button>
          );
        })}
      </div>
      <p className="hint">
        {room.phase === "countdown"
          ? "Lantern ignites soon…"
          : "Claim a color, then step into the glowing ready circle together."}
      </p>
      {isHost && room.phase === "lobby" && (
        <button onClick={onStart} type="button">
          Light the lantern
        </button>
      )}
      <button className="secondary" onClick={onLeave} type="button">
        Leave room
      </button>
    </section>
  );
};
