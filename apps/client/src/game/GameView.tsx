import { Application } from "pixi.js";
import { useEffect, useRef } from "react";
import { dispatchInput } from "../input/current-input";
import { attachKeyboard } from "../input/keyboard";
import { COLORS, VIEW_H, VIEW_W } from "./config";
import { frameRefs } from "./frame-refs";
import { Scene } from "./scene";

/**
 * Fixed low-resolution buffer upscaled by whole numbers only, so pixels stay
 * square and crisp at every window size. Snapshot data arrives through
 * `frame-refs`, never React props, so the overlay never re-renders at 15 Hz.
 */
export const GameView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
            room: frameRefs.room,
            snap: frameRefs.snap,
            playerId: frameRefs.playerId,
            spectating: frameRefs.spectating,
            spectateTargetId: frameRefs.spectateTargetId,
          });
        });
      });
    return () => {
      disposed = true;
      detachResize?.();
      app.destroy(true);
    };
  }, []);

  useEffect(() => attachKeyboard((input) => dispatchInput(input)), []);

  return (
    <canvas
      aria-label="Lanterns game world"
      className="game-canvas"
      ref={canvasRef}
    />
  );
};
