"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createBattleEngine, type BattleEngine } from "@/lib/game/engine";
import { DEFAULT_BATTLE_CONFIG, THEME_CLASSES } from "@/lib/game/config";
import { getBattleEventBus } from "@/lib/game/eventBus";
import type { GameStateSnapshot } from "@/lib/game/types";
import { getRealtimeRoomId } from "@/lib/realtime/broadcaster";
import type { RealtimeStatus } from "@/lib/realtime/socketTypes";
import { getTikTokMode, getTikTokUsername } from "@/lib/tiktok/adapter";
import { MockTikTokLiveAdapter } from "@/lib/tiktok/mockAdapter";
import { RealTikTokLiveAdapter } from "@/lib/tiktok/realAdapter";
import { tiktokEventToCommands } from "@/lib/tiktok/handlers";
import { DebugPanel } from "./DebugPanel";
import { EventFeed } from "./EventFeed";
import { GiftActionList } from "./GiftActionList";
import { Scoreboard } from "./Scoreboard";
import { TeamPanel } from "./TeamPanel";

const BattleCanvas = dynamic(() => import("./BattleCanvas"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-white/70">Loading arena renderer...</div>,
});

export function LiveBattleShell() {
  const [engine] = useState<BattleEngine>(() =>
    createBattleEngine({
      ...DEFAULT_BATTLE_CONFIG,
      roomId: getRealtimeRoomId(),
    }),
  );
  const [snapshot, setSnapshot] = useState<GameStateSnapshot>(() => engine.getSnapshot());
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>();
  const mounted = useSyncExternalStore(
    (onStoreChange) => {
      onStoreChange();
      return () => undefined;
    },
    () => true,
    () => false,
  );
  const themeClass = THEME_CLASSES[snapshot.theme];
  const connectionLabel = useMemo(() => {
    const mode = getTikTokMode();
    const username = getTikTokUsername();
    const tiktokLabel = mode === "real" && username ? `TikTok @${username}` : "Mock TikTok";
    const realtimeLabel = realtimeStatus
      ? realtimeStatus.mode === "local"
        ? "local realtime"
        : `${realtimeStatus.mode} ${realtimeStatus.socketState}`
      : "local display";
    return `${tiktokLabel} | ${realtimeLabel} | room ${snapshot.roomId}`;
  }, [realtimeStatus, snapshot.roomId]);

  useEffect(() => {
    engine.seedInitialPlayers();
    const bus = getBattleEventBus(snapshot.roomId, "display");
    const unsubscribeCommands = bus.onCommand((command) => {
      engine.applyCommand(command);
    });
    const unsubscribeSnapshots = engine.onSnapshot((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      bus.sendSnapshot(nextSnapshot);
    });
    const unsubscribeStatus = bus.onStatus((status) => {
      setRealtimeStatus(status);
    });

    return () => {
      unsubscribeCommands();
      unsubscribeSnapshots();
      unsubscribeStatus();
    };
  }, [engine, snapshot.roomId]);

  useEffect(() => {
    const mode = getTikTokMode();
    const username = getTikTokUsername();
    const adapters =
      mode === "real" && username
        ? [new RealTikTokLiveAdapter(username), new MockTikTokLiveAdapter(`${username}-fallback`)]
        : [new MockTikTokLiveAdapter(username || "mock-live")];

    const cleanups = adapters.map((adapter) =>
      adapter.onEvent((event) => {
        for (const command of tiktokEventToCommands(event)) {
          engine.applyCommand(command);
        }
      }),
    );

    for (const adapter of adapters) {
      void adapter.connect();
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
      for (const adapter of adapters) {
        void adapter.disconnect();
      }
    };
  }, [engine]);

  const winner = useMemo(() => {
    if (snapshot.status !== "ended") {
      return undefined;
    }
    if (snapshot.score[1] === snapshot.score[2]) {
      return "Draw";
    }
    return snapshot.score[1] > snapshot.score[2] ? snapshot.teams[1].name : snapshot.teams[2].name;
  }, [snapshot]);

  if (!mounted) {
    return (
      <main className="live-stage theme-neon">
        <div className="obs-frame grid place-items-center">
          <div className="arena-glass px-6 py-4 text-center text-sm font-black uppercase text-slate-300">
            Loading arena
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`live-stage ${themeClass}`}>
      <div className="obs-frame">
        <BattleCanvas engine={engine} />
        <Scoreboard snapshot={snapshot} />
        <TeamPanel snapshot={snapshot} team={1} side="left" />
        <TeamPanel snapshot={snapshot} team={2} side="right" />
        <EventFeed title="Kill feed" items={snapshot.killFeed} side="left" />
        <EventFeed title="Gift feed" items={snapshot.giftFeed} side="right" />
        <GiftActionList snapshot={snapshot} />
        <DebugPanel snapshot={snapshot} />

        <div className="live-mode-badge">
          {connectionLabel}
        </div>

        {winner ? (
          <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-black/40">
            <div className="winner-banner">
              <div className="winner-kicker">Round complete</div>
              <div className="winner-title">{winner}</div>
              <div className="winner-copy">Use /control to reset or start the next match</div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
