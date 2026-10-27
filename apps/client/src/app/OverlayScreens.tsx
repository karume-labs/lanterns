import type { ReactElement } from "react";
import { CreditsScreen } from "../features/credits/CreditsScreen";
import { HowToScreen } from "../features/howto/HowToScreen";
import { LeaderboardScreen } from "../features/leaderboard/LeaderboardScreen";
import { PauseOverlay } from "../features/match/PauseOverlay";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { type ScreenName, useAppStore } from "./store";

const MODALS: Partial<Record<ScreenName, () => ReactElement>> = {
  settings: () => <SettingsScreen />,
  howto: () => <HowToScreen />,
  leaderboard: () => <LeaderboardScreen />,
  credits: () => <CreditsScreen />,
  pause: () => <PauseOverlay />,
};

/** Full-screen modal layers shown above the current base screen. */
export const OverlayScreens = () => {
  const screen = useAppStore((state) => state.screen);
  const room = useAppStore((state) => state.room);
  if (screen === "pause" && room?.phase !== "active") return null;
  const Overlay = MODALS[screen];
  return Overlay ? <Overlay /> : null;
};
