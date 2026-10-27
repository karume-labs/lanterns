import type { RoomEventMsg, RuntimeRoom } from "./runtime";

/** Remove a player and hand the host role to the next connected player. */
export const removePlayer = (
  room: RuntimeRoom,
  playerId: string,
): RoomEventMsg[] => {
  const events: RoomEventMsg[] = [];
  const player = room.state.players.find(
    (candidate) => candidate.id === playerId,
  );
  if (player) {
    room.state.players = room.state.players.filter(
      (candidate) => candidate.id !== playerId,
    );
    events.push({ event: "player-left", playerId, name: player.name });
  }
  for (const [token, owner] of room.tokens)
    if (owner === playerId) room.tokens.delete(token);
  room.sockets.delete(playerId);
  room.disconnectedAt.delete(playerId);
  room.rt.inputs.delete(playerId);
  room.rt.pendingAbility.delete(playerId);
  room.rt.pendingPlace.delete(playerId);
  room.prevReady.delete(playerId);
  room.dirty = true;

  if (room.state.hostId === playerId && room.state.players.length > 0) {
    const next = room.state.players.find((candidate) => candidate.connected);
    if (next) {
      room.state.hostId = next.id;
      events.push({ event: "host-changed", playerId: next.id });
    }
  }
  return events;
};

type Rooms = Map<string, RuntimeRoom>;

/** Drop a watcher, its socket, and any token pointing at it. */
const removeSpectator = (room: RuntimeRoom, playerId: string): boolean => {
  if (!room.spectators.delete(playerId)) return false;
  for (const [token, owner] of room.tokens)
    if (owner === playerId) room.tokens.delete(token);
  room.sockets.delete(playerId);
  room.disconnectedAt.delete(playerId);
  return true;
};

/** Explicit leave: remove the player immediately, no idle post. */
export const leaveRoom = (
  rooms: Rooms,
  playerId: string,
  socketId: string,
): { events: RoomEventMsg[]; room: RuntimeRoom } | null => {
  for (const room of rooms.values()) {
    if (!room.state.players.some((player) => player.id === playerId)) {
      if (room.sockets.get(playerId) === socketId)
        removeSpectator(room, playerId);
      continue;
    }
    if (room.sockets.get(playerId) !== socketId) continue;
    const events = removePlayer(room, playerId);
    if (room.state.players.length === 0) {
      rooms.delete(room.state.code);
      return null;
    }
    return { events, room };
  }
  return null;
};

/** Socket closed: keep the player as an idle post inside the grace window. */
export const disconnect = (
  rooms: Rooms,
  roomCode: string | undefined,
  playerId: string,
  socketId: string,
  now: number,
): RuntimeRoom | null => {
  if (!roomCode) return null;
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.sockets.get(playerId) !== socketId) return null; // stale socket
  if (!room.state.players.some((player) => player.id === playerId)) {
    // Watchers get the same reconnect window as players; the tick expires
    // them through removePlayer once it runs out.
    if (room.spectators.has(playerId)) {
      room.sockets.delete(playerId);
      room.disconnectedAt.set(playerId, now);
    }
    return null;
  }
  room.sockets.delete(playerId);
  room.disconnectedAt.set(playerId, now);
  const player = room.state.players.find(
    (candidate) => candidate.id === playerId,
  );
  if (player) player.connected = false;
  room.dirty = true;
  return room;
};
