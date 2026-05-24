export type TeamId = 1 | 2;

export type MatchStatus = "playing" | "paused" | "ended";

export type ThemeKey = "neon" | "inferno" | "aurora";

export type GiftTier = "micro" | "standard" | "heavy" | "legendary" | "ultimate";

export type TargetMode =
  | "nearest"
  | "enemyTeam"
  | "randomEnemy"
  | "line"
  | "area"
  | "allEnemies"
  | "selfTeam"
  | "score";

export type AnimationType =
  | "missile"
  | "bulletStorm"
  | "boost"
  | "thunderBridge"
  | "tornado"
  | "fireAoe"
  | "knockbackWave"
  | "meteorShower"
  | "laser"
  | "ultimate"
  | "combo"
  | "scorePulse";

export type GiftHandlerName =
  | "smallMissile"
  | "bulletStorm"
  | "boostedUnit"
  | "thunderBridge"
  | "tornado"
  | "fireAoe"
  | "knockbackWave"
  | "meteorShower"
  | "giantLaser"
  | "ultimateScreenAttack"
  | "comboChain"
  | "directScore";

export interface TeamConfig {
  id: TeamId;
  name: string;
  shortName: string;
  primary: string;
  secondary: string;
  glow: string;
}

export interface ActiveEffect {
  id: string;
  type: "boost" | "stun" | "shield" | "burn" | "haste";
  label: string;
  expiresAt: number;
  intensity: number;
}

export interface Player {
  id: string;
  username: string;
  avatarUrl: string;
  team: TeamId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  radius: number;
  kills: number;
  assists: number;
  deaths: number;
  alive: boolean;
  spawnTime: number;
  deathTime?: number;
  lastAttackAt: number;
  isBoosted: boolean;
  activeEffects: ActiveEffect[];
  targetId?: string;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  critical: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface VisualEffect {
  id: string;
  type: AnimationType | "explosion" | "death" | "likePulse";
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  radius: number;
  color: string;
  team?: TeamId;
  createdAt: number;
  expiresAt: number;
  intensity: number;
  angle?: number;
}

export interface FeedItem {
  id: string;
  type: "kill" | "gift" | "join" | "system" | "like" | "follow";
  message: string;
  team?: TeamId;
  createdAt: number;
  accent?: string;
}

export interface ScoreState {
  1: number;
  2: number;
}

export interface GiftAttackDefinition {
  id: string;
  tiktokGiftName: string;
  label: string;
  icon: string;
  tier: GiftTier;
  damage: number;
  cooldownMs: number;
  targetMode: TargetMode;
  animationType: AnimationType;
  description: string;
  handler: GiftHandlerName;
}

export interface GiftRuntimeConfig {
  damageOverrides: Record<string, number>;
  cooldownOverrides: Record<string, number>;
}

export interface BattleConfig {
  roomId: string;
  roundDurationMs: number;
  debug: boolean;
  theme: ThemeKey;
  teams: Record<TeamId, TeamConfig>;
  gifts: GiftRuntimeConfig;
  maxVisiblePlayers: number;
}

export interface GameStateSnapshot {
  roomId: string;
  tick: number;
  status: MatchStatus;
  elapsedMs: number;
  timeLeftMs: number;
  score: ScoreState;
  players: Player[];
  teams: Record<TeamId, TeamConfig>;
  theme: ThemeKey;
  debug: boolean;
  maxVisiblePlayers: number;
  aliveCount: Record<TeamId, number>;
  totalPlayers: Record<TeamId, number>;
  killFeed: FeedItem[];
  giftFeed: FeedItem[];
  damageNumbers: DamageNumber[];
  effects: VisualEffect[];
  giftCooldowns: Record<string, number>;
  lastGiftAt: Record<string, number>;
}

export type GameCommand =
  | { type: "addPlayer"; team: TeamId; username?: string; boosted?: boolean }
  | { type: "addRandomPlayers"; count: number; team?: TeamId }
  | { type: "triggerGift"; giftId: string; fromUser?: string; sourceTeam?: TeamId; targetTeam?: TeamId }
  | { type: "like"; fromUser?: string; count?: number; team?: TeamId }
  | { type: "follow"; username?: string; team?: TeamId }
  | { type: "reset" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "setRoundDuration"; durationMs: number }
  | { type: "setDebug"; debug: boolean }
  | { type: "setTeamName"; team: TeamId; name: string }
  | { type: "setTheme"; theme: ThemeKey }
  | { type: "updateGiftConfig"; giftId: string; damage?: number; cooldownMs?: number }
  | { type: "replaceConfig"; config: Partial<BattleConfig> };

export interface EngineFrameState {
  players: Player[];
  effects: VisualEffect[];
  damageNumbers: DamageNumber[];
  teams: Record<TeamId, TeamConfig>;
  theme: ThemeKey;
  status: MatchStatus;
  shake: number;
}
