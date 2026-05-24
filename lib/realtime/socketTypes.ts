import type { GameCommand, GameStateSnapshot } from "@/lib/game/types";

export type RealtimeRole = "display" | "controller" | "observer";

export type RealtimeMode = "local" | "socket";

export type SocketConnectionState = "disabled" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export interface RealtimeStatus {
  mode: RealtimeMode;
  roomId: string;
  role: RealtimeRole;
  socketState: SocketConnectionState;
  socketUrl?: string;
  connected: boolean;
  localFallback: boolean;
  presence?: RoomPresencePayload;
  message?: string;
}

export interface RoomJoinPayload {
  roomId: string;
  role: RealtimeRole;
  clientId: string;
}

export interface RoomPresencePayload {
  roomId: string;
  total: number;
  displays: number;
  controllers: number;
  observers: number;
}

export type RealtimeMessage =
  | {
      kind: "command";
      roomId: string;
      command: GameCommand;
      senderId: string;
      sentAt: number;
    }
  | {
      kind: "snapshot";
      roomId: string;
      snapshot: GameStateSnapshot;
      senderId: string;
      sentAt: number;
    };

export interface ClientToServerEvents {
  "room:join": (payload: RoomJoinPayload | string) => void;
  "game:command": (message: Extract<RealtimeMessage, { kind: "command" }>) => void;
  "game:snapshot": (message: Extract<RealtimeMessage, { kind: "snapshot" }>) => void;
}

export interface ServerToClientEvents {
  "game:command": (message: Extract<RealtimeMessage, { kind: "command" }>) => void;
  "game:snapshot": (message: Extract<RealtimeMessage, { kind: "snapshot" }>) => void;
  "room:presence": (payload: RoomPresencePayload) => void;
}
