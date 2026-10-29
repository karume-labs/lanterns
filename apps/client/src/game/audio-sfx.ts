import { Howl } from "howler";
import { isUnlocked, volumeOf } from "./audio-state";

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

const sfxHowl = (name: SfxName): Howl => {
  let howl = sfxHowls.get(name);
  if (!howl) {
    howl = new Howl({ src: [SFX_SRC[name]], preload: true, volume: 1 });
    sfxHowls.set(name, howl);
  }
  return howl;
};

/** One-shot sfx on the sfx bus. No-op until the first interaction unlocks. */
export const playSfx = (name: SfxName, gain = 1): void => {
  if (!isUnlocked()) return;
  const howl = sfxHowl(name);
  const id = howl.play();
  howl.volume(Math.max(0, Math.min(1, volumeOf.sfx * gain)), id);
};
