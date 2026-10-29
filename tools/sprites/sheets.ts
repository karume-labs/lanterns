/**
 * Sprite pipeline: pack every catalog frame into apps/client/public/sprites/atlas.png,
 * write the atlas.json manifest, and render contact sheets (8x + 1x, before
 * vs after) plus an in-context mock (grass + dark + lantern glow).
 *
 *   contact sheets for build-sprites.ts
 */
import {
  DUMMY_ART,
  ENEMY_ART,
  LANTERN_ART,
  PLAYER_ART,
  TURRET_ART,
  WALL_ART,
} from "../../apps/client/src/game/art";
import type { SpriteDef } from "./catalog";
import { blit, type Raster, rasterize, solid } from "./png";

/** Contact sheet: every sprite in catalog order, left-to-right at scale. */
export let indexLines: string[] = [];

export const sheet = (
  groups: Record<string, Record<string, SpriteDef>>,
  scale: number,
  bg: string,
  sheetWidth = 480,
): Raster => {
  const GAP = 4;
  // Measure first so the canvas fits.
  let cx = GAP;
  let cy = GAP;
  let lineH = 0;
  let totalH = GAP;
  const sizes: { w: number; h: number }[] = [];
  for (const frames of Object.values(groups))
    for (const spriteDef of Object.values(frames)) {
      const r = rasterize(spriteDef.rows);
      const w = r.width * scale;
      const h = r.height * scale;
      sizes.push({ w, h });
      if (cx + w + GAP > sheetWidth) {
        cx = GAP;
        totalH += lineH + GAP;
        lineH = 0;
      }
      cx += w + GAP;
      lineH = Math.max(lineH, h);
    }
  totalH += lineH + GAP;
  const canvas = solid(sheetWidth, totalH, bg);
  // Draw in the same order; index.txt maps cells to names.
  const order: string[] = [];
  let i = 0;
  cx = GAP;
  cy = GAP;
  lineH = 0;
  for (const [group, frames] of Object.entries(groups))
    for (const [name, spriteDef] of Object.entries(frames)) {
      const r = rasterize(spriteDef.rows);
      const size = sizes[i] ?? { w: 0, h: 0 };
      i += 1;
      if (cx + size.w + GAP > sheetWidth) {
        cx = GAP;
        cy += lineH + GAP;
        lineH = 0;
      }
      blit(canvas, r, cx, cy, scale);
      order.push(`${group}/${name} @${cx},${cy} ${size.w}x${size.h}`);
      cx += size.w + GAP;
      lineH = Math.max(lineH, size.h);
    }
  indexLines = order;
  return canvas;
};

/**
 * Before sheet: the current in-game code art translated into the sprite
 * palette (old keys: 0 outline, c body color, w white glint, e/E ember and
 * lantern tones, g glass, m mortar, b brick, d dummy straw).
 */
const BEFORE_MAP: Record<string, string> = {
  "0": "K",
  c: "T",
  w: "W",
  e: "F",
  E: "A",
  g: "Q",
  m: "S",
  b: "S",
  d: "O",
};

const beforeRows = (rows: readonly string[], body: string): string[] =>
  rows.map((row) =>
    [...row]
      .map((ch) => (ch === "c" ? body : (BEFORE_MAP[ch] ?? ".")))
      .join(""),
  );

export const beforeGroups = (): Record<string, Record<string, SpriteDef>> => {
  return {
    players: {
      knight: { rows: beforeRows(PLAYER_ART, "T"), anchorX: 5, anchorY: 11 },
    },
    lantern: {
      lamp: { rows: beforeRows(LANTERN_ART, "T"), anchorX: 3, anchorY: 8 },
    },
    enemies: Object.fromEntries(
      Object.entries(ENEMY_ART).map(([kind, rows]) => [
        kind,
        { rows: beforeRows(rows, "M"), anchorX: 5, anchorY: 8 },
      ]),
    ),
    constructs: {
      wall: { rows: beforeRows(WALL_ART, "T"), anchorX: 4, anchorY: 5 },
      turret: { rows: beforeRows(TURRET_ART, "T"), anchorX: 3, anchorY: 5 },
      dummy: { rows: beforeRows(DUMMY_ART, "T"), anchorX: 4, anchorY: 8 },
    },
  };
};
