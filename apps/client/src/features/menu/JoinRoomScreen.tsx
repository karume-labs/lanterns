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
  const [code, setCode] = useState("");
  const [name, setName] = useState(() => readText("lanterns-name", ""));

  const join = (): void => {
    const trimmed = name.trim().slice(0, 12);
    if (!trimmed || code.length !== 5 || status !== "connected") return;
    rememberName(trimmed);
    getSocket()?.joinRoom(code, trimmed);
    go("hub");
  };

  return (
    <Panel className="form-panel">
      <h2>Join a room</h2>
      <p>Enter the five-character code your host shared.</p>
      <CodeInput onChange={setCode} value={code} />
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
          {error} Your code is kept - try again, or start your own room.
        </p>
      )}
      <button
        disabled={code.length !== 5 || !name.trim() || status !== "connected"}
        onClick={join}
        type="button"
      >
        Join
      </button>
      <button className="secondary" onClick={() => go("create")} type="button">
        Create your own room
      </button>
      <button className="secondary" onClick={() => go("menu")} type="button">
        Back
      </button>
    </Panel>
  );
};
