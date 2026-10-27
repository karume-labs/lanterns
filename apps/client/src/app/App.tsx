import type { RoomEvent } from "@lanterns/domain";
import { useEffect } from "react";
import { StatusChip } from "../components/hud/StatusChip";
import { Toasts } from "../components/ui/Toasts";
import { DevGallery } from "../features/dev/DevGallery";
import {
  ConnectionOverlay,
  ErrorBanner,
  NotFound,
  RotateOverlay,
} from "../features/system/SystemOverlays";
import {
  setFxFlags,
  setPlayerIdRef,
  setRoomRef,
  setSnapRef,
} from "../game/frame-refs";
import { GameView } from "../game/GameView";
import { setInputSink } from "../input/current-input";
import { closeConnection, openConnection } from "../net/connection";
import { BaseScreen } from "./BaseScreen";
import { OverlayScreens } from "./OverlayScreens";
import { dropRoomLocally } from "./room-actions";
import { useAppStore } from "./store";

const EVENT_TEXT: Partial<Record<RoomEvent, string>> = {
  "player-joined": "A player joined the room.",
  "player-left": "A player left the room.",
  "player-reconnected": "A player reconnected.",
  "countdown-started": "The lantern ignites soon…",
  "countdown-cancelled": "Countdown cancelled - everyone to the circle.",
  "match-started": "The night begins!",
  "host-changed": "New host: the lantern listens to them now.",
};

/** Root shell: one socket, refs for frames, React only for real UI state. */
export const App = () => {
  useEffect(() => {
    const socket = openConnection({
      onStatus: (status) => useAppStore.getState().setStatus(status),
      onRoom: (room) => {
        setRoomRef(room);
        const store = useAppStore.getState();
        store.setRoom(room);
        store.setLevelUp(null);
        // A successful join leaves the form screen for the room it opened.
        if (store.screen === "join") store.go("hub");
        if (room.phase === "lobby" || room.phase === "countdown")
          store.setStats(null);
      },
      onSnapshot: setSnapRef,
      onEvent: (event) =>
        useAppStore.getState().toast(EVENT_TEXT[event] ?? event),
      onLevelUp: (choices, level) =>
        useAppStore.getState().setLevelUp({ choices, level }),
      onMatchEnded: (stats) => useAppStore.getState().setStats(stats),
      onNotice: (message) => useAppStore.getState().toast(message),
      onError: (message, code) => {
        const store = useAppStore.getState();
        // The room died while we were away: back to the menu, not a dead HUD.
        if (code === "rejoin-failed") dropRoomLocally();
        store.setError(message, code);
        // The mid-match offer stays until the player acts on it.
        if (code !== "match-in-progress")
          window.setTimeout(() => useAppStore.getState().setError(""), 5000);
      },
      onLatency: (ms) => useAppStore.getState().setLatency(ms),
      onWelcome: (playerId, _roomCode, spectator) => {
        const store = useAppStore.getState();
        // A seat was granted: retire the verdict that offered it.
        store.setError("");
        store.setPlayerId(playerId);
        setPlayerIdRef(playerId);
        store.setSpectator(spectator);
        // A mid-match watcher opens straight on the spectate banner.
        if (spectator) store.go("spectate");
      },
    });
    setInputSink((input) => {
      const store = useAppStore.getState();
      if (store.room && !store.spectator) socket.sendInput(input);
    });
    return () => {
      setInputSink(null);
      closeConnection();
    };
  }, []);

  const settings = useAppStore((state) => state.settings);
  useEffect(() => {
    const reduced =
      settings.reduceMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFxFlags(!reduced && settings.screenShake, settings.damageNumbers);
  }, [settings.reduceMotion, settings.screenShake, settings.damageNumbers]);

  const path = window.location.pathname;
  if (path !== "/" && path !== "/dev")
    return (
      <main>
        <NotFound />
      </main>
    );
  if (path === "/dev")
    return (
      <main>
        <DevGallery />
      </main>
    );

  return (
    <main>
      <GameView />
      <BaseScreen />
      <OverlayScreens />
      <StatusChip />
      <ConnectionOverlay />
      <ErrorBanner />
      <RotateOverlay />
      <Toasts />
    </main>
  );
};
