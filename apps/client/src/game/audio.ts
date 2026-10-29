/**
 * Audio facade: one unlock gate, three buses (music, ambience, sfx), mute.
 * Loops live in audio-music, one-shots in audio-sfx, levels in audio-state.
 *
 * Every sound file is original synthesis from `tools/gen-audio.ts`. Howler
 * handles browser autoplay policy; `unlockAudio` also runs from the splash
 * gesture so the music starts with the very first interaction, and a global
 * pointerdown listener covers reloads that land past the splash.
 */
import { Howler } from "howler";
import { playLoops, refreshLoopVolumes } from "./audio-music";
import { playSfx } from "./audio-sfx";
import { isUnlocked, markUnlocked, volumeOf } from "./audio-state";

export {
  intensityFor,
  setMusicIntensity,
  setNightAudible,
} from "./audio-music";
export { playSfx, type SfxName } from "./audio-sfx";

/** Mirror the settings screen: mute plus master/music/sfx/ambience. */
export const setAudioSettings = (settings: {
  muted: boolean;
  volumes: { music: number; sfx: number; ambience: number };
}): void => {
  volumeOf.music = settings.volumes.music;
  volumeOf.sfx = settings.volumes.sfx;
  volumeOf.ambience = settings.volumes.ambience;
  Howler.mute(settings.muted);
  refreshLoopVolumes();
};

/** Call from the splash gesture; also wired to the first pointerdown. */
export const unlockAudio = (): void => {
  if (isUnlocked()) return;
  markUnlocked();
  void Howler.ctx?.resume?.();
  playLoops();
};

const init = (): void => {
  window.addEventListener("pointerdown", () => unlockAudio(), {
    once: true,
  });
  // Every button in the game gets one quiet tick; sticks stay silent.
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (target?.closest("button")) playSfx("click", 0.6);
  });
};

init();
