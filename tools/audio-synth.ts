/**
 * Shared synthesis primitives for `tools/gen-audio.ts`: oscillators, noise,
 * a mixer, and a WAV writer. Everything is original signal generation.
 */
export const SR = 44100;

export type Wave = "sin" | "sq" | "saw" | "tri";

export const tone = (
  dur: number,
  f0: number,
  f1: number,
  wave: Wave,
  decay: number,
  gain = 1,
): Float32Array => {
  const n = Math.ceil(dur * SR);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    phase += (f0 + (f1 - f0) * (t / dur)) / SR;
    const p = phase % 1;
    const v =
      wave === "sq"
        ? p < 0.5
          ? 1
          : -1
        : wave === "saw"
          ? 2 * p - 1
          : wave === "tri"
            ? 4 * Math.abs(p - 0.5) - 1
            : Math.sin(2 * Math.PI * phase);
    out[i] = v * Math.exp(-t * decay) * gain;
  }
  return out;
};

export const noise = (dur: number, decay: number, gain = 1): Float32Array => {
  const n = Math.ceil(dur * SR);
  const out = new Float32Array(n);
  let seed = 1337;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    out[i] = ((seed / 0xffffffff) * 2 - 1) * Math.exp(-(i / SR) * decay) * gain;
  }
  return out;
};

export const mix = (
  dur: number,
  parts: readonly [Float32Array, number][],
): Float32Array => {
  const out = new Float32Array(Math.ceil(dur * SR));
  for (const [src, at] of parts) {
    const off = Math.round(at * SR);
    for (let i = 0; i < src.length && off + i < out.length; i++)
      out[off + i] += src[i] ?? 0;
  }
  return out;
};

/** Encode a WAV to mp3 with ffmpeg; throws with stderr on failure. */
export const encodeMp3 = (input: string, output: string): void => {
  const proc = Bun.spawnSync([
    "ffmpeg",
    "-y",
    "-loglevel",
    "error",
    "-i",
    input,
    "-c:a",
    "libmp3lame",
    "-q:a",
    "5",
    output,
  ]);
  if (proc.exitCode !== 0)
    throw new Error(`ffmpeg failed for ${output}: ${proc.stderr.toString()}`);
};

/** Write 16-bit mono PCM WAV bytes. */
export const wav = (path: string, samples: Float32Array): void => {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const str = (o: number, s: string): void => {
    s.split("").forEach((c, i) => {
      view.setUint8(o + i, c.charCodeAt(0));
    });
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SR, true);
  view.setUint32(28, SR * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++)
    view.setInt16(
      44 + i * 2,
      Math.max(-1, Math.min(1, samples[i])) * 32767,
      true,
    );
  Bun.write(path, bytes);
};
