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
  const roster = players
    .filter((player) => player.alive)
    .slice(0, 3)
    .map((player) => player.username.replace("@", ""));

  return (
    <aside className={`live-team-strip live-team-strip-${side}`}>
      <div
        className="team-orb"
        style={{
          background: `radial-gradient(circle at 35% 30%, #ffffff 0 8%, ${teamConfig.primary} 16%, ${teamConfig.secondary} 72%)`,
          boxShadow: `0 0 26px ${teamConfig.glow}`,
        }}
      />
      <div className="team-strip-body">
        <div className="team-strip-title">
          <span style={{ color: teamConfig.primary }}>T{team}</span>
          {teamConfig.name}
        </div>
        <div className="team-strip-metrics">
          <Metric icon={<Users size={14} />} label="Alive" value={snapshot.aliveCount[team]} color={teamConfig.primary} />
          <Metric icon={<Activity size={14} />} label="K" value={kills} color="#ffffff" />
          <Metric icon={<Skull size={14} />} label="D" value={deaths} color="#fda4af" />
        </div>
        <div className="team-roster">{roster.length ? roster.join("  |  ") : "Waiting for viewers"}</div>
      </div>
    </aside>
  );
}

function Metric({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="team-mini-metric">
      <span>{icon}</span>
      <strong style={{ color }}>{value}</strong>
      <em>{label}</em>
    </div>
  );
}
