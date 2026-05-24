import type { GameCommand, GameStateSnapshot } from "./types";
import { getRealtimeRoomId, RealtimeBroadcaster } from "@/lib/realtime/broadcaster";
import type { RealtimeRole } from "@/lib/realtime/socketTypes";

let sharedBus: RealtimeBroadcaster | undefined;
let sharedRoom = getRealtimeRoomId();
let sharedRole: RealtimeRole = "observer";

export function getBattleEventBus(roomId = getRealtimeRoomId(), role: RealtimeRole = "observer") {
  if (!sharedBus || sharedRoom !== roomId || sharedRole !== role) {
    sharedBus?.close();
    sharedRoom = roomId;
    sharedRole = role;
    sharedBus = new RealtimeBroadcaster(roomId, role);
  }

  return sharedBus;
}

export function publishGameCommand(command: GameCommand, roomId = getRealtimeRoomId()) {
  getBattleEventBus(roomId).sendCommand(command);
}

export function publishGameSnapshot(snapshot: GameStateSnapshot, roomId = getRealtimeRoomId()) {
  getBattleEventBus(roomId).sendSnapshot(snapshot);
}
