export const PLAYER_BASE_STATS = {
  hp: 120,
  attack: 16,
  defense: 4,
  speed: 92,
  radius: 18,
};

export const BOOSTED_STATS = {
  hpMultiplier: 1.6,
  attackMultiplier: 1.42,
  speedMultiplier: 1.13,
  radiusBonus: 4,
  durationMs: 18_000,
};

export const COMBAT_BALANCE = {
  criticalChance: 0.08,
  criticalMultiplier: 1.75,
  minDamage: 4,
  overlapPush: 34,
  targetRetainMs: 1800,
};

export const GIFT_BALANCE = {
  defaultCooldownMs: 3000,
  likeDamage: 3,
  likePulseRadius: 135,
  scoreGiftAmount: 1,
  ultimateShakeMs: 950,
  comboStepDelayMs: 180,
};

export const DEFAULT_ROUND_DURATION_MS = 180_000;
export const DEFAULT_MAX_VISIBLE_PLAYERS = 80;
