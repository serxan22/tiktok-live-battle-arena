"use client";

import type { GameStateSnapshot } from "@/lib/game/types";

export function DebugPanel({ snapshot }: { snapshot: GameStateSnapshot }) {
  if (!snapshot.debug) {
    return null;
  }

  return (
    <div className="live-debug-panel">
      <div>tick: {snapshot.tick}</div>
      <div>players: {snapshot.players.length}</div>
      <div>effects: {snapshot.effects.length}</div>
      <div>damage: {snapshot.damageNumbers.length}</div>
      <div>room: {snapshot.roomId}</div>
    </div>
  );
}
