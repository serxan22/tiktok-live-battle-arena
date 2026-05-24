import { BOOSTED_STATS, DEFAULT_ROUND_DURATION_MS, GIFT_BALANCE, PLAYER_BASE_STATS } from "./balancing";
import {
  FIELD,
  MAX_DAMAGE_NUMBERS,
  MAX_EFFECTS,
  MAX_FEED_ITEMS,
  SNAPSHOT_INTERVAL_MS,
} from "./constants";
import { executeGiftAttack, resolvedGiftDamage } from "./attacks";
import { createEffect } from "./effects";
import { GIFT_ATTACKS, GIFT_BY_ID } from "./gifts";
import { createMockUser, randomUsername } from "./mockUsers";
import { stepPlayers } from "./physics";
import type {
  BattleConfig,
  DamageNumber,
  EngineFrameState,
  FeedItem,
  GameCommand,
  GameStateSnapshot,
  MatchStatus,
  Player,
  ScoreState,
  TeamId,
  VisualEffect,
} from "./types";
import { clamp, clonePlayer, opposingTeam, spawnPoint, uid } from "./utils";
import { mergeBattleConfig } from "./config";

type SnapshotListener = (snapshot: GameStateSnapshot) => void;

export class BattleEngine {
  private config: BattleConfig;

  private players = new Map<string, Player>();

  private score: ScoreState = { 1: 0, 2: 0 };

  private status: MatchStatus = "playing";

  private elapsedMs = 0;

  private tickCount = 0;

  private lastSnapshotAt = 0;

  private listeners = new Set<SnapshotListener>();

  private damageNumbers: DamageNumber[] = [];

  private effects: VisualEffect[] = [];

  private killFeed: FeedItem[] = [];

  private giftFeed: FeedItem[] = [];

  private lastGiftAt: Record<string, number> = {};

  private shakeUntil = 0;

  private shakeIntensity = 0;

  constructor(config?: Partial<BattleConfig>) {
    this.config = mergeBattleConfig(config);
  }

  seedInitialPlayers() {
    if (this.players.size > 0) {
      return;
    }

    for (let index = 0; index < 8; index += 1) {
      this.addPlayer(1);
      this.addPlayer(2);
    }
  }

