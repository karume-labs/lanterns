import type { Role } from "@lanterns/domain";
import { useAppStore } from "../../app/store";
import { getSocket } from "../../net/connection";

const ROLE_LABEL: Record<string, string> = {
  builder: "Builder",
  medic: "Medic",
  striker: "Striker",
  scout: "Scout",
  keeper: "Keeper",
  lumen: "Lumen",
};

/** Crew list: name, role chip, ready check, host crown mark. */
export const PlayerList = () => {
  const room = useAppStore((state) => state.room);
  const playerId = useAppStore((state) => state.playerId);
  if (!room) return null;
  return (
    <ul className="crew-list">
      {room.players.map((player) => {
        const role = player.role as Role | null;
        return (
          <li key={player.id}>
            <span
              aria-hidden="true"
              className="role-glyph"
              style={{
                background: role ? undefined : "transparent",
              }}
              data-role={role ?? "none"}
            />
            <strong>{player.name}</strong>
            <span className="crew-role">
              {role ? (ROLE_LABEL[role] ?? role) : "no color yet"}
            </span>
            <span className={`crew-ready ${player.ready ? "yes" : ""}`}>
              {!player.connected
                ? "away"
                : player.ready
                  ? "ready"
                  : "not ready"}
            </span>
            {player.id === room.hostId && (
              <span aria-label="host" className="crew-host" role="img">
                HOST
              </span>
            )}
            {player.id === playerId && <span className="crew-you">you</span>}
          </li>
        );
      })}
    </ul>
  );
};

/** "Light the lantern" host force-start; everyone else sees a hint. */
export const StartHint = () => {
  const room = useAppStore((state) => state.room);
  const playerId = useAppStore((state) => state.playerId);
  if (room?.phase !== "lobby") return null;
  if (room.hostId === playerId)
    return (
      <button
        className="secondary start-hint"
        onClick={() => getSocket()?.startMatch()}
        type="button"
      >
        Light the lantern
      </button>
    );
  return (
    <p className="start-hint">Waiting for the host to light the lantern…</p>
  );
};
