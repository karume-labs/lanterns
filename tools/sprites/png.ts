import { deflateSync } from "node:zlib";
import { CHAR_HEX } from "./palette";

/** Parse #rrggbb into [r, g, b]. */
export const hexRgb = (hex: string): [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

export interface Raster {
  width: number;
  height: number;
  /** RGBA bytes, row-major. */
  pixels: Uint8Array;
}

/** Rasterize a grid: unknown chars (".") stay transparent, rest opaque. */
export const rasterize = (rows: readonly string[]): Raster => {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const pixels = new Uint8Array(width * height * 4);
  rows.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const hex = CHAR_HEX[row[x] ?? "."] ?? CHAR_HEX["."] ?? null;
      if (hex === null || hex === undefined) continue;
      const [r, g, b] = hexRgb(hex);
      const o = (y * width + x) * 4;
      pixels[o] = r;
      pixels[o + 1] = g;
      pixels[o + 2] = b;
      pixels[o + 3] = 255;
    }
  });
  return { width, height, pixels };
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc = (bytes: Uint8Array): number => {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Uint8Array): Uint8Array => {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const check = new Uint8Array(4 + data.length);
  check.set(out.subarray(4, 8 + data.length));
  view.setUint32(8 + data.length, crc(check));
  return out;
};

/** Encode an RGBA raster as a PNG (color type 6, 8-bit). */
export const encodePng = (raster: Raster): Uint8Array => {
  const raw = new Uint8Array((raster.width * 4 + 1) * raster.height);
  for (let y = 0; y < raster.height; y++) {
    raw[y * (raster.width * 4 + 1)] = 0;
    raw.set(
      raster.pixels.subarray(y * raster.width * 4, (y + 1) * raster.width * 4),
      y * (raster.width * 4 + 1) + 1,
    );
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, raster.width);
  view.setUint32(4, raster.height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", new Uint8Array(0)),
  ];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

/** Blit src onto dst at integer pixels. */
export const blit = (
  dst: Raster,
  src: Raster,
  dx: number,
  dy: number,
  scale = 1,
): void => {
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++) {
      const alpha = src.pixels[(y * src.width + x) * 4 + 3] ?? 0;
      if (alpha === 0) continue;
      for (let sy = 0; sy < scale; sy++)
        for (let sx = 0; sx < scale; sx++) {
          const px = dx + x * scale + sx;
          const py = dy + y * scale + sy;
          if (px < 0 || py < 0 || px >= dst.width || py >= dst.height) continue;
          const o = (py * dst.width + px) * 4;
          const s = (y * src.width + x) * 4;
          dst.pixels[o] = src.pixels[s] ?? 0;
          dst.pixels[o + 1] = src.pixels[s + 1] ?? 0;
          dst.pixels[o + 2] = src.pixels[s + 2] ?? 0;
          dst.pixels[o + 3] = 255;
        }
    }
};

/** Solid-background raster for sheets and mock scenes. */
export const solid = (width: number, height: number, hex: string): Raster => {
  const [r, g, b] = hexRgb(hex);
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = 255;
  }
  return { width, height, pixels };
};
