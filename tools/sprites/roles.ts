import { BUILDER, ROLE_BASES, ROLE_COLOR } from "./role-bases";

const sub = (rows: readonly string[], role: string): string[] =>
  rows.map((row) => row.replaceAll("c", role));

/** Feet-only stride: contact (wide) vs passing (together), row 15 planted. */
const stride = (base: string[], wide: boolean, role: string): string[] => {
  const out = [...base];
  // Rows 13-14 are the stride rows; row 15 (boots) stays planted.
  const legs = wide ? ".....cc..cc....." : "......cccc......";
  out[13] = legs.replaceAll("c", role);
  out[14] = legs.replaceAll("c", role);
  return out;
};

/** Attack hit frame: spell-swing arc on the right, hand raised. */
const attackFrame = (base: string[], role: string): string[] => {
  const out = [...base];
  out[5] = `${out[5]?.slice(0, 12)}${role}${out[5]?.slice(13) ?? ""}`;
  out[6] = `${out[6]?.slice(0, 12) ?? ""}${role}${role}${out[6]?.slice(14) ?? ""}`;
  out[7] = `${out[7]?.slice(0, 13) ?? ""}W${out[7]?.slice(14) ?? ""}`;
  return out;
};

/** Down frame: X eyes, sprawled boots, charm dimmed to slate. */
const downFrame = (base: string[], role: string): string[] => {
  const out = [...base].map((row) =>
    row.replaceAll("W", "S").replaceAll(role, role),
  );
  out[4] = "....bEbEEb....".slice(0, 16).padEnd(16, ".");
  out[15] = "...KKK....KKK...";
  return out;
};

export interface RoleFrames {
  idle: string[];
  walkA: string[];
  walkB: string[];
  attack: string[];
  down: string[];
}

export const roleFrames = (role: string): RoleFrames => {
  const color = ROLE_COLOR[role] ?? "T";
  const idle = sub(ROLE_BASES[role] ?? BUILDER, color);
  return {
    idle,
    walkA: stride(idle, true, color),
    walkB: stride(idle, false, color),
    attack: attackFrame(idle, color),
    down: downFrame(idle, color),
  };
};
