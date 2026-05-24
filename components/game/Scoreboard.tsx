"use client";

import type { GameStateSnapshot } from "@/lib/game/types";
import { formatClock } from "@/lib/game/utils";
import { Pause, Play, Trophy } from "lucide-react";

interface ScoreboardProps {
  snapshot: GameStateSnapshot;
}

export function Scoreboard({ snapshot }: ScoreboardProps) {
  const team1 = snapshot.teams[1];
  const team2 = snapshot.teams[2];

  return (
    <section className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-7 pt-8">
      <div className="arena-glass scoreboard-grid mx-auto h-[154px] max-w-[960px] px-5 py-4">
        <div className="min-w-0 text-left">
          <div className="text-[20px] font-black uppercase leading-none tracking-normal" style={{ color: team1.primary }}>
            {team1.shortName}
          </div>
          <div className="mt-2 truncate text-[30px] font-black leading-none text-white">{team1.name}</div>
          <div className="mt-3 text-[18px] font-semibold text-slate-300">
            {snapshot.aliveCount[1]} alive / {snapshot.totalPlayers[1]} joined
          </div>
        </div>

        <div className="grid place-items-center">
          <div className="flex items-center gap-5">
            <span className="score-number" style={{ color: team1.primary }}>
              {snapshot.score[1]}
            </span>
            <div className="grid place-items-center gap-2">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white">
                {snapshot.status === "paused" ? <Pause size={22} /> : <Play size={22} />}
              </div>
              <div className="timer-pill">{formatClock(snapshot.timeLeftMs)}</div>
            </div>
            <span className="score-number" style={{ color: team2.primary }}>
              {snapshot.score[2]}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[17px] font-bold uppercase text-slate-300">
            <Trophy size={18} />
            {snapshot.status}
          </div>
        </div>

        <div className="min-w-0 text-right">
          <div className="text-[20px] font-black uppercase leading-none tracking-normal" style={{ color: team2.primary }}>
            {team2.shortName}
          </div>
          <div className="mt-2 truncate text-[30px] font-black leading-none text-white">{team2.name}</div>
          <div className="mt-3 text-[18px] font-semibold text-slate-300">
            {snapshot.aliveCount[2]} alive / {snapshot.totalPlayers[2]} joined
          </div>
        </div>
      </div>
    </section>
  );
}
