import type { AnimationType, TeamId, VisualEffect } from "./types";
import { uid } from "./utils";

export function createEffect(options: {
  type: AnimationType | "explosion" | "death" | "likePulse";
  x: number;
  y: number;
  color: string;
  now: number;
  radius?: number;
  durationMs?: number;
  targetX?: number;
  targetY?: number;
  intensity?: number;
  team?: TeamId;
  angle?: number;
}): VisualEffect {
  return {
    id: uid("fx"),
    type: options.type,
    x: options.x,
    y: options.y,
    targetX: options.targetX,
    targetY: options.targetY,
    radius: options.radius ?? 120,
    color: options.color,
    team: options.team,
    createdAt: options.now,
    expiresAt: options.now + (options.durationMs ?? 900),
    intensity: options.intensity ?? 1,
    angle: options.angle,
  };
}

export function effectProgress(effect: VisualEffect, now: number) {
  const duration = Math.max(1, effect.expiresAt - effect.createdAt);
  return Math.min(1, Math.max(0, (now - effect.createdAt) / duration));
}
