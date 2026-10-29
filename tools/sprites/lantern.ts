/**
 * The lantern: 12x17, brightest and warmest object in the game.
 * Eight fuel states read at 1x by flame height + halo width + color ramp:
 * full / 75 / 50 / 25 / flicker / low / out / dawn. The base sits on the
 * same bottom row in every frame; the cap never moves.
 */
export const LANTERN_W = 12;
export const LANTERN_H = 17;

const CAP = [
  ".....KK.....",
  ".....KA.....",
  "....KAAK....",
  "....KAAK....",
] as const;

const frame = (
  halo: readonly string[],
  flame: readonly string[],
  glass: string,
  baseLit: boolean,
): readonly string[] => {
  const base = baseLit
    ? ["...KKKKK....", "..KAAAAAK...", "..KAAAAAK...", "...KKKKK...."]
    : ["...KKKKK....", "..KDDDDDK...", "..KDDDDDK...", "...KKKKK...."];
  return [...halo, ...CAP, ...flame, glass, ...base];
};

/** Faint halo rows above the cap (transparent "." everywhere else). */
const haloFull = ["...W....W...", "...W....W..."] as const;
const haloMid = ["............", "...W....W..."] as const;
const haloSmall = ["............", "............"] as const;

export const LANTERN_FRAMES: Record<string, readonly string[]> = {
  /** Tall twin flame, wide halo: unmistakable at any distance. */
  full: frame(
    haloFull,
    [
      ".....WW.....",
      "....WAAW....",
      "...WAFFAW...",
      "...WAFFAW...",
      "....WAFAW...",
      ".....FF.....",
    ],
    "..KAAAAAAK..",
    true,
  ),
  "fuel-75": frame(
    haloMid,
    [
      "............",
      ".....WW.....",
      "....WAAW....",
      "...WAFFAW...",
      "....WAFAW...",
      ".....FF.....",
    ],
    "..KAAAAAAK..",
    true,
  ),
  "fuel-50": frame(
    haloSmall,
    [
      "............",
      "............",
      ".....WW.....",
      "....WAAW....",
      "...WAFFAW...",
      ".....FF.....",
    ],
    "..KAAEAAAK..",
    true,
  ),
  "fuel-25": frame(
    haloSmall,
    [
      "............",
      "............",
      "............",
      ".....WW.....",
      "....WFFW....",
      ".....FE.....",
    ],
    "..KAAEAAAK..",
    true,
  ),
  /** Leaning flame: the lantern is struggling. */
  flicker: frame(
    haloSmall,
    [
      "............",
      "............",
      "......WW....",
      ".....WFFW...",
      "....WFEF....",
      ".....FE.....",
    ],
    "..KAEEAAAK..",
    true,
  ),
  /** One ember left, halo gone. */
  low: frame(
    haloSmall,
    [
      "............",
      "............",
      "............",
      "............",
      ".....EE.....",
      ".....EE.....",
    ],
    "..KDEEDDK...",
    false,
  ),
  /** Cold iron: dark glass, no light at all. */
  out: frame(
    haloSmall,
    [
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
    ],
    "..KDDDDDK...",
    false,
  ),
  /** Dawn flare: the saved sunrise burns dawn-gold and pink. */
  dawn: frame(
    haloFull,
    [
      ".....OO.....",
      "....OOYY....",
      "...OYWWYO...",
      "...OYWWYO...",
      "....OYYO....",
      ".....OO.....",
    ],
    "..KOOOOOOK..",
    true,
  ),
};
