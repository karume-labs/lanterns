import { PLAYER_FLAG } from "@lanterns/domain";
import { useEffect } from "react";
import { useAppStore } from "../../app/store";
import { AbilityButton, BuildPad } from "../../components/hud/BuildAbility";
import { SkyTimer } from "../../components/hud/SkyTimer";
import { TeamPortraits } from "../../components/hud/TeamPortraits";
import { EnergyMeter, FuelGauge, XPBar } from "../../components/hud/VitalsBars";
import { TouchControls } from "../../components/touch/TouchControls";
import { frameRefs } from "../../game/frame-refs";
import { useHudFrame } from "../../hooks/useHudFrame";
import { dispatchInput } from "../../input/current-input";
import { DownedOverlay } from "./DownedOverlay";
import { myIndex } from "./frame-reads";
import { LevelUpOverlay } from "./LevelUpOverlay";
import { PausedBanner } from "./PausedBanner";
import { SpectateOverlay } from "./SpectateOverlay";

/** Set by the downed overlay's rAF check; drives the red vignette class. */
const useVitalsClasses = (): void => {
  useHudFrame(() => {
    const row = myRowSafe();
    const downed = ((row?.[5] ?? 0) & PLAYER_FLAG.downed) !== 0;
    const lowHp = (row?.[3] ?? 100) <= 25;
    const main = document.body;
    main.classList.toggle("downed-vignette", downed);
    main.classList.toggle("low-hp-vignette", !downed && lowHp);
  });
};

const myRowSafe = (): number[] | undefined => {
  const index = myIndex();
  return index >= 0 ? frameRefs.snap?.pl[index] : undefined;
};

/** Full match HUD; every number moves through refs, never React state. */
export const MatchHud = () => {
  const go = useAppStore((state) => state.go);
  const screen = useAppStore((state) => state.screen);
  const spectator = useAppStore((state) => state.spectator);
  const settings = useAppStore((state) => state.settings);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const hotkeys =
    settings.scheme !== "touch" && !(settings.scheme === "auto" && coarse);
  useVitalsClasses();

  // Leaving the match must not leave the red border behind on the menu.
  useEffect(
    () => () => {
      document.body.classList.remove("downed-vignette", "low-hp-vignette");
    },
    [],
  );

  return (
    <div className="match-hud screen-enter">
      <PausedBanner />
      <TeamPortraits />
      <SkyTimer />
      <FuelGauge />
      {!spectator && (
        <div className="bottom-bar">
          <EnergyMeter />
          <XPBar />
          <BuildPad hotkeys={hotkeys} />
          <AbilityButton hotkeys={hotkeys} />
        </div>
      )}
      <button
        aria-label="Pause and settings"
        className="corner-btn pause-btn"
        onClick={() => go("pause")}
        type="button"
      >
        Menu
      </button>
      {!spectator && <LevelUpOverlay />}
      {!spectator && <DownedOverlay />}
      {!hotkeys && !spectator && <TouchControls onInput={dispatchInput} />}
      {screen === "spectate" && <SpectateOverlay />}
    </div>
  );
};
