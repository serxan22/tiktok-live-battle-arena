import type { GameCommand, GameStateSnapshot } from "@/lib/game/types";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  RealtimeRole,
  RealtimeStatus,
  RoomPresencePayload,
  ServerToClientEvents,
  SocketConnectionState,
} from "./socketTypes";

type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;
type CommandListener = (command: GameCommand) => void;
type SnapshotListener = (snapshot: GameStateSnapshot) => void;
type StatusListener = (status: RealtimeStatus) => void;

export class SocketRealtimeAdapter {
  private socket?: SocketClient;

  private readonly senderId = `socket_${Math.random().toString(36).slice(2)}`;

  private socketState: SocketConnectionState = "disabled";

  private presence?: RoomPresencePayload;

  private commandListeners = new Set<CommandListener>();

  private snapshotListeners = new Set<SnapshotListener>();

  private statusListeners = new Set<StatusListener>();

  constructor(
    private roomId: string,
    private role: RealtimeRole,
    private url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "",
  ) {}

  async connect() {
    if (!this.url || this.socket) {
      this.socketState = this.url ? this.socketState : "disabled";
      this.emitStatus(this.url ? undefined : "Socket mode disabled or NEXT_PUBLIC_SOCKET_URL missing.");
      return false;
    }

    this.socketState = "connecting";
    this.emitStatus("Connecting to realtime relay...");

    const { io } = await import("socket.io-client");
    this.socket = io(this.url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      this.socketState = "connected";
      this.socket?.emit("room:join", {
        roomId: this.roomId,
        role: this.role,
        clientId: this.senderId,
      });
      this.emitStatus("Connected to realtime relay.");
    });

    this.socket.on("disconnect", (reason) => {
      this.socketState = "disconnected";
      this.emitStatus(`Socket disconnected: ${reason}`);
    });

    this.socket.io.on("reconnect_attempt", () => {
      this.socketState = "reconnecting";
      this.emitStatus("Reconnecting to realtime relay...");
    });

    this.socket.io.on("reconnect", () => {
      this.socketState = "connected";
      this.emitStatus("Reconnected to realtime relay.");
    });

    this.socket.io.on("error", (error) => {
      this.socketState = "error";
      this.emitStatus(error.message || "Socket connection error.");
    });

    this.socket.on("connect_error", (error) => {
      this.socketState = "error";
      this.emitStatus(error.message || "Socket connection error.");
    });

    this.socket.on("room:presence", (payload) => {
      if (payload.roomId !== this.roomId) {
        return;
      }
      this.presence = payload;
      this.emitStatus("Room presence updated.");
    });

    this.socket.on("game:command", (message) => {
      if (message.roomId === this.roomId && message.senderId !== this.senderId) {
        for (const listener of this.commandListeners) {
          listener(message.command);
        }
      }
    });

    this.socket.on("game:snapshot", (message) => {
      if (message.roomId === this.roomId && message.senderId !== this.senderId) {
        for (const listener of this.snapshotListeners) {
          listener(message.snapshot);
        }
      }
    });

    return true;
  }

  sendCommand(command: GameCommand) {
    this.socket?.emit("game:command", {
      kind: "command",
      roomId: this.roomId,
      command,
      senderId: this.senderId,
      sentAt: Date.now(),
    });
  }

  sendSnapshot(snapshot: GameStateSnapshot) {
    this.socket?.emit("game:snapshot", {
      kind: "snapshot",
      roomId: this.roomId,
      snapshot,
      senderId: this.senderId,
      sentAt: Date.now(),
    });
  }

  onCommand(listener: (command: GameCommand) => void) {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  onSnapshot(listener: (snapshot: GameStateSnapshot) => void) {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  }

  onStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
    this.socketState = this.url ? "disconnected" : "disabled";
    this.emitStatus("Socket adapter disconnected.");
  }

  private getStatus(message?: string): RealtimeStatus {
    return {
      mode: "socket",
      roomId: this.roomId,
      role: this.role,
      socketState: this.socketState,
      socketUrl: this.url,
      connected: this.socketState === "connected",
      localFallback: true,
      presence: this.presence,
      message,
    };
  }

  private emitStatus(message?: string) {
    const status = this.getStatus(message);
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}
