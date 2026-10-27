import type {
  ClientMessage,
  InputState,
  Role,
  Vector2,
} from "@lanterns/domain";
import type { ConnectionStatus, SocketHandlers } from "./handlers";
import { routeServerMessage } from "./route-message";

export type { ConnectionStatus, SocketHandlers };

const RECONNECT_TOKEN_KEY = "lanterns-reconnect-token";
const PLAYER_ID_KEY = "lanterns-player-id";

/** Reconnecting WebSocket client with latency probes and a stored token. */
export class GameSocket {
  #socket: WebSocket | null = null;
  #retryTimer: number | null = null;
  #pingTimer: number | null = null;
  #reconnectToken = localStorage.getItem(RECONNECT_TOKEN_KEY);
  #shouldReconnect = true;
  #attempts = 0;

  constructor(private readonly handlers: SocketHandlers) {}

  connect(): void {
    this.handlers.onStatus(this.#socket ? "reconnecting" : "connecting");
    const socket = new WebSocket(serverUrl());
    this.#socket = socket;

    socket.addEventListener("open", () => {
      this.#attempts = 0;
      this.handlers.onStatus("connected");
      if (this.#reconnectToken)
        this.#send({ type: "rejoin-room", token: this.#reconnectToken });
      this.#startPing();
    });
    socket.addEventListener("message", (event) =>
      routeServerMessage(String(event.data), this.handlers, (token, id) => {
        this.#reconnectToken = token;
        localStorage.setItem(RECONNECT_TOKEN_KEY, token);
        localStorage.setItem(PLAYER_ID_KEY, id);
      }),
    );
    socket.addEventListener("close", () => {
      this.#stopPing();
      this.#scheduleReconnect();
    });
    socket.addEventListener("error", () => this.handlers.onStatus("offline"));
  }

  createRoom(name: string): void {
    this.#send({ type: "create-room", name });
  }

  joinRoom(code: string, name: string): void {
    this.#send({ type: "join-room", code, name });
  }

  leaveRoom(): void {
    this.#send({ type: "leave-room" });
    this.forgetToken();
  }

  /** Drop the stored identity without messaging the server (room is gone). */
  forgetToken(): void {
    this.#reconnectToken = null;
    localStorage.removeItem(RECONNECT_TOKEN_KEY);
    localStorage.removeItem(PLAYER_ID_KEY);
  }

  sendInput(input: InputState): void {
    this.#send({ type: "input", input });
  }

  selectRole(role: Role): void {
    this.#send({ type: "select-role", role });
  }

  startMatch(): void {
    this.#send({ type: "start-match" });
  }

  returnToLobby(): void {
    this.#send({ type: "return-lobby" });
  }

  chooseUpgrade(upgradeId: string): void {
    this.#send({ type: "choose-upgrade", upgradeId });
  }

  placeConstruct(position: Vector2, kind?: "wall" | "turret"): void {
    this.#send({ type: "place-construct", position, kind });
  }

  close(): void {
    this.#shouldReconnect = false;
    if (this.#retryTimer) window.clearTimeout(this.#retryTimer);
    this.#stopPing();
    this.#socket?.close();
  }

  #startPing(): void {
    this.#stopPing();
    this.#pingTimer = window.setInterval(() => {
      this.#send({ type: "ping", sentAt: performance.now() });
    }, 5000);
  }

  #stopPing(): void {
    if (this.#pingTimer !== null) window.clearInterval(this.#pingTimer);
    this.#pingTimer = null;
  }

  #send(message: ClientMessage): void {
    if (this.#socket?.readyState !== WebSocket.OPEN) {
      this.handlers.onError(
        "Connecting to the lantern… please try again in a moment.",
      );
      return;
    }
    this.#socket.send(JSON.stringify(message));
  }

  #scheduleReconnect(): void {
    if (!this.#shouldReconnect) return;
    this.handlers.onStatus("reconnecting");
    const delay = Math.min(5000, 500 * 2 ** this.#attempts);
    this.#attempts += 1;
    this.#retryTimer = window.setTimeout(() => this.connect(), delay);
  }
}

const serverUrl = (): string => {
  const configured = import.meta.env.VITE_SERVER_URL;
  if (configured) return configured;
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const host =
    location.port === "5173" ? `${location.hostname}:3000` : location.host;
  return `${protocol}//${host}/ws`;
};
