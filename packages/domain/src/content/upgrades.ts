import { UPGRADE_MAX_STACKS, UPGRADE_OPTIONS_COUNT } from "../constants";

export interface UpgradeDef {
  id: string;
  label: string;
  detail: string;
  maxStacks: number;
  /** one-off lantern fuel granted when picked (repeatable up to maxStacks) */
  instantFuel?: number;
}

export const UPGRADES_TABLE: UpgradeDef[] = [
  {
    id: "power",
    label: "Hot Shots",
    detail: "+25% shot damage",
    maxStacks: UPGRADE_MAX_STACKS,
  },
  {
    id: "fuel",
    label: "Fuel Top-off",
    detail: "+25 lantern fuel now",
    maxStacks: UPGRADE_MAX_STACKS,
    instantFuel: 25,
  },
  {
    id: "vitality",
    label: "Warm Hearts",
    detail: "+25 maximum health and heal 25",
    maxStacks: UPGRADE_MAX_STACKS,
  },
  {
    id: "haste",
    label: "Quick Feet",
    detail: "+15% movement speed",
    maxStacks: UPGRADE_MAX_STACKS,
  },
  {
    id: "repair",
    label: "Sturdy Builds",
    detail: "+50% construct health",
    maxStacks: UPGRADE_MAX_STACKS,
  },
  {
    id: "reload",
    label: "Rapid Sparks",
    detail: "+25% fire rate",
    maxStacks: UPGRADE_MAX_STACKS,
  },
  {
    id: "battery",
    label: "Deep Reserves",
    detail: "+30 maximum energy and faster recharge",
    maxStacks: UPGRADE_MAX_STACKS,
  },
  {
    id: "harvest",
    label: "Bright Pull",
    detail: "+50% fuel value from shards",
    maxStacks: UPGRADE_MAX_STACKS,
  },
];

export const findUpgrade = (id: string): UpgradeDef | undefined =>
  UPGRADES_TABLE.find((upgrade) => upgrade.id === id);

/** How many more times an upgrade may still be taken. */
export const remainingStacks = (
  id: string,
  taken: Record<string, number>,
): number => {
  const def = findUpgrade(id);
  if (!def) return 0;
  return Math.max(0, def.maxStacks - (taken[id] ?? 0));
};

/**
 * Deterministically choose `count` distinct legal options given the stacks
 * already taken. Options that have hit their stack cap are ineligible, and an
 * upgrade is never offered twice in the same pick.
 */
export const upgradeOptions = (
  taken: Record<string, number>,
  rng: () => number,
  count = UPGRADE_OPTIONS_COUNT,
): UpgradeDef[] => {
  const legal = UPGRADES_TABLE.filter(
    (upgrade) => remainingStacks(upgrade.id, taken) > 0,
  );
  const picked: UpgradeDef[] = [];
  const pool = [...legal];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    const choice = pool.splice(index, 1)[0];
    if (choice) picked.push(choice);
  }
  return picked;
};
