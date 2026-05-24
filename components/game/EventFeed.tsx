"use client";

import type { FeedItem } from "@/lib/game/types";
import { Zap } from "lucide-react";

interface EventFeedProps {
  title: string;
  items: FeedItem[];
  side?: "left" | "right";
}

export function EventFeed({ title, items, side = "left" }: EventFeedProps) {
  return (
    <section
      className={`pointer-events-none absolute bottom-[178px] z-20 w-[336px] ${
        side === "left" ? "left-6" : "right-6"
      }`}
    >
      <div className="arena-glass overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[13px] font-black uppercase text-slate-300">
          <Zap size={16} />
          {title}
        </div>
        <div className="flex max-h-[268px] flex-col gap-2 p-3">
          {items.length === 0 ? (
            <div className="rounded-lg bg-white/[0.04] px-3 py-4 text-center text-[14px] font-semibold text-slate-500">
              Waiting for action
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="feed-row" style={{ borderLeftColor: item.accent ?? "#94a3b8" }}>
                <span>{item.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
