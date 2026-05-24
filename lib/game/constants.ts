import type { TeamId } from "./types";

export const ARENA_WIDTH = 1080;
export const ARENA_HEIGHT = 1920;

export const OBS_LAYOUT = {
  designWidth: ARENA_WIDTH,
  designHeight: ARENA_HEIGHT,
  topSafeArea: 32,
  fieldTop: 300,
  fieldBottom: 1452,
  feedTop: 1492,
  giftDockTop: 1664,
};

const FIELD_Y = OBS_LAYOUT.fieldTop;
const FIELD_HEIGHT = OBS_LAYOUT.fieldBottom - OBS_LAYOUT.fieldTop;
const FIELD_WIDTH = 900;

export const FIELD = {
  x: (ARENA_WIDTH - FIELD_WIDTH) / 2,
  y: FIELD_Y,
  width: FIELD_WIDTH,
  height: FIELD_HEIGHT,
  centerX: ARENA_WIDTH / 2,
  centerY: FIELD_Y + FIELD_HEIGHT / 2,
  safePadding: 54,
};

export const GOAL = {
  width: 38,
  height: 224,
};

export const TEAM_SPAWN_X: Record<TeamId, number> = {
  1: FIELD.x + 94,
  2: FIELD.x + FIELD.width - 94,
};

export const PLAYER_ATTACK_RANGE = 58;
export const PLAYER_ATTACK_COOLDOWN_MS = 720;
export const RESPAWN_DELAY_MS = 3200;
export const SNAPSHOT_INTERVAL_MS = 120;
export const MAX_FEED_ITEMS = 5;
export const MAX_DAMAGE_NUMBERS = 110;
export const MAX_EFFECTS = 120;
