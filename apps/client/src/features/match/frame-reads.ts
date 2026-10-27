import { frameRefs } from "../../game/frame-refs";

/** Snapshot row helpers shared by the per-frame HUD readers. */
export const myIndex = (): number => {
  const { room, playerId } = frameRefs;
  if (!room || !playerId) return -1;
  return room.players.findIndex((player) => player.id === playerId);
};

export const myRow = (): number[] | undefined => {
  const index = myIndex();
  return index >= 0 ? frameRefs.snap?.pl[index] : undefined;
};

export const fuelRatio = (): number => {
  const lantern = frameRefs.snap?.ln;
  return lantern ? Math.max(0, Math.min(1, lantern[2] / 100)) : 0;
};
