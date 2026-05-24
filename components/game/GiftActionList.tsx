"use client";

import { GIFT_ATTACKS } from "@/lib/game/gifts";
import type { GameStateSnapshot } from "@/lib/game/types";
import { Sparkles } from "lucide-react";

interface GiftActionListProps {
  snapshot: GameStateSnapshot;
}

export function GiftActionList({ snapshot }: GiftActionListProps) {
  return (
    <section className="live-gift-dock">
      <div className="gift-dock-title">
        <Sparkles size={14} />
        Gift attacks
      </div>
      <div className="gift-dock-grid">
        {GIFT_ATTACKS.map((gift) => {
          const remaining = snapshot.giftCooldowns[gift.id] ?? 0;
          const isCooling = remaining > 0;

          return (
            <div key={gift.id} className={`gift-chip ${isCooling ? "opacity-55" : ""}`}>
              <div className="gift-chip-icon">{gift.icon}</div>
              <div className="min-w-0">
                <div className="gift-chip-label">{gift.label}</div>
                <div className="gift-chip-meta">
                  {isCooling ? `${Math.ceil(remaining / 1000)}s` : gift.tier}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
