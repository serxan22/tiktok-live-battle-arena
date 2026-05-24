import { FIELD, TEAM_SPAWN_X } from "./constants";
import type { Player, TeamId } from "./types";

let idCounter = 0;

export function uid(prefix = "id") {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize(dx: number, dy: number) {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len, len };
}

export function opposingTeam(team: TeamId): TeamId {
  return team === 1 ? 2 : 1;
}

export function spawnPoint(team: TeamId, radius: number) {
  const jitterX = randomBetween(-42, 42);
  const gutter = FIELD.safePadding + radius;

  return {
    x: clamp(TEAM_SPAWN_X[team] + jitterX, FIELD.x + gutter, FIELD.x + FIELD.width - gutter),
    y: randomBetween(FIELD.y + FIELD.safePadding + 34, FIELD.y + FIELD.height - FIELD.safePadding - 34),
  };
}

export function playerInitials(username: string) {
  return username.replace(/^@/, "").slice(0, 2).toUpperCase();
}

export function clonePlayer(player: Player): Player {
  return {
    ...player,
    activeEffects: player.activeEffects.map((effect) => ({ ...effect })),
  };
}

export function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function readNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
