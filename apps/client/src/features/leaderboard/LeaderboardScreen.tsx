import { useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";
import { bucketFor, recordsFor } from "./records";

const BUCKETS = [
  { id: "solo", label: "Solo" },
  { id: "duo", label: "Duo" },
  { id: "trio", label: "Trio" },
  { id: "quad", label: "Full crew" },
];

const formatDate = (date: number): string =>
  new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

/** Best survival times per room size, stored on this device. */
export const LeaderboardScreen = () => {
  const go = useAppStore((state) => state.go);
  const previousScreen = useAppStore((state) => state.previousScreen);
  const room = useAppStore((state) => state.room);
  const current = bucketFor(room?.players.length ?? 1);

  return (
    <Panel className="leaderboard-panel">
      <h2>Leaderboard</h2>
      <div className="bucket-tabs">
        {BUCKETS.map((bucket) => {
          const records = recordsFor(bucket.id);
          return (
            <div
              className="bucket"
              data-active={bucket.id === current}
              key={bucket.id}
            >
              <h3>{bucket.label}</h3>
              {records.length === 0 ? (
                <p className="empty">
                  No records yet. Be the first to hold the light.
                </p>
              ) : (
                <ol className="record-list">
                  {records.map((record) => (
                    <li key={`${record.date}-${record.name}-${record.seconds}`}>
                      <span className="record-name">{record.name}</span>
                      <span className="num">
                        {record.outcome === "won" ? "dawn" : "fell"}
                      </span>
                      <span className="num">{record.seconds}s</span>
                      <span className="num record-date">
                        {formatDate(record.date)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
      <button
        className="secondary"
        onClick={() => go(previousScreen)}
        type="button"
      >
        Back
      </button>
    </Panel>
  );
};
