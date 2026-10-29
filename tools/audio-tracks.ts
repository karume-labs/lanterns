/**
 * Loop synthesis for Lanterns: the catchy calm theme, its battle layer
 * (same hook and tempo, so the client crossfades cleanly), and the quiet
 * night bed that sits UNDER the music. SFX live in tools/gen-audio.ts.
 */
import { mix, noise, SR, tone } from "./audio-synth";

/** Shared loop helper: place sources at second offsets, then loop-safe fade. */
const loopOut = (bars: number, barSec: number): Float32Array =>
  new Float32Array(bars * barSec * SR);

const finishLoop = (out: Float32Array): Float32Array => {
  const d = Math.round(0.28 * SR);
  for (let i = d; i < out.length; i++) out[i] += (out[i - d] ?? 0) * 0.22;
  const fade = Math.round(0.05 * SR);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] = (out[i] ?? 0) * g;
    out[out.length - 1 - i] = (out[out.length - 1 - i] ?? 0) * g;
  }
  return out;
};

const placeInto =
  (out: Float32Array) =>
  (src: Float32Array, at: number, gain = 1): void => {
    const off = Math.round(at * SR);
    for (let i = 0; i < src.length && off + i < out.length; i++)
      out[off + i] += (src[i] ?? 0) * gain;
  };

const KICK = (): Float32Array => tone(0.16, 120, 42, "sin", 22, 0.8);
const HAT = (gain = 0.1): Float32Array => noise(0.03, 160, gain);

/**
 * Calm theme: the lantern hook. Am - F - C - G over a soft pulse, with a
 * lead motif the player can hum: A C E A | G E D C, answered higher.
 */
const HOOK = [440, 523.25, 659.25, 880, 783.99, 659.25, 587.33, 523.25];
const CHORDS = [220, 174.61, 261.63, 196];

export const music = (): Float32Array => {
  const out = loopOut(8, 2);
  const place = placeInto(out);
  for (let bar = 0; bar < 8; bar++) {
    const root = CHORDS[bar % 4] ?? 220;
    const at = bar * 2;
    place(tone(2, root / 2, root / 2, "sin", 2.5, 0.4), at); // bass
    place(tone(2, root, root, "sin", 1.4, 0.12), at); // pad
    place(tone(2, root * 1.5, root * 1.5, "sin", 1.4, 0.09), at);
    for (let beat = 0; beat < 4; beat++) {
      place(KICK(), at + beat * 0.5, 0.5);
      place(HAT(0.06), at + beat * 0.5 + 0.25);
    }
    const octave = bar % 2 === 0 ? 1 : 2;
    for (let step = 0; step < 4; step++) {
      const note = (HOOK[(bar * 2 + step) % HOOK.length] ?? 440) * octave;
      place(tone(0.34, note, note, "tri", 9, 0.32), at + step * 0.5);
    }
  }
  return finishLoop(out);
};

/**
 * Battle layer: SAME hook and chords at the SAME tempo so the client can
 * crossfade cleanly, but driven - 8th-note bass, 16th hats, snare backbeat,
 * lead up an octave with a harmony third. Danger you can hear coming.
 */
export const battle = (): Float32Array => {
  const out = loopOut(8, 2);
  const place = placeInto(out);
  for (let bar = 0; bar < 8; bar++) {
    const root = CHORDS[bar % 4] ?? 220;
    const at = bar * 2;
    for (let step = 0; step < 8; step++)
      place(tone(0.2, root / 2, root / 2, "saw", 8, 0.3), at + step * 0.25);
    for (let beat = 0; beat < 4; beat++) {
      place(KICK(), at + beat * 0.5, 0.8);
      if (beat % 2 === 1) place(noise(0.09, 40, 0.22), at + beat * 0.5);
    }
    for (let s = 0; s < 8; s++) place(HAT(0.09), at + s * 0.25);
    for (let step = 0; step < 4; step++) {
      const note = (HOOK[(bar * 2 + step) % HOOK.length] ?? 440) * 2;
      place(tone(0.3, note, note, "sq", 10, 0.16), at + step * 0.5);
      place(
        mix(0.3, [[tone(0.3, note * 1.25, note * 1.25, "sq", 10, 0.08), 0]]),
        at + step * 0.5,
      );
    }
  }
  return finishLoop(out);
};

/**
 * Night ambience: a QUIET bed under the music, never over it. Gentle low
 * wind (slow swell, no hiss) plus a few soft cricket pulses.
 */
export const night = (): Float32Array => {
  const dur = 16;
  const out = new Float32Array(dur * SR);
  let seed = 7;
  let lp = 0;
  for (let i = 0; i < out.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff) * 2 - 1;
    lp = lp * 0.992 + white * 0.008;
    out[i] = lp * 1.6 * (0.75 + 0.25 * Math.sin((i / SR) * 0.4));
  }
  for (let c = 0; c < 8; c++) {
    const at = Math.round(((c * 1.93 + 0.7) % dur) * SR);
    for (let p = 0; p < 3; p++) {
      const start = at + p * 900;
      for (let i = 0; i < 500 && start + i < out.length; i++)
        out[start + i] =
          (out[start + i] ?? 0) +
          Math.sin((i / SR) * 2 * Math.PI * 4200) *
            0.012 *
            Math.exp(-(i / SR) * 40);
    }
  }
  return out;
};
