import { placeAt } from "../sim/constructs";
import { playerOf, roomOf } from "./lookup";
import { gameClock } from "./pause";
import type { RuntimeRoom } from "./runtime";

type Rooms = ReadonlyMap<string, RuntimeRoom>;

/** Pointer-placed construct (mouse click or tap): kind falls back to input. */
export const place = (
  rooms: Rooms,
  code: string,
  playerId: string,
  position: { x: number; y: number },
  kind: "wall" | "turret" | undefined,
  now: number,
): void => {
  const room = roomOf(rooms, code);
  const player = playerOf(room, playerId);
  if (room.state.paused) return;
  const input = room.rt.inputs.get(playerId);
  placeAt(
    room.state,
    room.rt,
    player,
    kind ?? input?.selectedConstruct ?? "wall",
    position,
    gameClock(room, now),
  );
};
