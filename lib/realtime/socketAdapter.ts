import type { GameCommand, GameStateSnapshot } from "@/lib/game/types";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./socketTypes";

type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;

export class SocketRealtimeAdapter {
  private socket?: SocketClient;

  private senderId = `socket_${Math.random().toString(36).slice(2)}`;

  constructor(
    private roomId: string,
    private url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "",
  ) {}

  async connect() {
    if (!this.url || this.socket) {
      return false;
    }

    // Future relay contract: a small Node Socket.io server joins this room and
    // rebroadcasts game:command and game:snapshot to every connected client.
    // That is required when /control and /live are not in the same browser.
    const { io } = await import("socket.io-client");
    this.socket = io(this.url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    this.socket.emit("room:join", this.roomId);
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
    this.socket?.on("game:command", (message) => {
      if (message.roomId === this.roomId && message.senderId !== this.senderId) {
        listener(message.command);
      }
    });
  }

  onSnapshot(listener: (snapshot: GameStateSnapshot) => void) {
    this.socket?.on("game:snapshot", (message) => {
      if (message.roomId === this.roomId && message.senderId !== this.senderId) {
        listener(message.snapshot);
      }
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
