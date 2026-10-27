import type { MatchStats, RoomState, UpgradeChoice } from "@lanterns/domain";
import { create } from "zustand";
import type { ConnectionStatus } from "../net/handlers";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  SETTINGS_KEY,
  type Settings,
} from "./settings-model";
import { readJson, writeJson, writeText } from "./storage";

export type ScreenName =
  | "splash"
  | "menu"
  | "create"
  | "join"
  | "hub"
  | "match"
  | "levelup"
  | "pause"
  | "downed"
  | "spectate"
  | "end"
  | "leaderboard"
  | "howto"
  | "settings"
  | "credits";

export interface Toast {
  id: number;
  text: string;
}

interface AppState {
  screen: ScreenName;
  previousScreen: ScreenName;
  settings: Settings;
  toasts: Toast[];
  tutorialDone: Record<string, boolean>;
  showTouchHint: boolean;
  /** Low-frequency network state - snapshots never land here. */
  room: RoomState | null;
  playerId: string | null;
  /** true while watching a match instead of playing it */
  spectator: boolean;
  status: ConnectionStatus;
  latency: number;
  error: string;
  /** machine code behind the last error, for targeted recovery offers */
  errorCode: string;
  stats: MatchStats | null;
  levelUp: { choices: UpgradeChoice[]; level: number } | null;
  go: (screen: ScreenName) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
  completeTutorial: (step: string) => void;
  setRoom: (room: RoomState | null) => void;
  setPlayerId: (playerId: string | null) => void;
  setSpectator: (spectator: boolean) => void;
  setStatus: (status: ConnectionStatus) => void;
  setLatency: (latency: number) => void;
  setError: (error: string, code?: string) => void;
  setStats: (stats: MatchStats | null) => void;
  setLevelUp: (
    levelUp: { choices: UpgradeChoice[]; level: number } | null,
  ) => void;
}

const TUTORIAL_KEY = "lanterns-tutorial-done";
let toastSeq = 0;

export const useAppStore = create<AppState>((set) => ({
  screen: "splash",
  previousScreen: "splash",
  settings: {
    ...DEFAULT_SETTINGS,
    ...readJson(SETTINGS_KEY, DEFAULT_SETTINGS),
  },
  toasts: [],
  tutorialDone: readJson<Record<string, boolean>>(TUTORIAL_KEY, {}),
  showTouchHint: false,
  room: null,
  playerId: null,
  spectator: false,
  status: "connecting",
  latency: 0,
  error: "",
  errorCode: "",
  stats: null,
  levelUp: null,
  go: (screen) => set((state) => ({ previousScreen: state.screen, screen })),
  updateSettings: (patch) =>
    set((state) => {
      const settings = mergeSettings(state.settings, patch);
      writeJson(SETTINGS_KEY, settings);
      if (patch.reduceMotion !== undefined)
        document.documentElement.classList.toggle(
          "reduce-motion",
          settings.reduceMotion,
        );
      return { settings };
    }),
  toast: (text) => {
    toastSeq += 1;
    const id = toastSeq;
    set((state) => ({ toasts: [...state.toasts, { id, text }] }));
    window.setTimeout(
      () =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
      2200,
    );
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  completeTutorial: (step) =>
    set((state) => {
      const tutorialDone = { ...state.tutorialDone, [step]: true };
      writeJson(TUTORIAL_KEY, tutorialDone);
      return { tutorialDone };
    }),
  setRoom: (room) => set({ room }),
  setPlayerId: (playerId) => set({ playerId }),
  setSpectator: (spectator) => set({ spectator }),
  setStatus: (status) => set({ status }),
  setLatency: (latency) => set({ latency }),
  setError: (error, code = "") => set({ error, errorCode: code }),
  setStats: (stats) => set({ stats }),
  setLevelUp: (levelUp) => set({ levelUp }),
}));

/** Persist the player's name for returning-player journeys. */
export const rememberName = (name: string): void =>
  writeText("lanterns-name", name);
