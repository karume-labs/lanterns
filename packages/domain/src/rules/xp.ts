import { XP_LEVEL_GROWTH, XP_PER_LEVEL_BASE } from "../constants";
import { findUpgrade, upgradeOptions } from "../content/upgrades";
import type { UpgradeChoice } from "../results";

/** Team XP required to advance from `level` to `level + 1`. */
export const xpThresholdFor = (level: number): number =>
  Math.round(XP_PER_LEVEL_BASE * XP_LEVEL_GROWTH ** (level - 1));

export const shouldLevelUp = (teamXp: number, teamLevel: number): boolean =>
  teamXp >= xpThresholdFor(teamLevel);

/**
 * Build the legal level-up picks for the current stacks. Deterministic for a
 * given rng so tests can assert exact choices.
 */
export const rollLevelUpChoices = (
  taken: Record<string, number>,
  rng: () => number,
): UpgradeChoice[] =>
  upgradeOptions(taken, rng).map((upgrade) => ({
    id: upgrade.id,
    label: upgrade.label,
    detail: upgrade.detail,
  }));

/** Validates a client's pick against the choices currently on the table. */
export const isLegalChoice = (
  choices: UpgradeChoice[],
  upgradeId: string,
): boolean => {
  if (!findUpgrade(upgradeId)) return false;
  return choices.some((choice) => choice.id === upgradeId);
};
