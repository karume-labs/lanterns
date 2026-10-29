import { Howl } from "howler";
import {
  getIntensity,
  isNightAudible,
  isUnlocked,
  setIntensityValue,
  setNightAudibleFlag,
  volumeOf,
} from "./audio-state";

const MUSIC_BASE = 0.6;
const NIGHT_BASE = 0.22;

/** Calm theme: the lead voice. The battle stem crossfades in over it. */
const music = new Howl({
  src: ["/audio/music/lanterns.mp3"],
  loop: true,
  volume: MUSIC_BASE,
});

/** Same hook driven harder; silent until danger rises. */
const battle = new Howl({
  src: ["/audio/music/lanterns-battle.mp3"],
  loop: true,
  volume: 0,
});

/** Night bed: quiet air UNDER the music, never over it. */
const night = new Howl({
  src: ["/audio/music/night.mp3"],
  loop: true,
  volume: 0,
});

/** Blend calm -> battle as the night gets dangerous. */
export const setMusicIntensity = (next: number): void => {
  const clamped = Math.max(0, Math.min(1, next));
  if (Math.abs(clamped - getIntensity()) < 0.02) return;
  setIntensityValue(clamped);
  if (!isUnlocked()) return;
  const base = MUSIC_BASE * volumeOf.music;
  music.volume(base * (1 - 0.45 * clamped));
  if (!battle.playing()) battle.play();
  battle.volume(base * 0.9 * clamped);
};

/** Difficulty from 0..1: elapsed share blended with live enemy pressure. */
export const intensityFor = (
  elapsedSeconds: number,
  durationSeconds: number,
  enemies: number,
): number => {
  const time = Math.max(
    0,
    Math.min(1, elapsedSeconds / Math.max(1, durationSeconds)),
  );
  const pressure = Math.max(0, Math.min(1, enemies / 24));
  return Math.max(0, Math.min(1, time * 0.7 + pressure * 0.5));
};

/** Refresh loop gains from the current bus levels. */
export const refreshLoopVolumes = (): void => {
  const intensity = getIntensity();
  const base = MUSIC_BASE * volumeOf.music;
  if (music.playing()) music.volume(base * (1 - 0.45 * intensity));
  if (battle.playing()) battle.volume(base * 0.9 * intensity);
  if (night.playing()) night.volume(NIGHT_BASE * volumeOf.ambience);
};

/** Night ambience only belongs in the room: hub and match, never the menu. */
export const setNightAudible = (on: boolean): void => {
  setNightAudibleFlag(on);
  if (!isUnlocked() || !night.playing()) return;
  const target = on ? NIGHT_BASE * volumeOf.ambience : 0;
  night.fade(night.volume(), target, 800);
};

/** Start every loop after the first user gesture. */
export const playLoops = (): void => {
  music.play();
  battle.play();
  battle.volume(0);
  night.play();
  night.volume(isNightAudible() ? NIGHT_BASE * volumeOf.ambience : 0);
};
