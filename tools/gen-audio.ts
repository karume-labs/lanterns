/**
 * Regenerate every sound the game plays: original synthesis, no samples.
 *
 *   bun tools/gen-audio.ts
 *
 * Short SFX stay WAV (mp3 encoder padding would smear tight clicks); the long
 * loops are encoded to mp3 with ffmpeg. Output lands in apps/client/public/audio.
 */
import { encodeMp3, mix, noise, SR, tone, wav } from "./audio-synth";

const OUT = "apps/client/public/audio";

const sfx: Record<string, Float32Array> = {
  click: mix(0.06, [[tone(0.05, 900, 500, "sq", 60, 0.45), 0]]),
  shot: mix(0.14, [
    [tone(0.12, 700, 180, "saw", 40, 0.5), 0],
    [noise(0.03, 140, 0.3), 0],
  ]),
  hit: mix(0.1, [
    [tone(0.09, 170, 90, "sin", 55, 0.6), 0],
    [noise(0.05, 100, 0.3), 0],
  ]),
  die: mix(0.4, [
    [tone(0.35, 420, 60, "sq", 12, 0.45), 0],
    [noise(0.2, 32, 0.3), 0],
  ]),
  down: mix(0.5, [
    [tone(0.18, 220, 220, "sq", 18, 0.5), 0],
    [tone(0.3, 196, 180, "sq", 9, 0.5), 0.24],
  ]),
  revive: mix(0.5, [
    [tone(0.4, 400, 800, "sin", 8, 0.45), 0],
    [tone(0.35, 600, 1200, "sin", 9, 0.2), 0.06],
  ]),
  place: mix(0.18, [
    [tone(0.16, 130, 70, "sq", 30, 0.7), 0],
    [noise(0.05, 110, 0.3), 0],
  ]),
  cast: mix(0.36, [
    [tone(0.3, 300, 1050, "sin", 10, 0.5), 0],
    [tone(0.3, 450, 1575, "sin", 11, 0.22), 0.05],
  ]),
  fuel: mix(0.16, [[tone(0.14, 900, 1500, "sin", 28, 0.45), 0]]),
  levelup: mix(0.5, [
    [tone(0.2, 523, 523, "tri", 14, 0.45), 0],
    [tone(0.2, 659, 659, "tri", 14, 0.45), 0.11],
    [tone(0.3, 784, 784, "tri", 10, 0.45), 0.22],
  ]),
  count: mix(0.1, [[tone(0.09, 660, 660, "sq", 45, 0.4), 0]]),
  ignite: mix(0.8, [
    [tone(0.7, 220, 220, "sin", 5, 0.3), 0],
    [tone(0.7, 277, 277, "sin", 5, 0.25), 0],
    [tone(0.7, 330, 330, "sin", 5, 0.3), 0],
    [noise(0.4, 7, 0.12), 0],
  ]),
  win: mix(1.1, [
    [tone(0.3, 523, 523, "tri", 9, 0.4), 0],
    [tone(0.3, 659, 659, "tri", 9, 0.4), 0.13],
    [tone(0.4, 784, 784, "tri", 7, 0.4), 0.26],
    [tone(0.6, 1047, 1047, "sin", 5, 0.4), 0.39],
  ]),
  lose: mix(1.1, [
    [tone(0.4, 440, 440, "sin", 7, 0.4), 0],
    [tone(0.4, 349, 349, "sin", 7, 0.4), 0.24],
    [tone(0.6, 262, 250, "sin", 5, 0.4), 0.48],
  ]),
};

/** Menu/lobby loop: Am-F-C-G, plucked arp over bass and a soft pad. */
const music = (): Float32Array => {
  const bars = 8;
  const barSec = 2;
  const chords = [220, 175, 262, 196];
  const out = new Float32Array(bars * barSec * SR);
  const place = (src: Float32Array, at: number, gain = 1): void => {
    const off = Math.round(at * SR);
    for (let i = 0; i < src.length && off + i < out.length; i++)
      out[off + i] += (src[i] ?? 0) * gain;
  };
  for (let bar = 0; bar < bars; bar++) {
    const root = chords[bar % 4];
    const at = bar * barSec;
    place(tone(2, root / 2, root / 2, "sin", 2.5, 0.5), at); // bass
    place(tone(2, root, root, "sin", 1.4, 0.16), at); // pad
    place(tone(2, root * 1.5, root * 1.5, "sin", 1.4, 0.12), at);
    for (let step = 0; step < 8; step++) {
      const note = root * [1, 1.5, 2, 3][(step * 3) % 4];
      place(tone(0.22, note, note, "tri", 16, 0.3), at + step * 0.25);
    }
  }
  // Simple feedback delay for air; fades to zero at the loop point.
  const d = Math.round(0.28 * SR);
  for (let i = d; i < out.length; i++) out[i] += (out[i - d] ?? 0) * 0.32;
  const fade = Math.round(0.05 * SR);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] = (out[i] ?? 0) * g;
    out[out.length - 1 - i] = (out[out.length - 1 - i] ?? 0) * g;
  }
  return out;
};

/** Night ambience loop: low wind plus sparse cricket pulses. */
const night = (): Float32Array => {
  const dur = 12;
  const out = new Float32Array(dur * SR);
  let seed = 7;
  let lp = 0;
  for (let i = 0; i < out.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff) * 2 - 1;
    lp = lp * 0.985 + white * 0.015;
    out[i] = lp * 6 * (0.7 + 0.3 * Math.sin((i / SR) * 0.5));
  }
  for (let c = 0; c < 14; c++) {
    const at = Math.round(((c * 0.83 + 0.4) % dur) * SR);
    for (let p = 0; p < 4; p++) {
      const start = at + p * 400;
      for (let i = 0; i < 600 && start + i < out.length; i++)
        out[start + i] =
          (out[start + i] ?? 0) +
          Math.sin((i / SR) * 2 * Math.PI * 4600) *
            0.05 *
            Math.exp(-(i / SR) * 60);
    }
  }
  return out;
};

for (const [name, samples] of Object.entries(sfx))
  await wav(`${OUT}/sfx/${name}.wav`, samples);
await wav("/tmp/lanterns-music.wav", music());
await wav("/tmp/lanterns-night.wav", night());
encodeMp3("/tmp/lanterns-music.wav", `${OUT}/music/lanterns.mp3`);
encodeMp3("/tmp/lanterns-night.wav", `${OUT}/music/night.mp3`);
console.log(`wrote ${Object.keys(sfx).length} sfx + 2 loops to ${OUT}`);
