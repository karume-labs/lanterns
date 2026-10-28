import { ROLE_ORDER, ROLES_TABLE, type Role } from "@lanterns/domain";
import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";
import { getSocket } from "../../net/connection";

interface CardView {
  id: string;
  label: string;
  color: string;
  pitch: string;
  ability: string;
  available: boolean;
}

const buildCards = (): CardView[] =>
  ROLE_ORDER.map((id) => {
    const def = ROLES_TABLE[id];
    return {
      id,
      label: def.label,
      color: def.color,
      pitch: def.pitch,
      ability: `${def.abilityName} - ${def.abilityDesc}`,
      available: true,
    };
  });

export const RoleGlyph = ({ role }: { role: Role | null }) => (
  <span
    aria-hidden="true"
    className={`role-glyph role-${role ?? "none"}`}
    style={{ background: role ? ROLES_TABLE[role]?.color : undefined }}
  />
);

interface RolePickerProps {
  onClose: () => void;
}

/** Six role cards with icon, pitch, ability, and Taken hints. */
export const RolePicker = ({ onClose }: RolePickerProps) => {
  const room = useAppStore((state) => state.room);
  const playerId = useAppStore((state) => state.playerId);
  const taken = new Set(
    (room?.players ?? [])
      .filter((player) => player.id !== playerId)
      .map((player) => player.role)
      .filter((role): role is Role => role !== null),
  );
  const mine = room?.players.find((player) => player.id === playerId)?.role;

  const pick = (card: CardView): void => {
    if (!card.available) return;
    getSocket()?.selectRole(card.id as Role);
    // Stay open: picking readies you up, and the countdown shows on top so
    // you can watch it run while the rack is still in front of you. The
    // picker closes itself when the match takes over the screen.
  };

  return (
    <Panel className="role-picker">
      <h2>Pick your color</h2>
      <div className="role-cards">
        {buildCards().map((card) => (
          <button
            aria-pressed={mine === card.id}
            className={`role-card${mine === card.id ? " selected" : ""}`}
            disabled={!card.available}
            key={card.id}
            onClick={() => pick(card)}
            type="button"
          >
            <span className="role-card-head">
              <span
                aria-hidden="true"
                className="role-glyph"
                style={{
                  background: card.available ? card.color : "transparent",
                }}
              />
              <strong>{card.label}</strong>
              {taken.has(card.id as Role) && <em className="taken">Taken</em>}
            </span>
            <span className="role-card-pitch">{card.pitch}</span>
            <span className="role-card-ability">{card.ability}</span>
          </button>
        ))}
      </div>
      <button className="secondary" onClick={onClose} type="button">
        Close
      </button>
    </Panel>
  );
};
