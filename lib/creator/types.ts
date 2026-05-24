import type { BattleConfig, GiftRuntimeConfig, TeamConfig, ThemeKey } from "@/lib/game/types";

export interface CreatorThemeConfig {
  key: ThemeKey;
  label: string;
  background: string;
  fieldTint: string;
}

export interface CreatorConfig {
  creatorId: string;
  roomId: string;
  displayName: string;
  teams: Record<1 | 2, TeamConfig>;
  theme: CreatorThemeConfig;
  gifts: GiftRuntimeConfig;
  battle: Pick<BattleConfig, "roundDurationMs" | "maxVisiblePlayers" | "debug">;
  futureStorage?: {
    supabaseProjectUrl?: string;
    tables: Array<"creators" | "rooms" | "matches" | "gift_configs" | "themes">;
  };
}
