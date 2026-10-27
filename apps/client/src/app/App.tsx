import type {
  InputState,
  MatchStats,
  RoomEvent,
  RoomState,
  Snapshot,
} from "@lanterns/domain";
import { useEffect, useState } from "react";
import { GameView } from "../game/GameView";
import { useTouchMode } from "../hooks/use-touch-mode";
import { setCurrentInput } from "../input/current-input";
import { type ConnectionStatus, GameSocket } from "../net/socket";
import { EndPanel } from "../ui/EndPanel";
import { Hud } from "../ui/Hud";
import { LevelUpCards } from "../ui/LevelUpCards";
import { LobbyPanel } from "../ui/LobbyPanel";
import { MenuScreen } from "../ui/MenuScreen";
import { SettingsButton } from "../ui/SettingsButton";
import { TouchControls } from "../ui/TouchControls";

export const App = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [latency, setLatency] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const touch = useTouchMode();

  useEffect(() => {
    const connection = new GameSocket({
      onStatus: setStatus,
      onRoom: (next) => {
        setRoom(next);
        setSnap(null);
        if (next.phase === "lobby") setStats(null);
      },
      onSnapshot: setSnap,
      onEvent: (event: RoomEvent) => setNotice(EVENT_TEXT[event] ?? event),
      onLevelUp: () => setNotice(""),
      onMatchEnded: setStats,
      onNotice: setNotice,
      onError: setError,
      onLatency: setLatency,
      onWelcome: setPlayerId,
    });
    setSocket(connection);
    connection.connect();
    return () => connection.close();
  }, []);

  const sendInput = (input: InputState) => {
    setCurrentInput(input);
    if (room) socket?.sendInput(input);
  };
  const player = room?.players.find((candidate) => candidate.id === playerId);
  const canSubmit = name.trim().length > 0 && status === "connected";

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  return (
    <main>
      <GameView
        room={room}
        snap={snap}
        playerId={playerId}
        onInput={sendInput}
      />
      <p className="status" aria-live="polite">
        {status}
        {status === "connected" ? ` · ${latency}ms` : ""}
      </p>
      {!room ? (
        <MenuScreen
          name={name}
          code={code}
          canSubmit={canSubmit}
          isTouch={touch.enabled}
          onName={setName}
          onCode={setCode}
          onCreate={() => socket?.createRoom(name)}
          onJoin={() => socket?.joinRoom(code, name)}
        />
      ) : room.phase === "lobby" || room.phase === "countdown" ? (
        <LobbyPanel
          room={room}
          isHost={room.hostId === playerId}
          playerId={playerId}
          onSelectRole={(role) => socket?.selectRole(role)}
          onStart={() => socket?.startMatch()}
          onLeave={() => socket?.leaveRoom()}
        />
      ) : room.phase === "won" || room.phase === "lost" ? (
        <EndPanel
          room={room}
          stats={stats}
          isHost={room.hostId === playerId}
          onReturn={() => socket?.returnToLobby()}
        />
      ) : null}
      {room?.phase === "active" && (
        <Hud room={room} snap={snap} player={player} />
      )}
      {room?.phase === "active" && room.upgradeChoices.length > 0 && (
        <LevelUpCards
          choices={room.upgradeChoices}
          onPick={(upgradeId) => socket?.chooseUpgrade(upgradeId)}
        />
      )}
      {room?.phase === "active" && touch.enabled && (
        <TouchControls onInput={sendInput} />
      )}
      <SettingsButton mode={touch.mode} onChange={touch.toggle} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" aria-live="polite">
          {notice}
        </p>
      )}
    </main>
  );
};

const EVENT_TEXT: Partial<Record<RoomEvent, string>> = {
  "player-joined": "A player joined the room.",
  "player-left": "A player left the room.",
  "player-reconnected": "A player reconnected.",
  "countdown-started": "The lantern ignites soon…",
  "countdown-cancelled": "Countdown cancelled - everyone to the circle.",
  "match-started": "The night begins!",
  "host-changed": "New host: the lantern listens to them now.",
};
