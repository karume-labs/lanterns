import type { InputState, RoomState, Snapshot } from "@lanterns/domain";
import { Application } from "pixi.js";
import { useEffect, useRef } from "react";
import { setCurrentInput } from "../input/current-input";
import { attachKeyboard } from "../input/keyboard";
import { COLORS, VIEW_H, VIEW_W } from "./config";
import { Scene } from "./scene";

interface GameViewProps {
  room: RoomState | null;
  snap: Snapshot | null;
  playerId: string | null;
  onInput: (input: InputState) => void;
}

/**
 * Fixed low-resolution buffer upscaled by whole numbers only, so pixels stay
 * square and crisp at every window size.
 */
export const GameView = ({ room, snap, playerId, onInput }: GameViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomRef = useRef(room);
  const snapRef = useRef(snap);
  const playerRef = useRef(playerId);
  const inputRef = useRef(onInput);
  roomRef.current = room;
  snapRef.current = snap;
  playerRef.current = playerId;
  inputRef.current = onInput;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let detachResize: (() => void) | undefined;
    const app = new Application();
    void app
      .init({
        canvas,
        width: VIEW_W,
        height: VIEW_H,
        resolution: 1,
        autoDensity: false,
        antialias: false,
        background: COLORS.night,
      })
      .then(() => {
        if (disposed) return;
        const scene = new Scene(app.stage);
        const resize = () => {
          const scale = Math.max(
            1,
            Math.floor(
              Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H),
            ),
          );
          canvas.style.width = `${VIEW_W * scale}px`;
          canvas.style.height = `${VIEW_H * scale}px`;
        };
        resize();
        window.addEventListener("resize", resize);
        detachResize = () => window.removeEventListener("resize", resize);
        app.ticker.add(() => {
          const dt = Math.min(0.1, app.ticker.deltaMS / 1000);
          scene.update(dt, {
            room: roomRef.current,
            snap: snapRef.current,
            playerId: playerRef.current,
          });
        });
      });
    return () => {
      disposed = true;
      detachResize?.();
      app.destroy(true);
    };
  }, []);

  useEffect(
    () =>
      attachKeyboard((input) => {
        setCurrentInput(input);
        inputRef.current(input);
      }),
    [],
  );

  return (
    <canvas
      aria-label="Lanterns game world"
      className="game-canvas"
      ref={canvasRef}
    />
  );
};
