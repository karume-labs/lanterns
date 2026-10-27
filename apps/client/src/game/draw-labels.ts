import { PLAYER_FLAG } from "@lanterns/domain";
import { COLORS } from "./config";
import type { LabelLayer } from "./labels";
import type { PainterFrame } from "./painter";

export const drawPlayerNames = (
  labels: LabelLayer,
  frame: PainterFrame,
): void => {
  const { room, sample, camera, local, myIndex, moving } = frame;
  labels.begin();
  if (sample) {
    room.players.forEach((player, index) => {
      const row = sample.b.pl[index] ?? sample.a.pl[index];
      if (!row) return;
      const localRow = index === myIndex && moving;
      const x = localRow ? local.x : (row[0] ?? player.position.x);
      const y = localRow ? local.y : (row[1] ?? player.position.y);
      const screen = camera.worldToScreen(x, y);
      const downed = (Math.round(row[5] ?? 0) & PLAYER_FLAG.downed) !== 0;
      labels.put(
        downed ? `${player.name} [DOWN]` : player.name,
        screen.x,
        screen.y - 22,
        downed ? COLORS.ember : 0xffffff,
      );
    });
  }
  labels.end();
};
