import { inflateSync } from "node:zlib";
import type { Raster } from "./png";

/** Decode a PNG we wrote (8-bit, non-interlaced truecolor+alpha). */
export const decodePng = (bytes: Uint8Array): Raster => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat: number[] = [];
  while (pos < bytes.length) {
    const length = view.getUint32(pos);
    const type = String.fromCharCode(
      bytes[pos + 4] ?? 0,
      bytes[pos + 5] ?? 0,
      bytes[pos + 6] ?? 0,
      bytes[pos + 7] ?? 0,
    );
    if (type === "IHDR") {
      width = view.getUint32(pos + 8);
      height = view.getUint32(pos + 12);
      colorType = bytes[pos + 8 + 9] ?? 0;
    } else if (type === "IDAT") {
      for (let i = 0; i < length; i++) idat.push(bytes[pos + 8 + i] ?? 0);
    }
    pos += 12 + length;
  }
  if (colorType !== 6) throw new Error(`unsupported PNG type ${colorType}`);
  const raw = inflateSync(new Uint8Array(idat));
  const stride = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p] ?? 0;
    p += 1;
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? (pixels[y * stride + x - 4] ?? 0) : 0;
      const b = y > 0 ? (pixels[(y - 1) * stride + x] ?? 0) : 0;
      const c = x >= 4 && y > 0 ? (pixels[(y - 1) * stride + x - 4] ?? 0) : 0;
      const v = raw[p] ?? 0;
      p += 1;
      const out =
        filter === 1
          ? (v + a) & 0xff
          : filter === 2
            ? (v + b) & 0xff
            : filter === 3
              ? (v + ((a + b) >> 1)) & 0xff
              : filter === 4
                ? (v + paeth(a, b, c)) & 0xff
                : v;
      pixels[y * stride + x] = out;
    }
  }
  return { width, height, pixels };
};

const paeth = (a: number, b: number, c: number): number => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
