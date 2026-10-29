/**
 * Regenerate every sound the game plays: original synthesis, no samples.
 *
 *   bun tools/gen-audio.ts
 *
 * Short SFX stay WAV (mp3 encoder padding would smear tight clicks); the long
 * loops are encoded to mp3 with ffmpeg. Output lands in apps/client/public/audio.
 *
 * Loops: `lanterns.mp3` (catchy calm theme), `lanterns-battle.mp3` (same
 * motif driven harder - the client crossfades toward it as the night gets
 * dangerous), and `night.mp3` (a quiet wind bed that sits UNDER the music).
 */

import { encodeMp3, mix, noise, tone, wav } from "./audio-synth";
import { battle, music, night } from "./audio-tracks";

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

for (const [name, samples] of Object.entries(sfx))
  await wav(`${OUT}/sfx/${name}.wav`, samples);
await wav("/tmp/lanterns-music.wav", music());
await wav("/tmp/lanterns-battle.wav", battle());
await wav("/tmp/lanterns-night.wav", night());
encodeMp3("/tmp/lanterns-music.wav", `${OUT}/music/lanterns.mp3`);
encodeMp3("/tmp/lanterns-battle.wav", `${OUT}/music/lanterns-battle.mp3`);
encodeMp3("/tmp/lanterns-night.wav", `${OUT}/music/night.mp3`);
console.log(`wrote ${Object.keys(sfx).length} sfx + 3 loops to ${OUT}`);
