import { type MatchStats, type RoomState, round0 } from "@lanterns/domain";

/** Per-player and team statistics for the match-ended frame. */
export const buildStats = (state: RoomState): MatchStats => ({
  outcome: state.winner ?? (state.phase === "won" ? "won" : "lost"),
  survivalSeconds: Math.floor(state.elapsedSeconds),
  teamKills: state.players.reduce((total, player) => total + player.kills, 0),
  teamRevives: state.players.reduce(
    (total, player) => total + player.revives,
    0,
  ),
  lanternFuel: round0(state.lantern?.fuel ?? 0),
  teamLevel: state.teamLevel,
  players: state.players.map((player) => ({
    id: player.id,
    name: player.name,
    role: player.role,
    kills: player.kills,
    revives: player.revives,
    downs: player.downs,
  })),
});
