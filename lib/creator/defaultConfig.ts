import { DEFAULT_BATTLE_CONFIG, THEME_LABELS } from "@/lib/game/config";
import type { CreatorConfig } from "./types";

export const DEFAULT_CREATOR_CONFIG: CreatorConfig = {
  creatorId: "local-creator",
  roomId: DEFAULT_BATTLE_CONFIG.roomId,
  displayName: "TikTok Arena Creator",
  teams: DEFAULT_BATTLE_CONFIG.teams,
  theme: {
    key: DEFAULT_BATTLE_CONFIG.theme,
    label: THEME_LABELS[DEFAULT_BATTLE_CONFIG.theme],
    background: "#080916",
    fieldTint: "#102e27",
  },
  gifts: DEFAULT_BATTLE_CONFIG.gifts,
  battle: {
    roundDurationMs: DEFAULT_BATTLE_CONFIG.roundDurationMs,
    maxVisiblePlayers: DEFAULT_BATTLE_CONFIG.maxVisiblePlayers,
    debug: DEFAULT_BATTLE_CONFIG.debug,
    respawn: DEFAULT_BATTLE_CONFIG.respawn,
    attackBalance: DEFAULT_BATTLE_CONFIG.attackBalance,
    obsLayout: DEFAULT_BATTLE_CONFIG.obsLayout,
  },
  futureStorage: {
    tables: ["creators", "rooms", "matches", "gift_configs", "themes"],
  },
};
