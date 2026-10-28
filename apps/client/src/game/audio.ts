/**
 * Audio engine: one unlock gate, three buses (music, ambience, sfx), mute.
 *
 * Every sound file is original synthesis from `tools/gen-audio.ts`. Howler
 * handles browser autoplay policy; `unlockAudio` also runs from the splash
 * gesture so the music starts with the very first interaction, and a global
 * pointerdown listener covers reloads that land past the splash.
 */
import { Howl, Howler } from "howler";

export type SfxName =
  | "click"
  | "shot"
  | "hit"
  | "die"
  | "down"
  | "revive"
  | "place"
  | "cast"
  | "fuel"
  | "levelup"
  | "count"
  | "ignite"
  | "win"
  | "lose";

const SFX_SRC: Record<SfxName, string> = {
  click: "/audio/sfx/click.wav",
  shot: "/audio/sfx/shot.wav",
  hit: "/audio/sfx/hit.wav",
  die: "/audio/sfx/die.wav",
  down: "/audio/sfx/down.wav",
  revive: "/audio/sfx/revive.wav",
  place: "/audio/sfx/place.wav",
  cast: "/audio/sfx/cast.wav",
  fuel: "/audio/sfx/fuel.wav",
  levelup: "/audio/sfx/levelup.wav",
  count: "/audio/sfx/count.wav",
  ignite: "/audio/sfx/ignite.wav",
  win: "/audio/sfx/win.wav",
  lose: "/audio/sfx/lose.wav",
};

const sfxHowls = new Map<SfxName, Howl>();
const volumeOf = { sfx: 1 };
let unlocked = false;
let nightAudible = false;

const sfxHowl = (name: SfxName): Howl => {
  let howl = sfxHowls.get(name);
  if (!howl) {
    howl = new Howl({ src: [SFX_SRC[name]], preload: true, volume: 1 });
    sfxHowls.set(name, howl);
  }
  return howl;
};

const music = new Howl({
  src: ["/audio/music/lanterns.mp3"],
  loop: true,
  volume: 0.55,
});

const night = new Howl({
  src: ["/audio/music/night.mp3"],
  loop: true,
  volume: 0,
});

/** One-shot sfx on the sfx bus. No-op until the first interaction unlocks. */
export const playSfx = (name: SfxName, gain = 1): void => {
  if (!unlocked) return;
  const howl = sfxHowl(name);
  const id = howl.play();
  howl.volume(Math.max(0, Math.min(1, volumeOf.sfx * gain)), id);
};

/** Mirror the settings screen: mute plus master/music/sfx/ambience. */
export const setAudioSettings = (settings: {
  muted: boolean;
  volumes: { music: number; sfx: number; ambience: number };
}): void => {
  volumeOf.sfx = settings.volumes.sfx;
  Howler.mute(settings.muted);
  Howler.volume(settings.volumes.music);
  if (night.playing()) night.volume(settings.volumes.ambience);
};

/** Night ambience only belongs in the room: hub and match, never the menu. */
export const setNightAudible = (on: boolean): void => {
  if (nightAudible === on) return;
  nightAudible = on;
  if (!unlocked || !night.playing()) return;
  const target = on ? 0.7 : 0;
  night.fade(night.volume(), target, 500);
};

/** Call from the splash gesture; also wired to the first pointerdown. */
export const unlockAudio = (): void => {
  if (unlocked) return;
  unlocked = true;
  void Howler.ctx?.resume?.();
  music.play();
  night.play();
  night.volume(nightAudible ? 0.7 : 0);
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
