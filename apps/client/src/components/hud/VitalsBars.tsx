import { useRef } from "react";
import { fuelRatio, myRow } from "../../features/match/frame-reads";
import { frameRefs } from "../../game/frame-refs";
import { useHudFrame } from "../../hooks/useHudFrame";

/** Large lantern fuel gauge; pulses under 25%. */
export const FuelGauge = () => {
  const fill = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  useHudFrame(() => {
    const ratio = fuelRatio();
    if (fill.current) fill.current.style.width = `${ratio * 100}%`;
    if (root.current) root.current.classList.toggle("critical", ratio < 0.25);
    if (caption.current)
      caption.current.textContent = `${Math.round(ratio * 100)}%`;
  });
  return (
    <div aria-label="Lantern fuel" className="fuel-gauge" ref={root} role="img">
      <span className="hud-caption">Fuel</span>
      <div className="stat-bar-track tone-amber">
        <div className="stat-bar-fill" ref={fill} />
      </div>
      <span className="num hud-caption" ref={caption}>
        0%
      </span>
    </div>
  );
};

/** Local player energy (build/ability resource). */
export const EnergyMeter = () => {
  const fill = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  useHudFrame(() => {
    const row = myRow();
    const energy = row?.[4] ?? 0;
    if (fill.current)
      fill.current.style.width = `${Math.max(0, Math.min(100, energy))}%`;
    if (caption.current) caption.current.textContent = `${Math.round(energy)}`;
  });
  return (
    <div aria-label="Energy" className="energy-meter" role="img">
      <span className="hud-caption">Energy</span>
      <div className="stat-bar-track tone-blue">
        <div className="stat-bar-fill" ref={fill} />
      </div>
      <span className="num hud-caption" ref={caption}>
        0
      </span>
    </div>
  );
};

/** Team XP toward the next upgrade pick. */
export const XPBar = () => {
  const fill = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  useHudFrame(() => {
    const room = frameRefs.room;
    const xp = frameRefs.snap?.xp ?? 0;
    const level = frameRefs.snap?.lvl ?? room?.teamLevel ?? 1;
    const next = room?.nextXpThreshold ?? 60;
    if (fill.current)
      fill.current.style.width = `${Math.max(0, Math.min(1, xp / next)) * 100}%`;
    if (caption.current) caption.current.textContent = `Lv ${level}`;
  });
  return (
    <div aria-label="Team experience" className="xp-bar" role="img">
      <div className="stat-bar-track tone-green">
        <div className="stat-bar-fill" ref={fill} />
      </div>
      <span className="num hud-caption" ref={caption}>
        Lv 1
      </span>
    </div>
  );
};
