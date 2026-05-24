import { DEFAULT_BATTLE_CONFIG } from "./config";
import type { GameCommand, GameStateSnapshot } from "./types";
import { RealtimeBroadcaster } from "@/lib/realtime/broadcaster";

let sharedBus: RealtimeBroadcaster | undefined;
let sharedRoom = DEFAULT_BATTLE_CONFIG.roomId;

export function getBattleEventBus(roomId = DEFAULT_BATTLE_CONFIG.roomId) {
  if (!sharedBus || sharedRoom !== roomId) {
    sharedBus?.close();
    sharedRoom = roomId;
    sharedBus = new RealtimeBroadcaster(roomId);
  }

  return sharedBus;
}

export function publishGameCommand(command: GameCommand, roomId = DEFAULT_BATTLE_CONFIG.roomId) {
  getBattleEventBus(roomId).sendCommand(command);
}

export function publishGameSnapshot(snapshot: GameStateSnapshot, roomId = DEFAULT_BATTLE_CONFIG.roomId) {
  getBattleEventBus(roomId).sendSnapshot(snapshot);
}
