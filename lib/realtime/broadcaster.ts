import { DEFAULT_BATTLE_CONFIG } from "@/lib/game/config";
import type { GameCommand, GameStateSnapshot } from "@/lib/game/types";
import { LocalBroadcastTransport } from "./broadcastChannel";
import { SocketRealtimeAdapter } from "./socketAdapter";
import type { RealtimeMode, RealtimeRole, RealtimeStatus } from "./socketTypes";

const CHANNEL_PREFIX = "tiktok-live-battle-arena";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "";

export function getRealtimeMode(): RealtimeMode {
  return process.env.NEXT_PUBLIC_REALTIME_MODE === "socket" ? "socket" : "local";
}

export function getRealtimeRoomId() {
  return process.env.NEXT_PUBLIC_ROOM_ID?.trim() || DEFAULT_BATTLE_CONFIG.roomId;
}

export class RealtimeBroadcaster {
  private transport: LocalBroadcastTransport;

  private socket?: SocketRealtimeAdapter;

  private statusListeners = new Set<(status: RealtimeStatus) => void>();

  private status: RealtimeStatus;

  constructor(
    public roomId = getRealtimeRoomId(),
    private role: RealtimeRole = "observer",
    private mode = getRealtimeMode(),
  ) {
    this.transport = new LocalBroadcastTransport(`${CHANNEL_PREFIX}:${roomId}`);
    this.status = {
      mode,
      roomId,
      role,
      socketState: mode === "socket" ? "connecting" : "disabled",
      socketUrl: SOCKET_URL,
      connected: mode === "local",
      localFallback: true,
      message: mode === "socket" ? "Socket realtime enabled." : "Local realtime mode.",
    };

    if (mode === "socket") {
      // Remote /control and /live sync plugs in here; the local transport stays
      // available for same-browser fallback when the relay is unreachable.
      this.socket = new SocketRealtimeAdapter(roomId, role, SOCKET_URL);
      this.socket.onStatus((status) => this.setStatus(status));
      void this.socket.connect();
    }
  }

  sendCommand(command: GameCommand) {
    if (this.shouldUseLocalFallback()) {
      this.transport.post({ kind: "command", roomId: this.roomId, command });
    }
    this.socket?.sendCommand(command);
  }

  sendSnapshot(snapshot: GameStateSnapshot) {
    if (this.shouldUseLocalFallback()) {
      this.transport.post({ kind: "snapshot", roomId: this.roomId, snapshot });
    }
    this.socket?.sendSnapshot(snapshot);
  }

  onCommand(listener: (command: GameCommand) => void) {
    const unsubscribe = this.transport.subscribe((message) => {
      if (message.kind === "command" && message.roomId === this.roomId) {
        listener(message.command);
      }
    });
    const unsubscribeSocket = this.socket?.onCommand(listener);
    return () => {
      unsubscribe();
      unsubscribeSocket?.();
    };
  }

  onSnapshot(listener: (snapshot: GameStateSnapshot) => void) {
    const unsubscribe = this.transport.subscribe((message) => {
      if (message.kind === "snapshot" && message.roomId === this.roomId) {
        listener(message.snapshot);
      }
    });
    const unsubscribeSocket = this.socket?.onSnapshot(listener);
    return () => {
      unsubscribe();
      unsubscribeSocket?.();
    };
  }

  onStatus(listener: (status: RealtimeStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  close() {
    this.transport.close();
    this.socket?.disconnect();
    this.statusListeners.clear();
  }

  private setStatus(status: RealtimeStatus) {
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private shouldUseLocalFallback() {
    return this.mode === "local" || !this.status.connected;
  }
}

export function createRealtimeBroadcaster(roomId = getRealtimeRoomId(), role: RealtimeRole = "observer") {
  return new RealtimeBroadcaster(roomId, role);
}
