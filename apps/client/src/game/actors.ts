import { HUB_DUMMY, PLAYER_FLAG, type Role } from "@lanterns/domain";
import type { Graphics } from "pixi.js";
import { COLORS } from "./config";

const ROLE_COLORS: Record<Role, number> = {
  builder: 0x5bc0eb,
  medic: 0xf284b6,
  striker: 0xf95738,
  scout: 0xb8de6f,
};

export const roleColor = (role: Role | null): number =>
  role ? ROLE_COLORS[role] : COLORS.neutral;

export const drawPlayer = (
  g: Graphics,
  x: number,
  y: number,
  aimDeg: number,
  color: number,
  flags: number,
): void => {
  const downed = (flags & PLAYER_FLAG.downed) !== 0;
  const idle = (flags & PLAYER_FLAG.disconnected) !== 0;
  const radians = (aimDeg * Math.PI) / 180;
  const alpha = idle ? 0.4 : 1;
  g.circle(x, y, 12)
    .fill({ color: downed ? COLORS.twilight : color, alpha })
    .stroke({ width: 2, color: COLORS.night, alpha });
  g.moveTo(x, y)
    .lineTo(x + Math.cos(radians) * 16, y + Math.sin(radians) * 16)
    .stroke({ width: 2, color: COLORS.night, alpha });
};

export const drawDummy = (g: Graphics, hpRatio: number): void => {
  const x = HUB_DUMMY.x;
  const y = HUB_DUMMY.y;
  g.circle(x, y, 22)
    .fill({ color: hpRatio > 0 ? COLORS.twilight : COLORS.ink })
    .stroke({ width: 2, color: COLORS.moon });
  g.rect(x - 16, y - 30, 32, 4).fill({ color: COLORS.ink });
  g.rect(x - 16, y - 30, 32 * hpRatio, 4).fill({ color: COLORS.moss });
};
