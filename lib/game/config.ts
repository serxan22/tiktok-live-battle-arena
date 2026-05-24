import { DEFAULT_MAX_VISIBLE_PLAYERS, DEFAULT_ROUND_DURATION_MS } from "./balancing";
import type { BattleConfig, TeamConfig, ThemeKey } from "./types";

export const DEFAULT_TEAMS: Record<1 | 2, TeamConfig> = {
  1: {
    id: 1,
    name: "Blue Strikers",
    shortName: "BLUE",
    primary: "#18d4ff",
    secondary: "#235bff",
    glow: "rgba(24, 212, 255, 0.48)",
  },
  2: {
    id: 2,
    name: "Red Raiders",
    shortName: "RED",
    primary: "#ff3568",
    secondary: "#ff8b1f",
    glow: "rgba(255, 53, 104, 0.48)",
  },
};

export const THEME_LABELS: Record<ThemeKey, string> = {
  neon: "Neon Kickoff",
  inferno: "Inferno Derby",
  aurora: "Aurora Clash",
};

export const THEME_CLASSES: Record<ThemeKey, string> = {
  neon: "theme-neon",
  inferno: "theme-inferno",
  aurora: "theme-aurora",
};

export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  roomId: "main-live-room",
  roundDurationMs: DEFAULT_ROUND_DURATION_MS,
  debug: false,
  theme: "neon",
  teams: DEFAULT_TEAMS,
  gifts: {
    damageOverrides: {},
    cooldownOverrides: {},
  },
  maxVisiblePlayers: DEFAULT_MAX_VISIBLE_PLAYERS,
};

export function mergeBattleConfig(config?: Partial<BattleConfig>): BattleConfig {
  return {
    ...DEFAULT_BATTLE_CONFIG,
    ...config,
    teams: {
      ...DEFAULT_TEAMS,
      ...(config?.teams ?? {}),
    },
    gifts: {
      damageOverrides: {
        ...DEFAULT_BATTLE_CONFIG.gifts.damageOverrides,
        ...(config?.gifts?.damageOverrides ?? {}),
      },
      cooldownOverrides: {
        ...DEFAULT_BATTLE_CONFIG.gifts.cooldownOverrides,
        ...(config?.gifts?.cooldownOverrides ?? {}),
      },
    },
  };
}
