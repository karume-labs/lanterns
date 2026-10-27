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
  store.setSpectator(false);
  setRoomRef(null);
  setPlayerIdRef(null);
  store.go("menu");
};

/**
 * A reconnect found no room left (server restarted, room expired): drop the
 * local room state so the player lands on the menu instead of a dead match.
 */
export const dropRoomLocally = (): void => {
  getSocket()?.forgetToken();
  const store = useAppStore.getState();
  store.setRoom(null);
  store.setStats(null);
  store.setLevelUp(null);
  store.setPlayerId(null);
  store.setSpectator(false);
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
