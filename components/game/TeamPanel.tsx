"use client";

import type { GameStateSnapshot, TeamId } from "@/lib/game/types";
import { Activity, Skull, Users } from "lucide-react";
import type { ReactNode } from "react";

interface TeamPanelProps {
  snapshot: GameStateSnapshot;
  team: TeamId;
  side: "left" | "right";
}

export function TeamPanel({ snapshot, team, side }: TeamPanelProps) {
  const teamConfig = snapshot.teams[team];
  const players = snapshot.players.filter((player) => player.team === team);
  const kills = players.reduce((total, player) => total + player.kills, 0);
  const deaths = players.reduce((total, player) => total + player.deaths, 0);

  return (
    <aside
      className={`pointer-events-none absolute top-[188px] z-20 w-[238px] ${
        side === "left" ? "left-6" : "right-6"
      }`}
    >
      <div className="arena-glass p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-black uppercase text-slate-400">Team {team}</div>
            <div className="truncate text-[25px] font-black text-white">{teamConfig.name}</div>
          </div>
          <div
            className="h-12 w-12 rounded-full border border-white/20"
            style={{
              background: `radial-gradient(circle at 35% 30%, #ffffff 0 8%, ${teamConfig.primary} 16%, ${teamConfig.secondary} 72%)`,
              boxShadow: `0 0 28px ${teamConfig.glow}`,
            }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Metric icon={<Users size={17} />} label="Alive" value={snapshot.aliveCount[team]} color={teamConfig.primary} />
          <Metric icon={<Activity size={17} />} label="Kills" value={kills} color="#ffffff" />
          <Metric icon={<Skull size={17} />} label="Deaths" value={deaths} color="#fca5a5" />
        </div>
      </div>
    </aside>
  );
}

function Metric({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/22 px-2 py-3">
      <div className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-white/10 text-slate-200">{icon}</div>
      <div className="mt-2 text-[24px] font-black leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase text-slate-400">{label}</div>
    </div>
  );
}
