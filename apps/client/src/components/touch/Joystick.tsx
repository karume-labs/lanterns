import { useRef, useState } from "react";

interface JoystickProps {
  label: string;
  /** Normalized [-1, 1] axis values; (0, 0) on release. */
  onMove: (x: number, y: number) => void;
}

const KNOB_RADIUS_PX = 46;

/** One-thumb virtual stick using Pointer Events so multi-touch just works. */
export const Joystick = ({ label, onMove }: JoystickProps) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const track = (clientX: number, clientY: number, id: number): void => {
    if (pointerId.current !== id) return;
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

  const release = (id: number): void => {
    if (pointerId.current !== id) return;
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      aria-label={label}
      className="stick"
      onPointerCancel={(event) => release(event.pointerId)}
      onPointerDown={(event) => {
        pointerId.current = event.pointerId;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // synthetic pointers have no capture target
        }
        track(event.clientX, event.clientY, event.pointerId);
      }}
      onPointerMove={(event) =>
        track(event.clientX, event.clientY, event.pointerId)
      }
      onPointerUp={(event) => release(event.pointerId)}
      ref={baseRef}
      role="application"
    >
      <span
        className="knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
};
