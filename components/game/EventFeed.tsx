"use client";

import type { FeedItem } from "@/lib/game/types";
import { Swords, Zap } from "lucide-react";

interface EventFeedProps {
  title: string;
  items: FeedItem[];
  side?: "left" | "right";
}

export function EventFeed({ title, items, side = "left" }: EventFeedProps) {
  const Icon = title.toLowerCase().includes("kill") ? Swords : Zap;

  return (
    <section className={`live-feed live-feed-${side}`}>
      <div className="live-feed-title">
        <Icon size={14} />
        {title}
      </div>
      <div className="live-feed-body">
        {items.length === 0 ? (
          <div className="feed-empty">Waiting for action</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="feed-row" style={{ borderLeftColor: item.accent ?? "#94a3b8" }}>
              <span>{item.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
