import type { GameCommand, GameStateSnapshot } from "@/lib/game/types";

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
  "room:join": (roomId: string) => void;
  "game:command": (message: Extract<RealtimeMessage, { kind: "command" }>) => void;
  "game:snapshot": (message: Extract<RealtimeMessage, { kind: "snapshot" }>) => void;
}

export interface ServerToClientEvents {
  "game:command": (message: Extract<RealtimeMessage, { kind: "command" }>) => void;
  "game:snapshot": (message: Extract<RealtimeMessage, { kind: "snapshot" }>) => void;
  "room:presence": (payload: { roomId: string; viewers: number }) => void;
}
