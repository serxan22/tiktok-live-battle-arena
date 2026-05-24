"use client";

import { GIFT_ATTACKS } from "@/lib/game/gifts";
import type { GameStateSnapshot } from "@/lib/game/types";
import { Sparkles } from "lucide-react";

interface GiftActionListProps {
  snapshot: GameStateSnapshot;
}

export function GiftActionList({ snapshot }: GiftActionListProps) {
  return (
    <section className="pointer-events-none absolute bottom-6 left-6 right-6 z-20">
      <div className="arena-glass mx-auto max-w-[968px] px-4 py-3">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-black uppercase text-slate-300">
          <Sparkles size={16} />
          Gift attack deck
        </div>
        <div className="grid grid-cols-6 gap-2">
          {GIFT_ATTACKS.map((gift) => {
            const remaining = snapshot.giftCooldowns[gift.id] ?? 0;
            const isCooling = remaining > 0;

            return (
              <div key={gift.id} className={`gift-chip ${isCooling ? "opacity-55" : ""}`}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/10 text-[12px] font-black text-white">
                  {gift.icon}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-black text-white">{gift.label}</div>
                  <div className="truncate text-[11px] font-bold uppercase text-slate-400">
                    {isCooling ? `${Math.ceil(remaining / 1000)}s` : gift.tier}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
