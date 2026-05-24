"use client";

import { create } from "zustand";
import { getBattleEventBus } from "./eventBus";
import type { GameCommand, GameStateSnapshot } from "./types";
import { getRealtimeRoomId } from "@/lib/realtime/broadcaster";
import type { RealtimeRole, RealtimeStatus } from "@/lib/realtime/socketTypes";

interface BattleStore {
  roomId: string;
  role: RealtimeRole;
  connected: boolean;
  realtimeStatus?: RealtimeStatus;
  snapshot?: GameStateSnapshot;
  connect: (roomId?: string, role?: RealtimeRole) => () => void;
  sendCommand: (command: GameCommand) => void;
  setSnapshot: (snapshot: GameStateSnapshot) => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  roomId: getRealtimeRoomId(),
  role: "controller",
  connected: false,
  realtimeStatus: undefined,
  snapshot: undefined,
  connect: (roomId = getRealtimeRoomId(), role = "controller") => {
    const bus = getBattleEventBus(roomId, role);
    set({ roomId, role, connected: true });
    const unsubscribe = bus.onSnapshot((snapshot) => {
      set({ snapshot });
    });
    const unsubscribeStatus = bus.onStatus((status) => {
      set({ realtimeStatus: status, connected: status.mode === "local" || status.connected });
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
      set({ connected: false, realtimeStatus: undefined });
    };
  },
  sendCommand: (command) => {
    const bus = getBattleEventBus(get().roomId, get().role);
    bus.sendCommand(command);
  },
  setSnapshot: (snapshot) => set({ snapshot }),
}));
