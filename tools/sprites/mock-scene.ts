/** In-context mock: tiles + cast + dark overlay + amber lantern glow. */
import type { SpriteDef } from "./catalog";
import { CHAR_HEX } from "./palette";
import { blit, hexRgb, type Raster, rasterize, solid } from "./png";

const mix = (a: number, b: number, t: number): number =>
  Math.round(a + (b - a) * t);

/** In-context mock: tiles + cast + dark overlay + amber lantern glow. */
export const mockScene = (
  groups: Record<string, Record<string, SpriteDef>>,
): Raster => {
  const T = 16;
  const W = 24 * T;
  const H = 15 * T;
  const scene = solid(W, H, CHAR_HEX["D"]!);
  const tiles = Object.values(groups["tiles"] ?? {});
  for (let ty = 0; ty < 15; ty++)
    for (let tx = 0; tx < 24; tx++) {
      const tile = tiles[(tx * 7 + ty * 13) % Math.max(1, tiles.length)]!;
      blit(scene, rasterize(tile.rows), tx * T, ty * T);
    }
  const put = (group: string, name: string, px: number, py: number): void => {
    const spriteDef = groups[group]?.[name];
    if (!spriteDef) return;
    const r = rasterize(spriteDef.rows);
    blit(
      scene,
      r,
      Math.round(px - spriteDef.anchorX),
      Math.round(py - spriteDef.anchorY),
    );
  };
  put("props", "campfire", 5 * T, 9 * T);
  put("props", "signpost", 18 * T, 4 * T);
  put("props", "dummy", 15 * T, 10 * T);
  put("constructs", "wall", 9 * T, 8 * T);
  put("constructs", "turret_S", 13 * T, 8 * T);
  put("lantern", "lantern_full", 12 * T, 7 * T);
  put("roles", "builder_idle", 10 * T, 9 * T);
  put("roles", "medic_idle", 14 * T, 9 * T);
  put("roles", "striker_idle", 8 * T, 11 * T);
  put("roles", "scout_idle", 16 * T, 11 * T);
  put("roles", "keeper_idle", 11 * T, 12 * T);
  put("roles", "lumen_idle", 13 * T, 12 * T);
  put("enemies", "swarmer_idle", 5 * T, 6 * T);
  put("enemies", "chaser_idle", 19 * T, 8 * T);
  put("enemies", "ranged_idle", 20 * T, 5 * T);
  put("enemies", "tank_idle", 17 * T, 12 * T);
  put("fx", "ring_1", 5 * T, 6 * T);
  put("fx", "shard", 11 * T, 10 * T);
  // Lantern glow: warm lift near the lamp, then the night closes in.
  const lampX = 12 * T;
  const lampY = 7 * T;
  const [ar, ag, ab] = hexRgb(CHAR_HEX["A"]!);
  const [ir, ig, ib] = hexRgb(CHAR_HEX["K"]!);
  const R = 9 * T;
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const d = Math.hypot(px - lampX, py - lampY);
      const o = (py * W + px) * 4;
      if (d < R) {
        const t = (1 - d / R) * 0.5;
        scene.pixels[o] = mix(scene.pixels[o]!, ar, t);
        scene.pixels[o + 1] = mix(scene.pixels[o + 1]!, ag, t);
        scene.pixels[o + 2] = mix(scene.pixels[o + 2]!, ab, t);
      } else {
        const t = Math.min(0.62, (d - R) / (R * 1.5));
        scene.pixels[o] = mix(scene.pixels[o]!, ir, t);
        scene.pixels[o + 1] = mix(scene.pixels[o + 1]!, ig, t);
        scene.pixels[o + 2] = mix(scene.pixels[o + 2]!, ib, t);
      }
    }
  return scene;
};
