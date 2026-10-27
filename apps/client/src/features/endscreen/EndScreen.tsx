import type { MatchStats } from "@lanterns/domain";
import { useEffect, useRef, useState } from "react";
import { leaveRoom, returnToLobby } from "../../app/room-actions";
import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";
import {
  isPersonalBest,
  type LeaderboardEntry,
  saveRecord,
  setBucket,
} from "../leaderboard/records";

const mvpCallouts = (stats: MatchStats): string[] => {
  const byKills = [...stats.players].sort((a, b) => b.kills - a.kills)[0];
  const byRevives = [...stats.players].sort((a, b) => b.revives - a.revives)[0];
  const lines: string[] = [];
  if (byKills && byKills.kills > 0)
    lines.push(`${byKills.name} kept the dark at bay (${byKills.kills} kills)`);
  if (byRevives && byRevives.revives > 0)
    lines.push(
      `${byRevives.name} brought the crew back (${byRevives.revives} revives)`,
    );
  return lines;
};

/** Win/lose end screen: stats, MVP callouts, record callout, next moves. */
export const EndScreen = () => {
  const room = useAppStore((state) => state.room);
  const stats = useAppStore((state) => state.stats);
  const playerId = useAppStore((state) => state.playerId);
  const toast = useAppStore((state) => state.toast);
  const [bestTime, setBestTime] = useState(false);
  const saved = useRef(false);

  const won = room?.phase === "won";
  useEffect(() => {
    if (!stats || saved.current) return;
    saved.current = true;
    setBucket(room?.players.length ?? 1);
    const entry: LeaderboardEntry = {
      name: stats.players.find((p) => p.id === playerId)?.name ?? "Someone",
      seconds: Math.round(stats.survivalSeconds),
      date: Date.now(),
      roles: stats.players
        .map((p) => p.role ?? "none")
        .filter((role) => role !== "none"),
      outcome: stats.outcome,
    };
    const personalBest = isPersonalBest(entry);
    saveRecord(entry);
    if (personalBest && stats.outcome === "won") {
      setBestTime(true);
      toast("New best time!");
    }
  }, [stats, playerId, toast, room]);

  if (!room) return null;
  const isHost = room.hostId === playerId;
  const again = (): void => {
    if (isHost) returnToLobby();
    else toast("Ask the host to light the lantern again.");
  };

  return (
    <div className={`end-screen ${won ? "end-win" : "end-lose"}`}>
      <Panel className="end-panel">
        <h1>{won ? "Dawn" : "Out of Light"}</h1>
        <p className="end-sub">
          {won
            ? "The sun finds your crew around the lantern."
            : "The night took this one. The next watch is yours."}
        </p>
        {bestTime && <p className="best-time">New best time!</p>}
        {stats && (
          <dl className="end-stats">
            <div>
              <dt>Survived</dt>
              <dd className="num">{Math.round(stats.survivalSeconds)}s</dd>
            </div>
            <div>
              <dt>Kills</dt>
              <dd className="num">{stats.teamKills}</dd>
            </div>
            <div>
              <dt>Revives</dt>
              <dd className="num">{stats.teamRevives}</dd>
            </div>
            <div>
              <dt>Fuel left</dt>
              <dd className="num">{Math.round(stats.lanternFuel)}%</dd>
            </div>
            <div>
              <dt>Upgrades</dt>
              <dd className="num">{stats.teamLevel}</dd>
            </div>
          </dl>
        )}
        {stats &&
          mvpCallouts(stats).map((line) => (
            <p className="mvp" key={line}>
              {line}
            </p>
          ))}
        <button onClick={again} type="button">
          Play Again
        </button>
        <button className="secondary" onClick={returnToLobby} type="button">
          Back to the Hub
        </button>
        <button className="secondary" onClick={leaveRoom} type="button">
          Leave
        </button>
        <button
          className="secondary"
          onClick={() => useAppStore.getState().go("leaderboard")}
          type="button"
        >
          Leaderboard
        </button>
      </Panel>
    </div>
  );
};
