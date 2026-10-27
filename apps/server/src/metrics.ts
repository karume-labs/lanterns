export interface Metrics {
  rejected: number;
  rejectsByCode: Record<string, number>;
  reconnects: number;
  snapshots: number;
  snapshotBytes: number;
  maxTickMicros: number;
  tickMicrosTotal: number;
  ticks: number;
}

export const createMetrics = (): Metrics => ({
  rejected: 0,
  rejectsByCode: {},
  reconnects: 0,
  snapshots: 0,
  snapshotBytes: 0,
  maxTickMicros: 0,
  tickMicrosTotal: 0,
  ticks: 0,
});

export const recordReject = (metrics: Metrics, code: string): void => {
  metrics.rejected += 1;
  metrics.rejectsByCode[code] = (metrics.rejectsByCode[code] ?? 0) + 1;
};

export const recordTick = (
  metrics: Metrics,
  tickMicros: number,
  snapshotBytes: number,
): void => {
  metrics.ticks += 1;
  metrics.tickMicrosTotal += tickMicros;
  metrics.maxTickMicros = Math.max(metrics.maxTickMicros, tickMicros);
  if (snapshotBytes > 0) {
    metrics.snapshots += 1;
    metrics.snapshotBytes += snapshotBytes;
  }
};

/** Human-readable line for the periodic log. */
export const formatLog = (
  metrics: Metrics,
  rooms: number,
  players: number,
): string => {
  const avgTick = metrics.ticks
    ? Math.round(metrics.tickMicrosTotal / metrics.ticks)
    : 0;
  const avgSnapshot = metrics.snapshots
    ? Math.round(metrics.snapshotBytes / metrics.snapshots)
    : 0;
  return JSON.stringify({
    evt: "metrics",
    rooms,
    players,
    avgTickMicros: avgTick,
    maxTickMicros: metrics.maxTickMicros,
    avgSnapshotBytes: avgSnapshot,
    snapshots: metrics.snapshots,
    rejected: metrics.rejected,
    reconnects: metrics.reconnects,
  });
};
