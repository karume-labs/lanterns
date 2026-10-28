import type {
  MatchStats,
  RoomEvent,
  RoomState,
  Snapshot,
  UpgradeChoice,
} from "@lanterns/domain";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

export interface SocketHandlers {
  onStatus: (status: ConnectionStatus) => void;
  onRoom: (room: RoomState) => void;
  onSnapshot: (snap: Snapshot) => void;
  onEvent: (event: RoomEvent, playerId?: string, name?: string) => void;
  onLevelUp: (choices: UpgradeChoice[], level: number) => void;
  onMatchEnded: (stats: MatchStats, outcome: "won" | "lost") => void;
  onNotice: (message: string) => void;
  onError: (message: string, code?: string) => void;
  onLatency: (ms: number) => void;
  onWelcome: (playerId: string, roomCode: string, spectator: boolean) => void;
}
