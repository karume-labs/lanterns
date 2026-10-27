import { HUB_DUMMY, PLAYER_FLAG, type Role } from "@lanterns/domain";
import type { Graphics } from "pixi.js";
import { DUMMY_ART, PLAYER_ART } from "./art";
import { COLORS } from "./config";
import { drawPixels } from "./pixels";

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
  const body = downed ? COLORS.twilight : color;
  drawPixels(g, x, y, PLAYER_ART, { "0": COLORS.night, c: body }, 3);
  g.moveTo(x, y)
    .lineTo(x + Math.cos(radians) * 16, y + Math.sin(radians) * 16)
    .stroke({ width: 2, color: COLORS.night, alpha });
  if (downed)
    g.circle(x, y, 17).stroke({ width: 1, color: COLORS.ember, alpha: 0.9 });
};

export const drawDummy = (g: Graphics, hpRatio: number): void => {
  const { x, y } = HUB_DUMMY;
  drawPixels(
    g,
    x,
    y,
    DUMMY_ART,
    { "0": COLORS.night, m: COLORS.moon, w: COLORS.ember, d: COLORS.twilight },
    3,
  );
  g.rect(x - 16, y - 30, 32, 4).fill({ color: COLORS.ink });
  g.rect(x - 16, y - 30, 32 * hpRatio, 4).fill({ color: COLORS.moss });
};
