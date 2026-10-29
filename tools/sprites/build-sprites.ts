/**
 * Sprite pipeline: pack every catalog frame into apps/client/public/sprites/atlas.png,
 * write the atlas.json manifest, and render contact sheets (8x + 1x, before
 * vs after) plus an in-context mock (grass + dark + lantern glow).
 *
 *   bun tools/sprites/build-sprites.ts
 */
import { catalog, type SpriteDef } from "./catalog";
import { mockScene } from "./mock-scene";
import { blit, encodePng, rasterize, solid } from "./png";
import { beforeGroups, indexLines, sheet } from "./sheets";

const OUT = "apps/client/public/sprites";
const SHEETS = `${OUT}/sheets`;

/** Pack frames in shelves; return placements + atlas raster. */
const pack = (
  frames: [string, SpriteDef][],
): {
  placements: Record<
    string,
    { x: number; y: number; w: number; h: number; ax: number; ay: number }
  >;
  atlas: Raster;
} => {
  const PAD = 2;
  const ATLAS_W = 512;
  let x = PAD;
  let y = PAD;
  let rowH = 0;
  const placements: Record<
    string,
    { x: number; y: number; w: number; h: number; ax: number; ay: number }
  > = {};
  const items = frames.map(([name, spriteDef]) => ({
    name,
    spriteDef,
    raster: rasterize(spriteDef.rows),
  }));
  for (const item of items) {
    const w = item.raster.width;
    const h = item.raster.height;
    if (x + w + PAD > ATLAS_W) {
      x = PAD;
      y += rowH + PAD;
      rowH = 0;
    }
    placements[item.name] = {
      x,
      y,
      w,
      h,
      ax: item.spriteDef.anchorX,
      ay: item.spriteDef.anchorY,
    };
    rowH = Math.max(rowH, h);
    x += w + PAD;
  }
  const atlas = solid(ATLAS_W, y + rowH + PAD, "#000000");
  // Transparent background for the atlas itself.
  atlas.pixels.fill(0);
  for (const item of items) {
    const place = placements[item.name]!;
    blit(atlas, item.raster, place.x, place.y);
  }
  return { placements, atlas };
};

const groups = catalog();
const flat: [string, SpriteDef][] = [];
for (const [group, frames] of Object.entries(groups))
  for (const [name, spriteDef] of Object.entries(frames))
    flat.push([`${group}/${name}`, spriteDef]);

const { placements, atlas } = pack(flat);
await Bun.write(`${OUT}/atlas.png`, encodePng(atlas));

const manifest: Record<string, unknown> = {};
for (const [name, place] of Object.entries(placements)) manifest[name] = place;
await Bun.write(
  `${OUT}/atlas.json`,
  `${JSON.stringify({ frames: manifest }, null, 2)}\n`,
);

const before = beforeGroups();
const after8 = sheet(groups, 8, "#0b0d1a");
await Bun.write(`${SHEETS}/after_8x.png`, encodePng(after8));
await Bun.write(`${SHEETS}/index.txt`, `${indexLines.join("\n")}\n`);
const after1 = sheet(groups, 1, "#1a1b3a");
await Bun.write(`${SHEETS}/after_1x.png`, encodePng(after1));
const before8 = sheet(before, 8, "#0b0d1a");
await Bun.write(`${SHEETS}/before_8x.png`, encodePng(before8));
const mock = mockScene(groups);
await Bun.write(`${SHEETS}/mock.png`, encodePng(mock));
// 1x on grass: readability where it matters.
const grass1x = sheet(
  { tiles: groups["tiles"] ?? {}, enemies: groups["enemies"] ?? {} },
  1,
  "#1a1b3a",
);
await Bun.write(`${SHEETS}/after_1x_grass.png`, encodePng(grass1x));
console.log(`atlas: ${flat.length} frames, manifest + 5 sheets written`);
