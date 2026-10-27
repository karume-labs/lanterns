import { useAppStore } from "../../app/store";
import { getSocket } from "../../net/connection";

/** Reconnect/disconnect banner with attempt hint, retry, and leave. */
export const ConnectionOverlay = () => {
  const status = useAppStore((state) => state.status);
  if (status !== "reconnecting" && status !== "offline") return null;
  return (
    <div aria-live="polite" className="system-overlay screen-enter">
      <div className="system-card pixel-frame">
        <h2>{status === "offline" ? "The line went dark" : "Reconnecting…"}</h2>
        <p>
          {status === "offline"
            ? "We lost the lantern signal. Try once more, or head home."
            : "Hold on - your crew is still fighting."}
        </p>
        <button
          onClick={() => {
            useAppStore.getState().setStatus("connecting");
            getSocket()?.connect();
          }}
          type="button"
        >
          Try again
        </button>
        <button
          className="secondary"
          onClick={() => window.location.reload()}
          type="button"
        >
          Leave
        </button>
      </div>
    </div>
  );
};

/** Inline error banner for transient failures. */
export const ErrorBanner = () => {
  const error = useAppStore((state) => state.error);
  if (!error) return null;
  return (
    <p aria-live="assertive" className="error-banner" role="alert">
      {error}
    </p>
  );
};

/** Portrait-orientation interrupt for phones (CSS also covers visuals). */
export const RotateOverlay = () => (
  <div className="rotate-overlay" role="status">
    <p>Rotate your phone to play</p>
  </div>
);

/** Unknown paths render a warm 404 with a way home. */
export const NotFound = () => (
  <div className="system-overlay screen-enter">
    <div className="system-card pixel-frame">
      <h2>Lost in the dark</h2>
      <p>That path does not exist. The lantern is back at the menu.</p>
      <button onClick={() => window.location.assign("/")} type="button">
        Head home
      </button>
    </div>
  </div>
);
