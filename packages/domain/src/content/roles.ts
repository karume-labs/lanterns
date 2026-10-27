import type { Role } from "../types";

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
  };
}

export const ROLES_TABLE: Record<Role, RoleDef> = {
  builder: {
    id: "builder",
    label: "Builder",
    color: "#5bc0eb",
    accent: "#a5e3ff",
    pitch: "Cheaper, sturdier constructs",
    abilityId: "bulwark",
    abilityName: "Bulwark",
    abilityDesc: "Erect a free wall in front of you.",
    abilityCost: 30,
    mods: {
      damage: 1,
      speed: 1,
      fireRate: 1,
      constructHealth: 1.5,
      constructCost: 0.75,
      reviveSpeed: 1,
    },
  },
  medic: {
    id: "medic",
    label: "Medic",
    color: "#f284b6",
    accent: "#ffc2dd",
    pitch: "Healing pulse and faster revives",
    abilityId: "mend",
    abilityName: "Mend",
    abilityDesc: "Heal every nearby player for 35.",
    abilityCost: 40,
    mods: {
      damage: 1,
      speed: 1,
      fireRate: 1,
      constructHealth: 1,
      constructCost: 1,
      reviveSpeed: 1.6,
    },
  },
  striker: {
    id: "striker",
    label: "Striker",
    color: "#f95738",
    accent: "#ffb199",
    pitch: "Heavy damage up close",
    abilityId: "flare",
    abilityName: "Flare",
    abilityDesc: "Burst of damage to everything nearby.",
    abilityCost: 50,
    mods: {
      damage: 1.35,
      speed: 1,
      fireRate: 1,
      constructHealth: 1,
      constructCost: 1,
      reviveSpeed: 1,
    },
  },
  scout: {
    id: "scout",
    label: "Scout",
    color: "#b8de6f",
    accent: "#e2ffb8",
    pitch: "Fast, and pulls fuel shards",
    abilityId: "glimmer",
    abilityName: "Glimmer",
    abilityDesc: "Pull loose fuel shards toward you.",
    abilityCost: 35,
    mods: {
      damage: 1,
      speed: 1.15,
      fireRate: 1,
      constructHealth: 1,
      constructCost: 1,
      reviveSpeed: 1,
    },
  },
};

export const ROLE_ORDER: Role[] = ["builder", "medic", "striker", "scout"];
