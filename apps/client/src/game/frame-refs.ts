import type { RoomState, Snapshot } from "@lanterns/domain";

/**
 * Snapshot-rate data lives here, never in React state. The socket writer
 * updates these; the Pixi ticker and HUD rAF loops read them.
 */
export interface FrameRefs {
  room: RoomState | null;
  snap: Snapshot | null;
  playerId: string | null;
  /** Camera-follows-teammates mode driven by the spectate overlay. */
  spectating: boolean;
  spectateTargetId: string | null;
  /** Mirrored from settings so game/ never imports the store. */
  shakeEnabled: boolean;
  damageNumbers: boolean;
}

export const frameRefs: FrameRefs = {
  room: null,
  snap: null,
  playerId: null,
  spectating: false,
  spectateTargetId: null,
  shakeEnabled: true,
  damageNumbers: true,
};

export const setSpectating = (
  on: boolean,
  targetId: string | null = null,
): void => {
  frameRefs.spectating = on;
  frameRefs.spectateTargetId = on ? targetId : null;
};

export const setFxFlags = (shake: boolean, numbers: boolean): void => {
  frameRefs.shakeEnabled = shake;
  frameRefs.damageNumbers = numbers;
};

export const setRoomRef = (room: RoomState | null): void => {
  frameRefs.room = room;
  if (!room) frameRefs.snap = null;
};

export const setSnapRef = (snap: Snapshot): void => {
  frameRefs.snap = snap;
};

export const setPlayerIdRef = (playerId: string | null): void => {
  frameRefs.playerId = playerId;
};
