import { useRef, useState } from "react";

interface JoystickProps {
  label: string;
  /** Normalized [-1, 1] axis values; (0, 0) on release. */
  onMove: (x: number, y: number) => void;
}

const KNOB_RADIUS_PX = 46;

type Source = "pointer" | "touch";

/**
 * One-thumb virtual stick. Pointer Events cover mouse/pen and most touch
 * stacks, but Firefox on Android is unreliable with them (the pointer stream
 * can be cancelled by the browser's own gesture handling), so touch events
 * act as a parallel path. A single claimed source per gesture keeps the two
 * paths from double-firing.
 */
export const Joystick = ({ label, onMove }: JoystickProps) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const touchId = useRef<number | null>(null);
  const source = useRef<Source | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const apply = (clientX: number, clientY: number): void => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(length, KNOB_RADIUS_PX);
    const nx = (dx / length) * clamped;
    const ny = (dy / length) * clamped;
    setKnob({ x: nx, y: ny });
    onMove(nx / KNOB_RADIUS_PX, ny / KNOB_RADIUS_PX);
  };

  const release = (): void => {
    pointerId.current = null;
    touchId.current = null;
    source.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  // No unmount cleanup needed: the parent's input ref is dropped with this
  // component, so a drag cut short by leaving the match cannot stick.

  return (
    <div
      aria-label={label}
      className="stick"
      onPointerCancel={(event) => {
        if (
          source.current === "pointer" &&
          pointerId.current === event.pointerId
        )
          release();
      }}
      onPointerDown={(event) => {
        if (touchId.current !== null) return;
        source.current = "pointer";
        pointerId.current = event.pointerId;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // synthetic pointers have no capture target
        }
        apply(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (
          source.current !== "pointer" ||
          pointerId.current !== event.pointerId
        )
          return;
        apply(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (pointerId.current === event.pointerId) release();
      }}
      ref={baseRef}
      role="application"
      onTouchCancel={() => {
        if (source.current === "touch") release();
      }}
      onTouchEnd={() => {
        if (source.current === "touch") release();
      }}
      onTouchMove={(event) => {
        if (source.current !== "touch") return;
        const wanted = touchId.current;
        const touch = Array.from(event.touches).find(
          (entry) => entry.identifier === wanted,
        );
        if (!touch) return;
        apply(touch.clientX, touch.clientY);
      }}
      onTouchStart={(event) => {
        if (pointerId.current !== null || touchId.current !== null) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        source.current = "touch";
        touchId.current = touch.identifier;
        apply(touch.clientX, touch.clientY);
      }}
    >
      <span
        className="knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
};
