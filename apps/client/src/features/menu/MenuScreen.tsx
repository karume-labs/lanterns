import { type ScreenName, useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";
import { LanternBackdrop } from "./LanternBackdrop";

const NAV: { label: string; screen: ScreenName }[] = [
  { label: "Create Room", screen: "create" },
  { label: "Join Room", screen: "join" },
  { label: "How to Play", screen: "howto" },
  { label: "Settings", screen: "settings" },
  { label: "Leaderboard", screen: "leaderboard" },
  { label: "Credits", screen: "credits" },
];

export const MenuScreen = () => {
  const go = useAppStore((state) => state.go);
  return (
    <div className="screen screen-enter">
      <LanternBackdrop />
      <div className="menu-logo">
        <span aria-hidden="true" className="logo-emblem glow" />
        <h1>Lanterns</h1>
        <p className="tagline">
          Gather your crew. Keep the light alive until dawn.
        </p>
      </div>
      <Panel className="menu-panel">
        <nav className="menu-nav">
          {NAV.map((item) => (
            <button
              key={item.screen}
              onClick={() => go(item.screen)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </Panel>
    </div>
  );
};
