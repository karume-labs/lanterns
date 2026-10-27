import {
  type Bounds,
  ENEMIES_TABLE,
  ENEMY_KINDS,
  type Vector2,
} from "@lanterns/domain";
import type { Graphics } from "pixi.js";
import { ENEMY_ART, LANTERN_ART, TURRET_ART, WALL_ART } from "./art";
import { COLORS, TILE } from "./config";
import { drawPixels } from "./pixels";

const hex = (value: number): string => value.toString(16).padStart(6, "0");
const mixHex = (a: number, b: number, t: number): number => {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const blend = (from: number, to: number): number =>
    Math.round(from + (to - from) * t);
  const value = (blend(ar, br) << 16) | (blend(ag, bg) << 8) | blend(ab, bb);
  return Number.parseInt(hex(value), 16);
};

/** Enemy table colors are hex strings; pixel palettes need numbers. */
const toColor = (value: string): number =>
  Number.parseInt(value.replace(/^#/, ""), 16);

export const skyColor = (elapsedSeconds: number, active: boolean): number =>
  active
    ? mixHex(COLORS.night, 0xd8a36a, Math.min(1, elapsedSeconds / 600))
    : COLORS.night;

/** Checkerboard floor for the visible tile range, in world units. */
export const drawTiles = (
  g: Graphics,
  bounds: Bounds,
  topLeft: Vector2,
  viewW: number,
  viewH: number,
): void => {
  const startX = Math.max(0, Math.floor((topLeft.x - TILE) / TILE) * TILE);
  const startY = Math.max(0, Math.floor((topLeft.y - TILE) / TILE) * TILE);
  const endX = Math.min(bounds.width, topLeft.x + viewW + TILE);
  const endY = Math.min(bounds.height, topLeft.y + viewH + TILE);
  for (let x = startX; x < endX; x += TILE)
    for (let y = startY; y < endY; y += TILE) {
      const even = (x / TILE + y / TILE) % 2 === 0;
      g.rect(x, y, TILE, TILE).fill(even ? COLORS.ink : COLORS.inkLight);
    }
  g.rect(0, 0, bounds.width, bounds.height).stroke({
    width: 4,
    color: COLORS.twilight,
  });
};

export const drawLantern = (
  g: Graphics,
  position: Vector2,
  fuelRatio: number,
  lightRadius: number,
): void => {
  g.circle(position.x, position.y, lightRadius).fill({
    color: COLORS.lantern,
    alpha: 0.06,
  });
  drawPixels(
    g,
    position.x,
    position.y,
    LANTERN_ART,
    {
      "0": COLORS.night,
      e: COLORS.ember,
      E: COLORS.lantern,
      g: COLORS.twilight,
      w: COLORS.lantern,
    },
    4,
  );
  g.rect(position.x - 24, position.y - 34, 48, 6)
    .fill({ color: COLORS.ink })
    .stroke({ width: 1, color: COLORS.twilight });
  g.rect(position.x - 23, position.y - 33, 46 * fuelRatio, 4).fill({
    color: COLORS.lantern,
  });
};

export const drawEnemies = (g: Graphics, rows: number[][]): void => {
  for (const row of rows) {
    const kind = ENEMY_KINDS[Math.round(row[2] ?? 0)] ?? "swarmer";
    const def = ENEMIES_TABLE[kind];
    const x = row[0] ?? 0;
    const y = row[1] ?? 0;
    const art = ENEMY_ART[kind];
    const scale = Math.max(2, Math.round((def.radius * 2) / art.length));
    drawPixels(
      g,
      x,
      y,
      art,
      { "0": COLORS.night, c: toColor(def.color), w: 0xffffff },
      scale,
    );
    const hpRatio = Math.max(0, (row[3] ?? def.maxHealth) / def.maxHealth);
    if (hpRatio < 1)
      g.rect(x - 10, y - def.radius - 7, 20, 3)
        .fill({ color: COLORS.ink })
        .rect(x - 10, y - def.radius - 7, 20 * hpRatio, 3)
        .fill({ color: COLORS.ember });
  }
};

export const drawConstructs = (g: Graphics, rows: number[][]): void => {
  for (const row of rows) {
    const wall = Math.round(row[2] ?? 0) === 0;
    const x = Math.round(row[0] ?? 0);
    const y = Math.round(row[1] ?? 0);
    if (wall) {
      drawPixels(g, x, y, WALL_ART, { b: COLORS.twilight, m: COLORS.night }, 4);
    } else {
      // The barrel art points up: turn it to the turret's aim (row[5]).
      const palette = { "0": COLORS.night, c: COLORS.moss };
      const aim = ((row[5] ?? 0) * Math.PI) / 180 + Math.PI / 2;
      drawPixels(g, x, y + 4.5, TURRET_ART.slice(3), palette, 3);
      const cos = Math.cos(aim);
      const sin = Math.sin(aim);
      g.save();
      g.transform(cos, sin, -sin, cos, x, y);
      drawPixels(g, 0, -4.5, TURRET_ART.slice(0, 3), palette, 3);
      g.restore();
    }
  }
};

export const drawShards = (g: Graphics, rows: number[][]): void => {
  for (const row of rows) {
    const x = row[0] ?? 0;
    const y = row[1] ?? 0;
    g.poly([x, y - 6, x + 5, y, x, y + 6, x - 5, y]).fill({
      color: COLORS.lantern,
    });
  }
};
