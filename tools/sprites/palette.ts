/**
 * Single-character palette indices for every sprite grid. Every entry maps
 * to theme/colors.ts - `bun tools/check-palette.ts` fails anything else.
 * "." is transparent; all other pixels are fully opaque.
 */
export const CHAR_HEX: Record<string, string> = {
  // Night (outlines and shading)
  K: "#0b0d1a", // ink - selective outline on dark shapes
  D: "#1a1b3a", // indigo - outline on cool shapes, deep shadow
  V: "#3b2f5e", // dusk violet - hue-shifted shadow
  S: "#5b5f7a", // slate - mid metal/stone
  Q: "#9aa3b8", // fog - light metal, pale glints
  b: "#f2ecd8", // bone - faces, bandages, hot glints
  // Light (the lantern is the brightest object in the game)
  A: "#ffb43a", // lantern amber
  F: "#ff7a1a", // flame orange
  W: "#ffe27a", // warm yellow - flame cores, glints
  E: "#c4402b", // ember red - hot edges, warnings
  // Roles
  T: "#3fd0c9", // builder teal
  G: "#7be36b", // medic green
  R: "#ff4b5c", // striker red
  B: "#6b8cff", // scout blue
  P: "#ff8fd1", // keeper rose
  L: "#c8a2ff", // lumen lavender
  // Enemies
  M: "#7a1f5c", // gloom magenta
  N: "#4f7a2a", // rot green
  U: "#5a3a8a", // shade purple
  C: "#cfc7b0", // bone-pale - fangs, claws
  // Dawn
  Y: "#ff9ec2", // dawn pink
  O: "#ffd27a", // dawn gold
  H: "#5fc7c0", // sky teal
};

/** Characters allowed inside a sprite grid. */
export const gridChars = (rows: readonly string[]): Set<string> => {
  const chars = new Set<string>();
  for (const row of rows) for (const ch of row) chars.add(ch);
  return chars;
};
