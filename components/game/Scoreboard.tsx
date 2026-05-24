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
  const statusIcon = snapshot.status === "paused" ? <Pause size={18} /> : <Play size={18} />;

  return (
    <section className="live-scoreboard">
      <div className="score-team score-team-left">
        <div className="score-tag" style={{ color: team1.primary }}>
          {team1.shortName}
        </div>
        <div className="score-team-name">{team1.name}</div>
        <div className="score-meta">{snapshot.aliveCount[1]} alive</div>
      </div>

      <div className="score-center">
        <span className="score-number" style={{ color: team1.primary }}>
          {snapshot.score[1]}
        </span>
        <div className="score-clock">
          <div className="score-status">
            {statusIcon}
            <span>{snapshot.status}</span>
          </div>
          <div className="timer-pill">{formatClock(snapshot.timeLeftMs)}</div>
          <div className="score-cup">
            <Trophy size={14} />
            LIVE
          </div>
        </div>
        <span className="score-number" style={{ color: team2.primary }}>
          {snapshot.score[2]}
        </span>
      </div>

      <div className="score-team score-team-right">
        <div className="score-tag" style={{ color: team2.primary }}>
          {team2.shortName}
        </div>
        <div className="score-team-name">{team2.name}</div>
        <div className="score-meta">{snapshot.aliveCount[2]} alive</div>
      </div>
    </section>
  );
}
