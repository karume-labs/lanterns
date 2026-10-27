import type { Role } from "../types";

import { BASE_ROLES } from "./base-roles";

export interface RoleDef {
  id: Role;
  label: string;
  /** Body color used by sprites and UI chips. */
  color: string;
  /** Lighter accent for outlines and highlights. */
  accent: string;
  /** One-line identity shown on the rack. */
  pitch: string;
  abilityId: string;
  abilityName: string;
  abilityDesc: string;
  abilityCost: number;
  /** Multipliers applied by the simulation. */
  mods: {
    damage: number;
    speed: number;
    fireRate: number;
    constructHealth: number;
    constructCost: number;
    reviveSpeed: number;
    /** Fuel deposit multiplier (Keeper banks more per shard). */
    fuel: number;
  };
}

export const ROLES_TABLE: Record<Role, RoleDef> = {
  ...BASE_ROLES,
  keeper: {
    id: "keeper",
    label: "Keeper",
    color: "#ff8fd1",
    accent: "#f2ecd8",
    pitch: "Never fires - fuels the lantern and mends the crew",
    abilityId: "ward",
    abilityName: "Ward",
    abilityDesc: "Raise a small shield that fades quickly.",
    abilityCost: 25,
    mods: {
      damage: 1,
      speed: 0.95,
      fireRate: 1,
      constructHealth: 1.3,
      constructCost: 0.9,
      reviveSpeed: 1.35,
      fuel: 1.5,
    },
  },
  lumen: {
    id: "lumen",
    label: "Lumen",
    color: "#c8a2ff",
    accent: "#ff9ec2",
    pitch: "Carries the light farther into the dark",
    abilityId: "beacon",
    abilityName: "Beacon",
    abilityDesc: "Flare the lantern: wider light for a breath.",
    abilityCost: 35,
    mods: {
      damage: 1,
      speed: 1,
      fireRate: 1,
      constructHealth: 1,
      constructCost: 1,
      reviveSpeed: 1,
      fuel: 1,
    },
  },
};

export const ROLE_ORDER: Role[] = [
  "builder",
  "medic",
  "striker",
  "scout",
  "keeper",
  "lumen",
];
