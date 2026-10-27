/**
 * Fixed 24-color palette for Lanterns. Every sprite, UI surface, and effect
 * draws from this list; `bun tools/check-palette.ts` enforces it repo-wide.
 * The same values ship as CSS custom properties in `index.css`.
 */
export const PALETTE = {
  // Night
  nightInk: "#0b0d1a",
  indigo: "#1a1b3a",
  duskViolet: "#3b2f5e",
  slate: "#5b5f7a",
  fog: "#9aa3b8",
  bone: "#f2ecd8",
  // Light
  lanternAmber: "#ffb43a",
  flameOrange: "#ff7a1a",
  warmYellow: "#ffe27a",
  emberRed: "#c4402b",
  // Roles
  builderTeal: "#3fd0c9",
  medicGreen: "#7be36b",
  strikerRed: "#ff4b5c",
  scoutBlue: "#6b8cff",
  keeperRose: "#ff8fd1",
  /** 23rd color: sixth role (Lumen) needs its own identity hue. */
  lumenLavender: "#c8a2ff",
  // Enemies
  gloomMagenta: "#7a1f5c",
  rotGreen: "#4f7a2a",
  shadePurple: "#5a3a8a",
  bonePale: "#cfc7b0",
  // Dawn
  dawnPink: "#ff9ec2",
  dawnGold: "#ffd27a",
  skyTeal: "#5fc7c0",
} as const;

export type PaletteName = keyof typeof PALETTE;

export const PALETTE_HEX: ReadonlySet<string> = new Set(
  Object.values(PALETTE).map((value) => value.toLowerCase()),
);

export const ROLE_PALETTE: Record<string, PaletteName> = {
  builder: "builderTeal",
  medic: "medicGreen",
  striker: "strikerRed",
  scout: "scoutBlue",
  keeper: "keeperRose",
  lumen: "lumenLavender",
};

/** CSS custom property name for a palette entry: nightInk -> --night-ink. */
export const cssVarName = (name: PaletteName): string =>
  `--${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
