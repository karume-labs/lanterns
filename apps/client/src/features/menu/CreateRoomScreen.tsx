import { useState } from "react";
import { readText } from "../../app/storage";
import { rememberName, useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";
import { getSocket } from "../../net/connection";

const SUGGESTIONS = [
  "Ember",
  "Wick",
  "Moth",
  "Glow",
  "Soot",
  "Kindle",
  "Flint",
  "Dawn",
];

export const CreateRoomScreen = () => {
  const go = useAppStore((state) => state.go);
  const status = useAppStore((state) => state.status);
  const [name, setName] = useState(
    () =>
      readText("lanterns-name", "") ||
      SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)],
  );

  const create = (): void => {
    const trimmed = name.trim().slice(0, 12);
    if (!trimmed || status !== "connected") return;
    rememberName(trimmed);
    getSocket()?.createRoom(trimmed);
    go("hub");
  };

  return (
    <Panel className="form-panel">
      <h2>Create a room</h2>
      <p>Pick a name, then call your friends over.</p>
      <label>
        Display name
        <input
          maxLength={12}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ember"
          value={name}
        />
      </label>
      <button
        disabled={!name.trim() || status !== "connected"}
        onClick={create}
        type="button"
      >
        Create
      </button>
      <button className="secondary" onClick={() => go("menu")} type="button">
        Back
      </button>
    </Panel>
  );
};
