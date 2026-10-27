import { EndScreen } from "../features/endscreen/EndScreen";
import { HubOverlay } from "../features/hub/HubOverlay";
import { MatchHud } from "../features/match/MatchHud";
import { CreateRoomScreen } from "../features/menu/CreateRoomScreen";
import { JoinRoomScreen } from "../features/menu/JoinRoomScreen";
import { MenuScreen } from "../features/menu/MenuScreen";
import { SplashScreen } from "../features/splash/SplashScreen";
import { useAppStore } from "./store";

/**
 * Chooses the base screen from room phase first, menu flow second. Modal
 * overlays (settings, howto, pause...) render above this in OverlayScreens.
 */
export const BaseScreen = () => {
  const screen = useAppStore((state) => state.screen);
  const room = useAppStore((state) => state.room);

  if (room) {
    if (room.phase === "lobby" || room.phase === "countdown")
      return <HubOverlay />;
    if (room.phase === "active") return <MatchHud />;
    return <EndScreen />;
  }
  if (screen === "create") return <CreateRoomScreen />;
  if (screen === "join") return <JoinRoomScreen />;
  if (screen === "splash") return <SplashScreen />;
  return <MenuScreen />;
};
