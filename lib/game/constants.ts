import type { TeamId } from "./types";

export const ARENA_WIDTH = 1080;
export const ARENA_HEIGHT = 1920;

export const FIELD = {
  x: 72,
  y: 270,
  width: 936,
  height: 1290,
  centerX: ARENA_WIDTH / 2,
  centerY: 915,
};

export const GOAL = {
  width: 42,
  height: 260,
};

export const TEAM_SPAWN_X: Record<TeamId, number> = {
  1: FIELD.x + 96,
  2: FIELD.x + FIELD.width - 96,
};

export const PLAYER_ATTACK_RANGE = 58;
export const PLAYER_ATTACK_COOLDOWN_MS = 720;
export const RESPAWN_DELAY_MS = 3200;
export const SNAPSHOT_INTERVAL_MS = 120;
export const MAX_FEED_ITEMS = 9;
export const MAX_DAMAGE_NUMBERS = 90;
export const MAX_EFFECTS = 80;
