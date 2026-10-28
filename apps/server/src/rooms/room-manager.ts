import type { InputState, Role, RoomState } from "@lanterns/domain";
import {
  pickUpgrade,
  place,
  requestStart,
  returnToLobby,
  selectRole,
  setInput,
} from "./actions";
import { createRoom, joinRoom, rejoinRoom } from "./joining";
import { disconnect, leaveRoom } from "./leaving";
import { setPause } from "./pause";
import type { MutationResult, RuntimeRoom, TickResult } from "./runtime";
import { tickRoom } from "./tick";
import { watchRoom } from "./watching";

export interface RoomManager {
  readonly roomCount: number;
  readonly playerCount: number;
  createRoom(
    playerId: string,
    name: string,
    socketId: string,
  ): { room: RoomState; token: string };
  joinRoom(
    code: string,
    playerId: string,
    name: string,
    socketId: string,
  ): MutationResult & { token: string };
  watchRoom(
    code: string,
    playerId: string,
    name: string,
    socketId: string,
  ): MutationResult & { token: string };
  rejoinRoom(
    token: string,
    socketId: string,
  ): MutationResult & { playerId: string };
  leaveRoom(playerId: string, socketId: string): MutationResult | null;
  disconnect(
    roomCode: string | undefined,
    playerId: string,
    socketId: string,
    now: number,
  ): MutationResult | null;
  setInput(code: string, playerId: string, input: InputState): void;
  selectRole(code: string, playerId: string, role: Role): MutationResult;
  requestStart(code: string, playerId: string, now: number): MutationResult;
  returnToLobby(code: string, playerId: string, now: number): MutationResult;
  chooseUpgrade(
    code: string,
    playerId: string,
    upgradeId: string,
  ): MutationResult;
  setPause(
    code: string,
    playerId: string,
    paused: boolean,
    now: number,
  ): MutationResult;
  placeConstruct(
    code: string,
    playerId: string,
    position: { x: number; y: number },
    kind: "wall" | "turret" | undefined,
    now: number,
  ): void;
  tick(now: number): TickResult[];
}

/** All room state lives in this closure; one manager per server process. */
export const createRoomManager = (): RoomManager => {
  const rooms = new Map<string, RuntimeRoom>();

  return {
    get roomCount() {
      return rooms.size;
    },
    get playerCount() {
      let total = 0;
      for (const room of rooms.values()) total += room.state.players.length;
      return total;
    },
    createRoom: (playerId, name, socketId) =>
      createRoom(rooms, playerId, name, socketId),
    joinRoom: (code, playerId, name, socketId) =>
      joinRoom(rooms, code, playerId, name, socketId),
    watchRoom: (code, playerId, name, socketId) =>
      watchRoom(rooms, code, playerId, name, socketId),
    rejoinRoom: (token, socketId) => rejoinRoom(rooms, token, socketId),
    leaveRoom: (playerId, socketId) => {
      const left = leaveRoom(rooms, playerId, socketId);
      return left
        ? { room: left.room.state, events: left.events, levelUp: false }
        : null;
    },
    disconnect: (roomCode, playerId, socketId, now) => {
      const room = disconnect(rooms, roomCode, playerId, socketId, now);
      return room ? { room: room.state, events: [], levelUp: false } : null;
    },
    setInput: (code, playerId, input) => setInput(rooms, code, playerId, input),
    selectRole: (code, playerId, role) =>
      selectRole(rooms, code, playerId, role),
    requestStart: (code, playerId, now) =>
      requestStart(rooms, code, playerId, now),
    returnToLobby: (code, playerId, now) =>
      returnToLobby(rooms, code, playerId, now),
    chooseUpgrade: (code, playerId, upgradeId) =>
      pickUpgrade(rooms, code, playerId, upgradeId),
    setPause: (code, playerId, paused, now) =>
      setPause(rooms, code, playerId, paused, now),
    placeConstruct: (code, playerId, position, kind, now) =>
      place(rooms, code, playerId, position, kind, now),
    tick: (now) => {
      const results: TickResult[] = [];
      for (const [code, room] of rooms) {
        const result = tickRoom(room, now);
        if (result) results.push(result);
        else rooms.delete(code);
      }
      return results;
    },
  };
};
