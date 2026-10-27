export type ControlScheme = "auto" | "touch" | "kbm";

export interface Settings {
  scheme: ControlScheme;
  joystickSize: number;
  joystickOpacity: number;
  leftHanded: boolean;
  aimAssist: boolean;
  volumes: { master: number; music: number; sfx: number; ambience: number };
  muted: boolean;
  reduceMotion: boolean;
  screenShake: boolean;
  damageNumbers: boolean;
  colorblindSafe: boolean;
  language: "en";
}

export const DEFAULT_SETTINGS: Settings = {
  scheme: "auto",
  joystickSize: 1,
  joystickOpacity: 0.85,
  leftHanded: false,
  aimAssist: true,
  volumes: { master: 1, music: 0.8, sfx: 1, ambience: 0.7 },
  muted: false,
  reduceMotion: false,
  screenShake: true,
  damageNumbers: true,
  colorblindSafe: false,
  language: "en",
};

export const SETTINGS_KEY = "lanterns-settings";

/** Merge a settings patch including the nested volumes object. */
export const mergeSettings = (
  current: Settings,
  patch: Partial<Settings>,
): Settings => ({
  ...current,
  ...patch,
  volumes: { ...current.volumes, ...patch.volumes },
});
