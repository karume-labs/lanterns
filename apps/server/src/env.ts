import { join } from "node:path";

const readPort = (): number => {
  const raw = process.env.PORT;
  if (!raw) return 3000;
  const parsed = Number(raw);
  // Hosts that export PORT=0 mean "unset"; fall back to the default.
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
};

const readNumber = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Parsed once; consumers read `env`, never `process.env`. */
export const env = {
  port: readPort(),
  host: process.env.HOST || "0.0.0.0",
  clientDir:
    process.env.CLIENT_DIR ?? join(import.meta.dir, "../../client/dist"),
  logIntervalMs: readNumber(process.env.LOG_INTERVAL_MS, 10_000),
};

export const isPortValid = Number.isInteger(env.port) && env.port > 0;
