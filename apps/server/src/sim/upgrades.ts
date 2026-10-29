import {
  findUpgrade,
  isLegalChoice,
  LANTERN_MAX_FUEL,
  maxEnergy,
  type RoomState,
  rollLevelUpChoices,
  xpThresholdFor,
} from "@lanterns/domain";
import { type SimRuntime, stacks } from "./runtime";

const addXp = (state: RoomState, rt: SimRuntime, amount: number): void => {
  state.teamXp += amount;
  if (state.upgradeChoices.length) return;
  if (state.teamXp < state.nextXpThreshold) return;
  levelUp(state, rt);
};

const levelUp = (state: RoomState, rt: SimRuntime): void => {
  state.teamLevel += 1;
  state.teamXp = Math.max(0, state.teamXp - state.nextXpThreshold);
  state.nextXpThreshold = xpThresholdFor(state.teamLevel);
  state.upgradeChoices = rollLevelUpChoices(rt.takenUpgrades, rt.rng);
};

/**
 * Apply the upgrade effect without clearing the choice table. The tick owns
 * clearing: choices stay up until every connected player has voted (or the
 * intermission deadline passes), so the whole crew picks together.
 */
export const applyUpgradePick = (
  state: RoomState,
  rt: SimRuntime,
  upgradeId: string,
): boolean => {
  if (!isLegalChoice(state.upgradeChoices, upgradeId)) return false;
  const def = findUpgrade(upgradeId);
  if (!def) return false;
  rt.takenUpgrades[upgradeId] = (rt.takenUpgrades[upgradeId] ?? 0) + 1;

  if (def.instantFuel && state.lantern)
    state.lantern.fuel = Math.min(
      LANTERN_MAX_FUEL,
      state.lantern.fuel + def.instantFuel,
    );
  if (upgradeId === "vitality")
    for (const player of state.players) {
      player.maxHealth += 25;
      player.health = Math.min(player.maxHealth, player.health + 25);
    }
  if (upgradeId === "battery")
    for (const player of state.players) {
      const raised = maxEnergy(stacks(rt, "battery"));
      player.energy = Math.min(raised, player.energy + 30);
      player.maxEnergy = raised;
    }
  if (state.teamXp >= state.nextXpThreshold && !state.upgradeChoices.length)
    levelUp(state, rt);
  return true;
};

/** Legacy single-pick path (tests and headless runs): apply and clear. */
export const chooseUpgrade = (
  state: RoomState,
  rt: SimRuntime,
  upgradeId: string,
): boolean => {
  if (!applyUpgradePick(state, rt, upgradeId)) return false;
  state.upgradeChoices = [];
  if (state.teamXp >= state.nextXpThreshold) levelUp(state, rt);
  return true;
};

export { addXp };
