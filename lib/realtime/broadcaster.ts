import { DEFAULT_BATTLE_CONFIG } from "@/lib/game/config";
import type { GameCommand, GameStateSnapshot } from "@/lib/game/types";
import { LocalBroadcastTransport } from "./broadcastChannel";
import { SocketRealtimeAdapter } from "./socketAdapter";

const CHANNEL_PREFIX = "tiktok-live-battle-arena";

export class RealtimeBroadcaster {
  private transport: LocalBroadcastTransport;

  private socket: SocketRealtimeAdapter;

  constructor(public roomId = DEFAULT_BATTLE_CONFIG.roomId) {
    this.transport = new LocalBroadcastTransport(`${CHANNEL_PREFIX}:${roomId}`);
    this.socket = new SocketRealtimeAdapter(roomId);
    void this.socket.connect();
  }

  sendCommand(command: GameCommand) {
    this.transport.post({ kind: "command", roomId: this.roomId, command });
    this.socket.sendCommand(command);
  }

  sendSnapshot(snapshot: GameStateSnapshot) {
    this.transport.post({ kind: "snapshot", roomId: this.roomId, snapshot });
    this.socket.sendSnapshot(snapshot);
  }

  onCommand(listener: (command: GameCommand) => void) {
    const unsubscribe = this.transport.subscribe((message) => {
      if (message.kind === "command" && message.roomId === this.roomId) {
        listener(message.command);
      }
    });
    this.socket.onCommand(listener);
    return unsubscribe;
  }

  onSnapshot(listener: (snapshot: GameStateSnapshot) => void) {
    const unsubscribe = this.transport.subscribe((message) => {
      if (message.kind === "snapshot" && message.roomId === this.roomId) {
        listener(message.snapshot);
      }
    });
    this.socket.onSnapshot(listener);
    return unsubscribe;
  }

  close() {
    this.transport.close();
    this.socket.disconnect();
  }
}

export function createRealtimeBroadcaster(roomId = DEFAULT_BATTLE_CONFIG.roomId) {
  return new RealtimeBroadcaster(roomId);
}
