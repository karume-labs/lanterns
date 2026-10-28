import type { SnapshotEvent } from "@lanterns/domain";
import { playSfx } from "./audio";
import { frameRefs } from "./frame-refs";

let lastEnergy = -1;

/** Watch the local energy pool: a big drop means the ability actually cast. */
const energyDropCast = (): void => {
  const room = frameRefs.room;
  const playerId = frameRefs.playerId;
  const snap = frameRefs.snap;
  if (!room || !playerId || snap?.ph !== "active") return;
  const index = room.players.findIndex((player) => player.id === playerId);
  const energy = snap.pl[index]?.[4];
  if (energy === undefined) return;
  if (lastEnergy >= 0 && lastEnergy - energy >= 20) playSfx("cast");
  lastEnergy = energy;
};

/** Map one snapshot's events onto one-shot sounds. No visuals live here. */
export const fxSounds = (events: readonly SnapshotEvent[]): void => {
  for (const event of events) {
    if (event.k === "hit") playSfx("hit", 0.8);
    else if (event.k === "die") playSfx("die", 0.9);
    // "s" attenuates distant gunfire; nearby shots stay punchy.
    else if (event.k === "shot")
      playSfx("shot", 0.2 + Math.min(1, Math.max(0, event.s)) * 0.8);
    else if (event.k === "down") playSfx("down");
    else if (event.k === "revived") playSfx("revive", 0.9);
    else if (event.k === "placed") playSfx("place", 0.7);
    else if (event.k === "flare") playSfx("cast", 0.7);
    else if (event.k === "fuel") playSfx("fuel", 0.6);
  }
  energyDropCast();
};

/** Forgetting the pool across a room change avoids a phantom first cast. */
export const resetFxSounds = (): void => {
  lastEnergy = -1;
};
