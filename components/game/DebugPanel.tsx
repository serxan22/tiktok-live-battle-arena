"use client";

import type { GameStateSnapshot } from "@/lib/game/types";

export function DebugPanel({ snapshot }: { snapshot: GameStateSnapshot }) {
  if (!snapshot.debug) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-6 top-[384px] z-30 w-[250px] rounded-lg border border-lime-300/25 bg-black/70 p-3 font-mono text-[12px] text-lime-200">
      <div>tick: {snapshot.tick}</div>
      <div>players: {snapshot.players.length}</div>
      <div>effects: {snapshot.effects.length}</div>
      <div>damage: {snapshot.damageNumbers.length}</div>
      <div>room: {snapshot.roomId}</div>
    </div>
  );
}
