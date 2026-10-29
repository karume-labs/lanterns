/**
 * Player builds, 16-wide family. Walls are stone with an amber ward rune
 * (friendly at a glance); turrets are a slate base plus a barrel drawn per
 * facing so the client can swap - not rotate - the barrel to its aim.
 */
export const WALL_IDLE = [
  "KKKKKKKKKKKKKKKK",
  "KSSQQSSQQSSQQSSK",
  "KSQSQSQQSQSQQSSK",
  "KSSQQSSQQSSQQSSK",
  "KQQSSQQASSQQSSQK",
  "KSSQQSQAQAQSSQSK",
  "KQQSSQQASSQQSSQK",
  "KSSQQSSQQSSQQSSK",
  "KSQSQSQQSQSQQSSK",
  "KKKKKKKKKKKKKKKK",
] as const;

export const WALL_HURT = [
  "KKKKKKKKKKKKKKKK",
  "KSSQQSSQQSSQQSSK",
  "KSQSQSQQSQSQ.SSK",
  "KSSQQSSQQSSQ.SSK",
  "KQQSSQQA.SQQSSQK",
  "KSSQQSQ..AQSSQSK",
  "KQQSSQQA.SQQSSQK",
  "KSSQQSSQ.SSQQSSK",
  "KSQSQSQQSQSQQSSK",
  "KKKKKKKKKKKKKKKK",
] as const;

export const TURRET_BASE = [
  ".....KKKK.....",
  "....KSSSSK....",
  "...KSSQQSSK...",
  "...KSQAQSSK...",
  "..KSSQQSSSSK..",
  "..KSSSSSSSK...",
  ".KKKKKKKKKKK..",
] as const;

/** Barrel muzzles: south, east, north, west. Mount row aligns to base top. */
export const TURRET_BARRELS: Record<string, readonly string[]> = {
  S: ["......AA......", "......EE......", "......KK......"],
  E: ["..............", "......AAKKKKKK", "......EE...W.."],
  N: ["......KK......", "......EE......", "......AA......"],
  W: ["..............", "KKKKKKAA......", "..W...EE......"],
};
