import { useState } from "react";
import { readText } from "../../app/storage";
import { rememberName, useAppStore } from "../../app/store";
import { CodeInput } from "../../components/ui/CodeInput";
import { Panel } from "../../components/ui/Panel";
import { getSocket } from "../../net/connection";

export const JoinRoomScreen = () => {
  const go = useAppStore((state) => state.go);
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const errorCode = useAppStore((state) => state.errorCode);
  const [code, setCode] = useState("");
  const [name, setName] = useState(() => readText("lanterns-name", ""));
  const ready =
    code.length === 5 && Boolean(name.trim()) && status === "connected";

  const join = (): void => {
    const trimmed = name.trim().slice(0, 12);
    if (!ready) return;
    rememberName(trimmed);
    // Stay on this screen: the code stays filled and errors land inline.
    getSocket()?.joinRoom(code, trimmed);
  };

  // Mid-match: offer the watcher seat instead of a dead end.
  const watch = (): void => {
    const trimmed = name.trim().slice(0, 12);
    if (!ready) return;
    rememberName(trimmed);
    getSocket()?.watchRoom(code, trimmed);
  };

  // Editing the code means a new attempt: drop the previous verdict.
  const editCode = (next: string): void => {
    setCode(next);
    if (errorCode) useAppStore.getState().setError("");
  };

  return (
    <Panel className="form-panel">
      <h2>Join a room</h2>
      <p>Enter the five-character code your host shared.</p>
      <CodeInput onChange={editCode} value={code} />
      <label>
        Display name
        <input
          maxLength={12}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          value={name}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          {errorCode === "match-in-progress"
            ? "Watch it in the meantime, or create your own room."
            : "Your code is kept - try again, or start your own room."}
        </p>
      )}
      <button disabled={!ready} onClick={join} type="button">
        Join
      </button>
      {errorCode === "match-in-progress" && (
        <button
          className="secondary"
          disabled={!ready}
          onClick={watch}
          type="button"
        >
          Watch as spectator
        </button>
      )}
      <button className="secondary" onClick={() => go("create")} type="button">
        Create your own room
      </button>
      <button className="secondary" onClick={() => go("menu")} type="button">
        Back
      </button>
    </Panel>
  );
};
