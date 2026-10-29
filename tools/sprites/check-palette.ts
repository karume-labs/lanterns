/**
 * Palette check: every grid character must be transparent (".") or a key of
 * theme/colors (via tools/sprites/palette), and the exported atlas must
 * contain no semi-transparent pixels.
 *
 *   bun tools/sprites/check-palette.ts
 */
import { catalog } from "./catalog";
import { CHAR_HEX } from "./palette";
import { decodePng } from "./png-decode";

let failures = 0;
for (const [group, frames] of Object.entries(catalog()))
  for (const [name, spriteDef] of Object.entries(frames)) {
    spriteDef.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x] ?? ".";
        if (ch !== "." && CHAR_HEX[ch] === undefined) {
          console.error(`off-palette ${group}/${name} (${x},${y}): ${ch}`);
          failures += 1;
        }
      }
    });
  }

const atlas = await Bun.file("apps/client/public/sprites/atlas.png").bytes();
const raster = decodePng(atlas);
for (let i = 3; i < raster.pixels.length; i += 4) {
  const alpha = raster.pixels[i] ?? 255;
  if (alpha !== 0 && alpha !== 255) {
    console.error(`semi-transparent atlas pixel at byte ${i}: ${alpha}`);
    failures += 1;
    break;
  }
}

if (failures > 0) {
  console.error(`palette check FAILED: ${failures} problem(s)`);
  process.exit(1);
}
console.log("palette check ok: all pixels on-palette, atlas fully opaque");
