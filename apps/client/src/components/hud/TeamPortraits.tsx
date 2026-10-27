import { PLAYER_FLAG, ROLES_TABLE, type Role } from "@lanterns/domain";
import { useRef } from "react";
import { useAppStore } from "../../app/store";
import { frameRefs } from "../../game/frame-refs";
import { useHudFrame } from "../../hooks/useHudFrame";

/**
 * Top-left crew portraits. The roster comes from room state (rare updates);
 * health numbers and downed flags are written directly each frame.
 */
export const TeamPortraits = () => {
  const room = useAppStore((state) => state.room);
  const container = useRef<HTMLDivElement>(null);

  useHudFrame(() => {
    const current = container.current;
    const snap = frameRefs.snap;
    if (!current) return;
    const rows = snap?.pl ?? [];
    current.querySelectorAll<HTMLElement>("[data-index]").forEach((node) => {
      const index = Number(node.dataset.index);
      const row = rows[index];
      const hp = row?.[3] ?? 0;
      const maxHp = frameRefs.room?.players[index]?.maxHealth ?? 100;
      const downed = ((row?.[5] ?? 0) & PLAYER_FLAG.downed) !== 0;
      const disconnected = ((row?.[5] ?? 0) & PLAYER_FLAG.disconnected) !== 0;
      const hpNode = node.querySelector<HTMLElement>(".portrait-hp");
      if (hpNode) hpNode.textContent = `${Math.max(0, Math.round(hp))}`;
      node.classList.toggle("downed", downed);
      node.classList.toggle("away", disconnected);
      const bar = node.querySelector<HTMLElement>(".portrait-fill");
      if (bar)
        bar.style.width = `${Math.max(0, Math.min(1, hp / maxHp)) * 100}%`;
    });
  });

  // Rebuild only when the roster itself changes.
  if (!room) return null;
  return (
    <div className="portraits" ref={container}>
      {room.players.map((player, index) => {
        const role = player.role as Role | null;
        const def = role ? ROLES_TABLE[role] : undefined;
        return (
          <div className="portrait" data-index={index} key={player.id}>
            <span
              aria-hidden="true"
              className="role-glyph"
              style={{ background: def?.color ?? "transparent" }}
            />
            <span className="portrait-name">{player.name}</span>
            <span className="portrait-hp num">100</span>
            <div className="portrait-track">
              <div className="portrait-fill" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
