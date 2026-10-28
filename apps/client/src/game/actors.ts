import {
  HUB_DUMMY,
  PLAYER_FLAG,
  ROLES_TABLE,
  type Role,
} from "@lanterns/domain";
import type { Graphics } from "pixi.js";
import { DUMMY_ART, PLAYER_ART } from "./art";
import { COLORS } from "./config";
import { drawPixels } from "./pixels";

const roleCache = new Map<Role, number>();

const toHex = (value: string): number =>
  Number.parseInt(value.replace(/^#/, ""), 16);

/** Palette colors for each role, parsed once from the domain table. */
export const roleColor = (role: Role | null): number => {
  if (!role) return COLORS.neutral;
  const cached = roleCache.get(role);
  if (cached !== undefined) return cached;
  const parsed = toHex(ROLES_TABLE[role].color);
  roleCache.set(role, parsed);
  return parsed;
};

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
  drawPixels(
    g,
    x,
    y,
    PLAYER_ART,
    { "0": COLORS.night, c: body, w: 0xffffff },
    4,
  );
  g.moveTo(x, y)
    .lineTo(x + Math.cos(radians) * 26, y + Math.sin(radians) * 26)
    .stroke({ width: 2, color: COLORS.night, alpha });
  if (downed)
    g.circle(x, y, 24).stroke({ width: 1, color: COLORS.ember, alpha: 0.9 });
};

export const drawDummy = (g: Graphics, hpRatio: number): void => {
  const { x, y } = HUB_DUMMY;
  drawPixels(
    g,
    x,
    y,
    DUMMY_ART,
    { "0": COLORS.night, m: COLORS.moon, w: COLORS.ember, d: COLORS.twilight },
    4,
  );
  g.rect(x - 16, y - 30, 32, 4).fill({ color: COLORS.ink });
  g.rect(x - 16, y - 30, 32 * hpRatio, 4).fill({ color: COLORS.moss });
};
