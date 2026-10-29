/**
 * Shared mutable audio state: per-bus levels and the autoplay unlock flag.
 * Music, sfx and ambience modules read through these accessors so the bus
 * mix stays in one place.
 */
export const volumeOf = { music: 0.8, sfx: 1, ambience: 0.7 };

let unlocked = false;
let nightAudible = false;
let intensity = 0;

export const isUnlocked = (): boolean => unlocked;
export const markUnlocked = (): void => {
  unlocked = true;
};

export const isNightAudible = (): boolean => nightAudible;
export const setNightAudibleFlag = (on: boolean): void => {
  nightAudible = on;
};

export const getIntensity = (): number => intensity;
export const setIntensityValue = (next: number): void => {
  intensity = next;
};
