"use client";

import { create } from "zustand";
import { DEFAULT_BATTLE_CONFIG } from "./config";
import { getBattleEventBus } from "./eventBus";
import type { GameCommand, GameStateSnapshot } from "./types";

interface BattleStore {
  roomId: string;
  connected: boolean;
  snapshot?: GameStateSnapshot;
  connect: (roomId?: string) => () => void;
  sendCommand: (command: GameCommand) => void;
  setSnapshot: (snapshot: GameStateSnapshot) => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  roomId: DEFAULT_BATTLE_CONFIG.roomId,
  connected: false,
  snapshot: undefined,
  connect: (roomId = DEFAULT_BATTLE_CONFIG.roomId) => {
    const bus = getBattleEventBus(roomId);
    set({ roomId, connected: true });
    const unsubscribe = bus.onSnapshot((snapshot) => {
      set({ snapshot });
    });

    return () => {
      unsubscribe();
      set({ connected: false });
    };
  },
  sendCommand: (command) => {
    const bus = getBattleEventBus(get().roomId);
    bus.sendCommand(command);
  },
  setSnapshot: (snapshot) => set({ snapshot }),
}));
