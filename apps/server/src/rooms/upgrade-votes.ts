import { findUpgrade, isLegalChoice } from "@lanterns/domain";
import { applyUpgradePick } from "../sim/upgrades";
import { RoomError } from "./errors";
import { playerOf, roomOf } from "./lookup";
import type { MutationResult, RuntimeRoom } from "./runtime";

type Rooms = ReadonlyMap<string, RuntimeRoom>;

/**
 * One crew vote for the pending team upgrade. The first vote applies the
 * effect; the choice table stays up (and the sim stays frozen) until every
 * connected player has voted or the intermission deadline passes.
 */
export const pickUpgrade = (
  rooms: Rooms,
  code: string,
  playerId: string,
  upgradeId: string,
): MutationResult => {
  const room = roomOf(rooms, code);
  playerOf(room, playerId);
  if (!room.state.upgradeChoices.length)
    throw new RoomError(
      "wrong-phase",
      "That upgrade is not on the table right now.",
    );
  if (!room.rt.levelUpApplied) {
    if (!applyUpgradePick(room.state, room.rt, upgradeId))
      throw new RoomError(
        "wrong-phase",
        "That upgrade is not on the table right now.",
      );
    room.rt.levelUpApplied = true;
  } else if (
    !findUpgrade(upgradeId) ||
    !isLegalChoice(room.state.upgradeChoices, upgradeId)
  ) {
    throw new RoomError(
      "wrong-phase",
      "That upgrade is not on the table right now.",
    );
  }
  room.rt.levelUpAcks.add(playerId);
  room.dirty = true;
  return {
    room: room.state,
    events: [],
    levelUp: room.state.upgradeChoices.length > 0,
  };
};
