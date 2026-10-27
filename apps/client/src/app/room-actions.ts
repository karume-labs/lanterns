import { setPlayerIdRef, setRoomRef } from "../game/frame-refs";
import { getSocket } from "../net/connection";
import { useAppStore } from "./store";

/** Leave the current room: tell the server, then drop all local room state. */
export const leaveRoom = (): void => {
  getSocket()?.leaveRoom();
  const store = useAppStore.getState();
  store.setRoom(null);
  store.setStats(null);
  store.setLevelUp(null);
  store.setPlayerId(null);
  setRoomRef(null);
  setPlayerIdRef(null);
  store.go("menu");
};

/** Host path back to the hub after a finished match. */
export const returnToLobby = (): void => {
  getSocket()?.returnToLobby();
  useAppStore.getState().setStats(null);
  useAppStore.getState().setLevelUp(null);
};
