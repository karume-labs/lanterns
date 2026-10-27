/**
 * Audio engine entry: unlock gate + bus scaffolding. The full manifest,
 * music state machine, and voice caps land in the audio pass; features only
 * ever call these helpers, so no screen ever plays a sound directly.
 */
let unlocked = false;
const pending: (() => void)[] = [];

export const isAudioUnlocked = (): boolean => unlocked;

export const onAudioUnlock = (fn: () => void): void => {
  if (unlocked) fn();
  else pending.push(fn);
};

/** Call exactly once from the splash gesture (browser autoplay policy). */
export const unlockAudio = (): void => {
  if (unlocked) return;
  unlocked = true;
  for (const fn of pending.splice(0)) fn();
};