  onSnapshot(listener: SnapshotListener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  applyCommand(command: GameCommand) {
    switch (command.type) {
      case "addPlayer":
        this.addPlayer(command.team, command.username, command.boosted);
        break;
      case "addRandomPlayers":
        this.addRandomPlayers(command.count, command.team);
        break;
      case "triggerGift":
        this.triggerGift(command.giftId, command.fromUser, command.sourceTeam, command.targetTeam);
        break;
      case "like":
        this.applyLike(command.fromUser, command.count ?? 1, command.team);
        break;
      case "follow":
        this.applyFollow(command.username, command.team);
        break;
      case "reset":
        this.reset();
        break;
      case "pause":
        this.status = "paused";
        this.pushSystem("Match paused");
        break;
      case "resume":
        this.status = "playing";
        this.pushSystem("Match resumed");
        break;
      case "setRoundDuration":
        this.config.roundDurationMs = clamp(command.durationMs, 30_000, 900_000);
        this.elapsedMs = Math.min(this.elapsedMs, this.config.roundDurationMs - 1000);
        this.pushSystem(`Round timer set to ${Math.round(this.config.roundDurationMs / 1000)}s`);
        break;
      case "setDebug":
        this.config.debug = command.debug;
        break;
      case "setTeamName":
        this.config.teams = {
          ...this.config.teams,
          [command.team]: {
            ...this.config.teams[command.team],
            name: command.name.trim() || this.config.teams[command.team].name,
          },
        };
        break;
      case "setTheme":
        this.config.theme = command.theme;
        break;
      case "updateGiftConfig":
        this.updateGiftConfig(command.giftId, command.damage, command.cooldownMs);
        break;
      case "replaceConfig":
        this.config = mergeBattleConfig({
          ...this.config,
          ...command.config,
        });
        this.pushSystem("Creator config imported");
        break;
    }

    this.publishSnapshot();
  }

  step(deltaMs: number) {
    const dt = Math.min(0.05, Math.max(0, deltaMs / 1000));
    const now = performance.now();
    this.tickCount += 1;

    if (this.status === "playing") {
      this.elapsedMs += deltaMs;

      if (this.elapsedMs >= this.config.roundDurationMs) {
        this.status = "ended";
        this.pushSystem("Round ended");
      } else {
        this.respawnPlayers(now);
        stepPlayers(this.livePlayerList(), dt, now, {
          onHit: (attacker, defender, amount, critical) => {
            this.damagePlayer(defender, amount, attacker.team, attacker.username, attacker, critical);
          },
        });
      }
    }

    this.pruneTransient(now);

    if (now - this.lastSnapshotAt >= SNAPSHOT_INTERVAL_MS) {
      this.publishSnapshot(now);
    }
  }

  getFrameState(): EngineFrameState {
    const now = typeof performance === "undefined" ? Date.now() : performance.now();

    return {
      players: this.visiblePlayers(),
      effects: this.effects,
      damageNumbers: this.damageNumbers,
      teams: this.config.teams,
      theme: this.config.theme,
      status: this.status,
      shake: now < this.shakeUntil ? this.shakeIntensity : 0,
    };
  }

  getSnapshot(): GameStateSnapshot {
    const players = this.visiblePlayers().map(clonePlayer);
    const now = typeof performance === "undefined" ? Date.now() : performance.now();
    const aliveCount = {
      1: this.livePlayerList(1).length,
      2: this.livePlayerList(2).length,
    } satisfies Record<TeamId, number>;
    const totalPlayers = {
      1: this.playerList(1).length,
      2: this.playerList(2).length,
    } satisfies Record<TeamId, number>;

    return {
      roomId: this.config.roomId,
      tick: this.tickCount,
      status: this.status,
      elapsedMs: this.elapsedMs,
      timeLeftMs: Math.max(0, this.config.roundDurationMs - this.elapsedMs),
      score: { ...this.score },
      players,
      teams: this.config.teams,
      theme: this.config.theme,
      debug: this.config.debug,
      maxVisiblePlayers: this.config.maxVisiblePlayers,
      obsLayout: this.config.obsLayout,
      aliveCount,
      totalPlayers,
      killFeed: [...this.killFeed],
      giftFeed: [...this.giftFeed],
      damageNumbers: [...this.damageNumbers],
      effects: [...this.effects],
      giftCooldowns: this.getGiftCooldowns(now),
      lastGiftAt: { ...this.lastGiftAt },
    };
  }

  getConfig() {
    return this.config;
  }

  private addPlayer(team: TeamId, username = randomUsername(), boosted = false) {
    const stats = this.createStats(boosted);
    const spawn = spawnPoint(team, stats.radius);
    const now = performance.now();
    const player: Player = {
      id: uid("player"),
      username,
      avatarUrl: `generated://${encodeURIComponent(username)}`,
      team,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      hp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      radius: stats.radius,
      kills: 0,
      assists: 0,
      deaths: 0,
      alive: true,
      spawnTime: now,
      lastAttackAt: 0,
      isBoosted: boosted,
      activeEffects: boosted
        ? [
            {
              id: uid("boost"),
              type: "boost",
              label: "Follow boost",
              expiresAt: now + BOOSTED_STATS.durationMs,
              intensity: 1,
            },
          ]
        : [],
    };

    this.players.set(player.id, player);
    this.pushFeed({
      type: boosted ? "follow" : "join",
      message: `${username} joined ${this.config.teams[team].name}${boosted ? " boosted" : ""}`,
      team,
      accent: this.config.teams[team].primary,
    });
  }

  private addRandomPlayers(count: number, team?: TeamId) {
    const safeCount = clamp(Math.round(count), 1, 150);
    for (let index = 0; index < safeCount; index += 1) {
      const nextTeam = team ?? ((index % 2 === 0 ? 1 : 2) as TeamId);
      const user = createMockUser(nextTeam);
      this.addPlayer(user.team, user.username);
    }
    this.pushSystem(`Added ${safeCount} fake viewers`);
  }

  private triggerGift(giftId: string, fromUser = "@gift_sender", sourceTeam?: TeamId, targetTeam?: TeamId) {
    const gift = GIFT_BY_ID[giftId];
    if (!gift) {
      this.pushSystem(`Unknown gift: ${giftId}`);
      return;
    }

    const now = performance.now();
    const cooldown = this.config.gifts.cooldownOverrides[gift.id] ?? gift.cooldownMs ?? GIFT_BALANCE.defaultCooldownMs;
    const last = this.lastGiftAt[gift.id] ?? 0;

    if (now - last < cooldown) {
      const remaining = Math.ceil((cooldown - (now - last)) / 1000);
      this.pushFeed({
        type: "gift",
        message: `${gift.label} cooling down: ${remaining}s`,
        accent: "#ffd166",
      });
      return;
    }

    const resolvedSource = sourceTeam ?? (targetTeam ? opposingTeam(targetTeam) : this.leadingPressureTeam());
    const resolvedTarget =
      gift.targetMode === "score" || gift.targetMode === "selfTeam" ? resolvedSource : targetTeam ?? opposingTeam(resolvedSource);
    const damage = resolvedGiftDamage(gift, this.config.gifts.damageOverrides[gift.id]);
    this.lastGiftAt[gift.id] = now;

    executeGiftAttack(gift, {
      now,
      sourceTeam: resolvedSource,
      targetTeam: resolvedTarget,
      fromUser,
      teamColor: (team) => this.config.teams[team].primary,
      getLivePlayers: (team) => this.livePlayerList(team),
      damagePlayer: (player, amount, team, label) => this.damagePlayer(player, amount, team, label),
      addEffect: (effect) => this.effects.push(effect),
      addScore: (team, amount, label) => {
        this.score[team] += amount;
        this.pushFeed({
          type: "gift",
          message: `${label} gave ${this.config.teams[team].shortName} +${amount}`,
          team,
          accent: this.config.teams[team].primary,
        });
      },
      spawnBoostedUnit: (team, username) => this.addPlayer(team, username || fromUser || randomUsername(), true),
      shake: (intensity, durationMs) => {
        this.shakeIntensity = intensity;
        this.shakeUntil = now + durationMs;
      },
    }, damage);

    const targetCopy =
      gift.targetMode === "score"
        ? `scored for ${this.config.teams[resolvedSource].shortName}`
        : gift.targetMode === "selfTeam"
          ? `boosted ${this.config.teams[resolvedSource].shortName}`
          : `hit ${this.config.teams[resolvedTarget].shortName}`;

    this.pushFeed({
      type: "gift",
      message: `${gift.icon} ${fromUser} ${targetCopy} with ${gift.label}`,
      team: resolvedSource,
      accent: this.config.teams[resolvedSource].primary,
    });
  }

  private applyLike(fromUser = "@viewer", count = 1, team?: TeamId) {
    const sourceTeam = team ?? this.leadingPressureTeam();
    const targetTeam = opposingTeam(sourceTeam);
    const now = performance.now();
    const targets = this.livePlayerList(targetTeam).slice(0, Math.max(1, Math.min(8, count)));

    this.effects.push(
      createEffect({
        type: "likePulse",
        x: sourceTeam === 1 ? FIELD.x + 155 : FIELD.x + FIELD.width - 155,
        y: FIELD.y + FIELD.height - 120,
        color: this.config.teams[sourceTeam].primary,
        now,
        radius: 120 + count * 4,
        durationMs: 720,
        intensity: 0.65,
        team: sourceTeam,
      }),
    );

    for (const target of targets) {
      this.damagePlayer(target, GIFT_BALANCE.likeDamage, sourceTeam, "Like pulse");
    }

    this.pushFeed({
      type: "like",
      message: `${fromUser} sent ${count} likes`,
      team: sourceTeam,
      accent: this.config.teams[sourceTeam].primary,
    });
  }

  private applyFollow(username = randomUsername(), team?: TeamId) {
    const sourceTeam = team ?? this.leadingPressureTeam();
    this.addPlayer(sourceTeam, username, true);
  }

  private reset() {
    this.players.clear();
    this.damageNumbers = [];
    this.effects = [];
    this.killFeed = [];
    this.giftFeed = [];
    this.lastGiftAt = {};
    this.score = { 1: 0, 2: 0 };
    this.elapsedMs = 0;
    this.tickCount = 0;
    this.status = "playing";
    this.seedInitialPlayers();
    this.pushSystem("Match reset");
  }

  private updateGiftConfig(giftId: string, damage?: number, cooldownMs?: number) {
    if (!GIFT_ATTACKS.some((gift) => gift.id === giftId)) {
      return;
    }

    if (typeof damage === "number" && Number.isFinite(damage)) {
      this.config.gifts.damageOverrides[giftId] = clamp(Math.round(damage), 0, 999);
    }

    if (typeof cooldownMs === "number" && Number.isFinite(cooldownMs)) {
      this.config.gifts.cooldownOverrides[giftId] = clamp(Math.round(cooldownMs), 0, 120_000);
    }
  }

  private createStats(boosted: boolean) {
    if (!boosted) {
      return { ...PLAYER_BASE_STATS };
    }

    return {
      hp: Math.round(PLAYER_BASE_STATS.hp * BOOSTED_STATS.hpMultiplier),
      attack: Math.round(PLAYER_BASE_STATS.attack * BOOSTED_STATS.attackMultiplier),
      defense: PLAYER_BASE_STATS.defense + 2,
      speed: Math.round(PLAYER_BASE_STATS.speed * BOOSTED_STATS.speedMultiplier),
      radius: PLAYER_BASE_STATS.radius + BOOSTED_STATS.radiusBonus,
    };
  }

  private damagePlayer(
    player: Player,
    amount: number,
    sourceTeam: TeamId,
    sourceLabel: string,
    attacker?: Player,
    critical = false,
  ) {
    if (!player.alive || amount <= 0) {
      return;
    }

    const rounded = Math.max(1, Math.round(amount));
    player.hp = Math.max(0, player.hp - rounded);
    this.damageNumbers.push({
      id: uid("dmg"),
      x: player.x + Math.random() * 22 - 11,
      y: player.y - player.radius - 12,
      value: rounded,
      color: critical ? "#ffffff" : this.config.teams[sourceTeam].primary,
      critical,
      createdAt: performance.now(),
      expiresAt: performance.now() + 760,
    });

    if (player.hp <= 0) {
      this.killPlayer(player, sourceTeam, sourceLabel, attacker);
    }
  }

  private killPlayer(player: Player, sourceTeam: TeamId, sourceLabel: string, attacker?: Player) {
    if (!player.alive) {
      return;
    }

    const now = performance.now();
    player.alive = false;
    player.deaths += 1;
    player.deathTime = now;
    player.activeEffects = [];
    this.score[sourceTeam] += 1;

    if (attacker) {
      attacker.kills += 1;
    }

    this.effects.push(
      createEffect({
        type: "death",
        x: player.x,
        y: player.y,
        color: this.config.teams[sourceTeam].primary,
        now,
        radius: 80,
        durationMs: 620,
        intensity: 1,
        team: sourceTeam,
      }),
    );

    this.pushFeed({
      type: "kill",
      message: `${sourceLabel} eliminated ${player.username}`,
      team: sourceTeam,
      accent: this.config.teams[sourceTeam].primary,
    }, true);
  }

  private respawnPlayers(now: number) {
    for (const player of this.players.values()) {
      if (player.alive || !player.deathTime || now - player.deathTime < this.config.respawn.delayMs) {
        continue;
      }

      const spawn = spawnPoint(player.team, player.radius);
      player.x = spawn.x;
      player.y = spawn.y;
      player.vx = 0;
      player.vy = 0;
      player.hp = player.maxHp;
      player.alive = true;
      player.spawnTime = now;
      player.deathTime = undefined;
    }
  }

  private pruneTransient(now: number) {
    const maxDamageNumbers = this.config.attackBalance.maxDamageNumbers || MAX_DAMAGE_NUMBERS;
    const maxEffects = this.config.attackBalance.maxEffects || MAX_EFFECTS;

    this.damageNumbers = this.damageNumbers
      .filter((number) => number.expiresAt > now)
      .slice(-maxDamageNumbers);
    this.effects = this.effects
      .filter((effect) => effect.expiresAt > now)
      .slice(-maxEffects);

    for (const player of this.players.values()) {
      player.activeEffects = player.activeEffects.filter((effect) => effect.expiresAt > now);
      if (player.isBoosted && player.activeEffects.length === 0) {
        player.isBoosted = false;
      }
    }
  }

  private playerList(team?: TeamId) {
    const players = Array.from(this.players.values());
    return typeof team === "number" ? players.filter((player) => player.team === team) : players;
  }

  private livePlayerList(team?: TeamId) {
    return this.playerList(team).filter((player) => player.alive);
  }

  private visiblePlayers() {
    return this.playerList()
      .sort((a, b) => Number(b.alive) - Number(a.alive) || b.spawnTime - a.spawnTime)
      .slice(0, this.config.maxVisiblePlayers);
  }

  private leadingPressureTeam(): TeamId {
    const t1 = this.livePlayerList(1).length + this.score[1] * 0.2;
    const t2 = this.livePlayerList(2).length + this.score[2] * 0.2;
    return t1 <= t2 ? 1 : 2;
  }

  private getGiftCooldowns(now: number) {
    return Object.fromEntries(
      GIFT_ATTACKS.map((gift) => {
        const cooldown = this.config.gifts.cooldownOverrides[gift.id] ?? gift.cooldownMs;
        const last = this.lastGiftAt[gift.id] ?? 0;
        return [gift.id, Math.max(0, cooldown - (now - last))];
      }),
    );
  }

  private pushSystem(message: string) {
    this.pushFeed({
      type: "system",
      message,
      accent: "#a9b4c8",
    });
  }

  private pushFeed(item: Omit<FeedItem, "id" | "createdAt">, kill = false) {
    const next: FeedItem = {
      id: uid("feed"),
      createdAt: performance.now(),
      ...item,
    };

    if (kill) {
      this.killFeed = [next, ...this.killFeed].slice(0, MAX_FEED_ITEMS);
      return;
    }

    this.giftFeed = [next, ...this.giftFeed].slice(0, MAX_FEED_ITEMS);
  }

  private publishSnapshot(now = performance.now()) {
    this.lastSnapshotAt = now;
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export function createBattleEngine(config?: Partial<BattleConfig>) {
  return new BattleEngine({
    roundDurationMs: DEFAULT_ROUND_DURATION_MS,
    ...config,
  });
}
