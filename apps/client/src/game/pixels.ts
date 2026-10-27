import type { Graphics } from "pixi.js";

/**
 * Draw a pixel grid centered on (x, y). Each row is a string; every character
 * maps to a palette color, and characters missing from the palette (".") stay
 * transparent. Whole-pixel rects keep the look crisp at integer scale.
 */
export const drawPixels = (
  g: Graphics,
  x: number,
  y: number,
  rows: readonly string[],
  palette: Readonly<Record<string, number>>,
  scale: number,
): void => {
  const width = (rows[0]?.length ?? 0) * scale;
  const height = rows.length * scale;
  const left = Math.round(x - width / 2);
  const top = Math.round(y - height / 2);
  rows.forEach((row, rowIndex) => {
    for (let column = 0; column < row.length; column++) {
      const color = palette[row[column]];
      if (color === undefined) continue;
      g.rect(left + column * scale, top + rowIndex * scale, scale, scale).fill(
        color,
      );
    }
  });
};
