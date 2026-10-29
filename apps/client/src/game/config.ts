/** Internal render resolution; the canvas upscales by whole numbers only. */
export const VIEW_W = 480;
export const VIEW_H = 270;

/** World units per rendered pixel (2 = half-size, crisp pixels). */
export const WORLD_SCALE = 0.5;

/** World units per floor tile at the chosen zoom. */
export const TILE = 32;

/**
 * Render delay behind server time for interpolation. Two 15 Hz snapshot
 * intervals (~67 ms each) so there is always a newer snapshot to blend toward.
 */
export const INTERP_DELAY_MS = 134;

/**
 * Local-player reconciliation: snap hard past this error, ignore routine
 * prediction error entirely (the deadzone), blend in between.
 */
export const RECONCILE_SNAP = 64;
export const RECONCILE_DEADZONE = 20;
export const RECONCILE_BLEND = 0.35;

export const COLORS = {
  night: 0x101628,
  ink: 0x1d2942,
  inkLight: 0x223052,
  twilight: 0x405070,
  moon: 0xa8c4dc,
  lantern: 0xffd166,
  ember: 0xef8354,
  moss: 0x74c69d,
  neutral: 0xa8c4dc,
} as const;

export const VIEW = {
  width: VIEW_W,
  height: VIEW_H,
} as const;

/** Viewport coverage in world units. */
export const VIEW_WORLD = {
  width: VIEW_W / WORLD_SCALE,
  height: VIEW_H / WORLD_SCALE,
} as const;
