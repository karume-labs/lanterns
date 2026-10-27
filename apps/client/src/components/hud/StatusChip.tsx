import { useAppStore } from "../../app/store";

/** Corner connection chip: status word, ping dot, latency. */
export const StatusChip = () => {
  const status = useAppStore((state) => state.status);
  const latency = useAppStore((state) => state.latency);
  return (
    <p aria-live="polite" className="status-chip">
      <span className={`ping-dot ${status}`} aria-hidden="true" />
      <span className="status-word">{status}</span>
      {status === "connected" && (
        <span className="num">{` · ${latency}ms`}</span>
      )}
    </p>
  );
};
