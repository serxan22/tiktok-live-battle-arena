"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Bug,
  Download,
  ExternalLink,
  Pause,
  Play,
  Plus,
  RadioTower,
  RefreshCw,
  Send,
  Settings2,
  TimerReset,
  Upload,
  Zap,
} from "lucide-react";
import { DEFAULT_BATTLE_CONFIG } from "@/lib/game/config";
import { GIFT_ATTACKS } from "@/lib/game/gifts";
import { useBattleStore } from "@/lib/game/store";
import { getRealtimeRoomId } from "@/lib/realtime/broadcaster";
import type { RealtimeStatus } from "@/lib/realtime/socketTypes";
import type { BattleConfig, TeamId, ThemeKey } from "@/lib/game/types";
import { opposingTeam } from "@/lib/game/utils";
import { ThemePanel } from "./ThemePanel";

type GiftEditState = Record<string, { damage: number; cooldownMs: number }>;

const initialGiftEdits: GiftEditState = Object.fromEntries(
  GIFT_ATTACKS.map((gift) => [gift.id, { damage: gift.damage, cooldownMs: gift.cooldownMs }]),
);

export function ControlDashboard() {
  const { snapshot, connected, connect, sendCommand, realtimeStatus } = useBattleStore();
  const [targetTeam, setTargetTeam] = useState<TeamId>(2);
  const [teamNames, setTeamNames] = useState({ 1: DEFAULT_BATTLE_CONFIG.teams[1].name, 2: DEFAULT_BATTLE_CONFIG.teams[2].name });
  const [durationSec, setDurationSec] = useState(Math.round(DEFAULT_BATTLE_CONFIG.roundDurationMs / 1000));
  const [giftEdits, setGiftEdits] = useState<GiftEditState>(initialGiftEdits);
  const [configText, setConfigText] = useState("");
  const [importError, setImportError] = useState("");

  useEffect(() => connect(getRealtimeRoomId(), "controller"), [connect]);

  const theme = snapshot?.theme ?? DEFAULT_BATTLE_CONFIG.theme;
  const debug = snapshot?.debug ?? false;
  const sourceTeam = opposingTeam(targetTeam);

  const exportPayload = useMemo(
    () => ({
      roomId: snapshot?.roomId ?? DEFAULT_BATTLE_CONFIG.roomId,
      teams: snapshot?.teams ?? DEFAULT_BATTLE_CONFIG.teams,
      theme,
      roundDurationMs: durationSec * 1000,
      debug,
      maxVisiblePlayers: snapshot?.maxVisiblePlayers ?? DEFAULT_BATTLE_CONFIG.maxVisiblePlayers,
      respawn: DEFAULT_BATTLE_CONFIG.respawn,
      attackBalance: DEFAULT_BATTLE_CONFIG.attackBalance,
      obsLayout: snapshot?.obsLayout ?? DEFAULT_BATTLE_CONFIG.obsLayout,
      gifts: {
        damageOverrides: Object.fromEntries(Object.entries(giftEdits).map(([id, edit]) => [id, edit.damage])),
        cooldownOverrides: Object.fromEntries(Object.entries(giftEdits).map(([id, edit]) => [id, edit.cooldownMs])),
      },
    }),
    [debug, durationSec, giftEdits, snapshot?.maxVisiblePlayers, snapshot?.obsLayout, snapshot?.roomId, snapshot?.teams, theme],
  );

  function addPlayer(team: TeamId, boosted = false) {
    sendCommand({ type: "addPlayer", team, boosted });
  }

  function triggerGift(giftId: string) {
    sendCommand({
      type: "triggerGift",
      giftId,
      fromUser: "@creator_test",
      sourceTeam,
      targetTeam,
    });
  }

  function updateGift(giftId: string, next: { damage?: number; cooldownMs?: number }) {
    setGiftEdits((current) => {
      const existing = current[giftId] ?? { damage: 0, cooldownMs: 0 };
      return {
        ...current,
        [giftId]: {
          ...existing,
          ...next,
        },
      };
    });
    sendCommand({ type: "updateGiftConfig", giftId, ...next });
  }

  function exportConfig() {
    setConfigText(JSON.stringify(exportPayload, null, 2));
    setImportError("");
  }

  function importConfig() {
    try {
      const parsed = JSON.parse(configText) as Partial<Omit<BattleConfig, "theme">> & {
        battle?: Partial<
          Pick<BattleConfig, "roundDurationMs" | "maxVisiblePlayers" | "debug" | "respawn" | "attackBalance" | "obsLayout">
        >;
        theme?: ThemeKey | { key?: ThemeKey };
      };
      const parsedTheme = typeof parsed.theme === "object" && parsed.theme !== null ? parsed.theme.key : parsed.theme;
      sendCommand({
        type: "replaceConfig",
        config: {
          ...parsed,
          theme: parsedTheme,
          roundDurationMs: parsed.roundDurationMs ?? parsed.battle?.roundDurationMs,
          debug: parsed.debug ?? parsed.battle?.debug,
          maxVisiblePlayers: parsed.maxVisiblePlayers ?? parsed.battle?.maxVisiblePlayers,
          respawn: parsed.respawn ?? parsed.battle?.respawn,
          attackBalance: parsed.attackBalance ?? parsed.battle?.attackBalance,
          obsLayout: parsed.obsLayout ?? parsed.battle?.obsLayout,
        },
      });
      setImportError("");
    } catch {
      setImportError("Import failed. Paste valid JSON first.");
    }
  }

  return (
    <main className="control-page">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-5 py-5">
        <header className="control-header">
          <div>
            <div className="text-sm font-black uppercase text-cyan-300">Creator control room</div>
            <h1 className="mt-1 text-4xl font-black tracking-normal text-white">TikTok LIVE Battle Arena</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Open <span className="font-black text-slate-200">/live</span> in another tab or OBS Browser Source, then use this panel to send local mock events.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <StatusPill label={realtimeStatusLabel(realtimeStatus, connected)} active={connected} />
            <StatusPill label={`Room ${realtimeStatus?.roomId ?? getRealtimeRoomId()}`} active />
            <StatusPill label={snapshot ? "Live screen online" : "Open /live"} active={Boolean(snapshot)} />
            <a className="control-open-live" href="/live" target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              Open live
            </a>
          </div>
        </header>

        <div className="control-grid">
          <section className="control-section">
            <div className="control-heading">
              <RadioTower size={17} />
              Live operations
            </div>

            <Subheading label="Viewer joins" />
            <div className="grid grid-cols-2 gap-2">
              <CommandButton icon={<Plus size={17} />} label="Team 1" onClick={() => addPlayer(1)} />
              <CommandButton icon={<Plus size={17} />} label="Team 2" onClick={() => addPlayer(2)} />
            </div>

            <Subheading label="Stress tests" />
            <div className="grid grid-cols-2 gap-2">
              <CommandButton icon={<Activity size={17} />} label="+10 random" onClick={() => sendCommand({ type: "addRandomPlayers", count: 10 })} />
              <CommandButton icon={<Zap size={17} />} label="+50 stress" onClick={() => sendCommand({ type: "addRandomPlayers", count: 50 })} />
            </div>

            <Subheading label="Match state" />
            <div className="grid grid-cols-2 gap-2">
              <CommandButton icon={<Pause size={17} />} label="Pause" onClick={() => sendCommand({ type: "pause" })} />
              <CommandButton icon={<Play size={17} />} label="Resume" onClick={() => sendCommand({ type: "resume" })} />
              <CommandButton icon={<RefreshCw size={17} />} label="Reset match" danger onClick={() => sendCommand({ type: "reset" })} />
              <CommandButton
                icon={<Bug size={17} />}
                label={debug ? "Debug off" : "Debug on"}
                onClick={() => sendCommand({ type: "setDebug", debug: !debug })}
              />
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
              <label className="control-label" htmlFor="duration">
                Round duration seconds
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="duration"
                  className="control-input"
                  type="number"
                  min={30}
                  max={900}
                  value={durationSec}
                  onChange={(event) => setDurationSec(Number(event.target.value))}
                />
                <button
                  type="button"
                  className="icon-command"
                  title="Set timer"
                  aria-label="Set timer"
                  onClick={() => sendCommand({ type: "setRoundDuration", durationMs: durationSec * 1000 })}
                >
                  <TimerReset size={19} />
                </button>
              </div>
            </div>
          </section>

          <section className="control-section">
            <div className="control-heading-row">
              <div className="control-heading mb-0">
                <Zap size={17} />
                Gift attack engine
              </div>
              <div className="target-selector" aria-label="Gift target team">
                <button
                  type="button"
                  className={targetTeam === 1 ? "target-choice target-choice-blue active" : "target-choice target-choice-blue"}
                  onClick={() => setTargetTeam(1)}
                >
                  Target Team 1
                </button>
                <button
                  type="button"
                  className={targetTeam === 2 ? "target-choice target-choice-red active" : "target-choice target-choice-red"}
                  onClick={() => setTargetTeam(2)}
                >
                  Target Team 2
                </button>
              </div>
            </div>
            <p className="mb-4 text-sm font-semibold text-slate-400">
              Current source team is <span className="font-black text-slate-200">Team {sourceTeam}</span>. Cooldowns mirror the live room snapshot.
            </p>

            <div className="gift-control-grid">
              {GIFT_ATTACKS.map((gift) => {
                const remaining = snapshot?.giftCooldowns[gift.id] ?? 0;
                const edit = giftEdits[gift.id] ?? { damage: gift.damage, cooldownMs: gift.cooldownMs };
                return (
                  <div key={gift.id} className="gift-control-card">
                    <button type="button" className="gift-trigger" onClick={() => triggerGift(gift.id)}>
                      <span>{gift.icon}</span>
                      <strong>{gift.label}</strong>
                      <em>{remaining > 0 ? `${Math.ceil(remaining / 1000)}s cooldown` : gift.tier}</em>
                    </button>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <NumberField
                        label="Damage"
                        value={edit.damage}
                        onChange={(value) => updateGift(gift.id, { damage: value })}
                      />
                      <NumberField
                        label="Cooldown"
                        value={Math.round(edit.cooldownMs / 1000)}
                        onChange={(value) => updateGift(gift.id, { cooldownMs: value * 1000 })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-5">
            <section className="control-section">
              <div className="control-heading">
                <Settings2 size={17} />
                Creator config
              </div>
              <Subheading label="Team identity" />
              {[1, 2].map((team) => (
                <div key={team} className="mb-4 last:mb-0">
                  <label className="control-label" htmlFor={`team-${team}`}>
                    Team {team} name
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id={`team-${team}`}
                      className="control-input"
                      value={teamNames[team as TeamId]}
                      onChange={(event) =>
                        setTeamNames((current) => ({ ...current, [team]: event.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="icon-command"
                      title="Apply team name"
                      aria-label={`Apply Team ${team} name`}
                      onClick={() =>
                        sendCommand({
                          type: "setTeamName",
                          team: team as TeamId,
                          name: teamNames[team as TeamId],
                        })
                      }
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <ThemePanel value={theme} onChange={(nextTheme) => sendCommand({ type: "setTheme", theme: nextTheme })} />

            <section className="control-section">
              <div className="control-heading">
                <Download size={17} />
                Config JSON
              </div>
              <div className="mb-3 flex gap-2">
                <CommandButton icon={<Download size={17} />} label="Export" onClick={exportConfig} />
                <CommandButton icon={<Upload size={17} />} label="Import" onClick={importConfig} />
              </div>
              <textarea
                className="control-textarea"
                value={configText}
                onChange={(event) => setConfigText(event.target.value)}
                placeholder="Export or paste creator config JSON"
              />
              {importError ? <div className="mt-2 text-sm font-bold text-rose-300">{importError}</div> : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`status-pill ${active ? "status-active" : ""}`}>
      <span />
      {label}
    </div>
  );
}

function realtimeStatusLabel(status: RealtimeStatus | undefined, connected: boolean) {
  if (!status) {
    return connected ? "Realtime ready" : "Realtime waiting";
  }

  if (status.mode === "local") {
    return "Local fallback ready";
  }

  const presence = status.presence
    ? ` D${status.presence.displays} C${status.presence.controllers}`
    : "";
  return `Socket ${status.socketState}${presence}`;
}

function Subheading({ label }: { label: string }) {
  return <div className="control-subheading">{label}</div>;
}

function CommandButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button type="button" className={`command-button ${danger ? "command-danger" : ""}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));

  return (
    <label className="min-w-0 text-[11px] font-black uppercase text-slate-500">
      {label}
      <input
        className="mt-1 w-full rounded-md border border-white/10 bg-black/35 px-2 py-2 text-sm font-bold text-white outline-none focus:border-cyan-300/70"
        type="number"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onChange(Number(draft))}
      />
    </label>
  );
}
