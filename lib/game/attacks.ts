import { FIELD } from "./constants";
import { GIFT_BALANCE } from "./balancing";
import type { GiftAttackDefinition, Player, TeamId, VisualEffect } from "./types";
import { createEffect } from "./effects";
import { distance, normalize, opposingTeam, pickOne, randomBetween } from "./utils";

export interface AttackContext {
  now: number;
  sourceTeam: TeamId;
  targetTeam: TeamId;
  fromUser: string;
  teamColor: (team: TeamId) => string;
  getLivePlayers: (team?: TeamId) => Player[];
  damagePlayer: (player: Player, amount: number, sourceTeam: TeamId, sourceLabel: string) => void;
  addEffect: (effect: VisualEffect) => void;
  addScore: (team: TeamId, amount: number, label: string) => void;
  spawnBoostedUnit: (team: TeamId, username?: string) => void;
  shake: (intensity: number, durationMs: number) => void;
}

export function resolvedGiftDamage(gift: GiftAttackDefinition, override?: number) {
  return Math.max(0, Math.round(override ?? gift.damage));
}

export function executeGiftAttack(gift: GiftAttackDefinition, ctx: AttackContext, damage: number) {
  const targetTeam = gift.targetMode === "selfTeam" || gift.targetMode === "score" ? ctx.sourceTeam : ctx.targetTeam;

  switch (gift.handler) {
    case "smallMissile":
      smallMissile(gift, ctx, damage, targetTeam);
      return;
    case "bulletStorm":
      bulletStorm(gift, ctx, damage, targetTeam);
      return;
    case "boostedUnit":
      ctx.spawnBoostedUnit(ctx.sourceTeam, ctx.fromUser);
      ctx.addEffect(
        createEffect({
          type: "boost",
          x: ctx.sourceTeam === 1 ? FIELD.x + 120 : FIELD.x + FIELD.width - 120,
          y: FIELD.centerY,
          color: ctx.teamColor(ctx.sourceTeam),
          now: ctx.now,
          radius: 180,
          durationMs: 1000,
          intensity: 1.2,
          team: ctx.sourceTeam,
        }),
      );
      return;
    case "thunderBridge":
      thunderBridge(gift, ctx, damage, targetTeam);
      return;
    case "tornado":
      areaAttack(gift, ctx, damage, targetTeam, "tornado", 170, 0.85);
      return;
    case "fireAoe":
      areaAttack(gift, ctx, damage, targetTeam, "fireAoe", 210, 1.05);
      return;
    case "knockbackWave":
      knockbackWave(gift, ctx, damage, targetTeam);
      return;
    case "meteorShower":
      meteorShower(gift, ctx, damage, targetTeam);
      return;
    case "giantLaser":
      giantLaser(gift, ctx, damage, targetTeam);
      return;
    case "ultimateScreenAttack":
      ultimateScreenAttack(gift, ctx, damage, targetTeam);
      return;
    case "comboChain":
      comboChain(gift, ctx, damage, targetTeam);
      return;
    case "directScore":
      ctx.addScore(ctx.sourceTeam, GIFT_BALANCE.scoreGiftAmount, gift.label);
      ctx.addEffect(
        createEffect({
          type: "scorePulse",
          x: ctx.sourceTeam === 1 ? FIELD.x + 175 : FIELD.x + FIELD.width - 175,
          y: FIELD.y + 80,
          color: ctx.teamColor(ctx.sourceTeam),
          now: ctx.now,
          radius: 230,
          durationMs: 1100,
          intensity: 1.35,
          team: ctx.sourceTeam,
        }),
      );
      return;
  }
}

function sortedByNearest(players: Player[], sourceTeam: TeamId) {
  const sourceX = sourceTeam === 1 ? FIELD.x : FIELD.x + FIELD.width;
  return [...players].sort((a, b) => Math.abs(a.x - sourceX) - Math.abs(b.x - sourceX));
}

function effectOrigin(sourceTeam: TeamId) {
  return {
    x: sourceTeam === 1 ? FIELD.x + 34 : FIELD.x + FIELD.width - 34,
    y: randomBetween(FIELD.y + 150, FIELD.y + FIELD.height - 150),
  };
}

function smallMissile(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  const target = sortedByNearest(ctx.getLivePlayers(targetTeam), opposingTeam(targetTeam))[0];
  if (!target) {
    return;
  }

  const origin = effectOrigin(ctx.sourceTeam);
  ctx.addEffect(
    createEffect({
      type: "missile",
      x: origin.x,
      y: origin.y,
      targetX: target.x,
      targetY: target.y,
      color: ctx.teamColor(ctx.sourceTeam),
      now: ctx.now,
      radius: 26,
      durationMs: 650,
      intensity: 1,
      team: ctx.sourceTeam,
    }),
  );
  ctx.damagePlayer(target, damage, ctx.sourceTeam, gift.label);
}

function bulletStorm(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  const targets = sortedByNearest(ctx.getLivePlayers(targetTeam), ctx.sourceTeam).slice(0, 14);
  for (const target of targets) {
    const origin = effectOrigin(ctx.sourceTeam);
    ctx.addEffect(
      createEffect({
        type: "bulletStorm",
        x: origin.x,
        y: origin.y,
        targetX: target.x + randomBetween(-18, 18),
        targetY: target.y + randomBetween(-18, 18),
        color: ctx.teamColor(ctx.sourceTeam),
        now: ctx.now,
        radius: 9,
        durationMs: 360,
        intensity: 0.7,
        team: ctx.sourceTeam,
      }),
    );
    ctx.damagePlayer(target, Math.max(2, damage), ctx.sourceTeam, gift.label);
  }
}

function thunderBridge(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  const y = randomBetween(FIELD.y + 230, FIELD.y + FIELD.height - 230);
  ctx.addEffect(
    createEffect({
      type: "thunderBridge",
      x: FIELD.x + 80,
      y,
      targetX: FIELD.x + FIELD.width - 80,
      targetY: y + randomBetween(-70, 70),
      color: "#f7f78b",
      now: ctx.now,
      radius: 115,
      durationMs: 760,
      intensity: 1.15,
      team: ctx.sourceTeam,
    }),
  );

  for (const target of ctx.getLivePlayers(targetTeam)) {
    if (Math.abs(target.y - y) < 150) {
      ctx.damagePlayer(target, damage, ctx.sourceTeam, gift.label);
    }
  }
}

function findAreaCenter(players: Player[]) {
  if (players.length === 0) {
    return {
      x: FIELD.centerX,
      y: FIELD.centerY,
    };
  }

  const candidate = pickOne(players);
  return {
    x: candidate.x + randomBetween(-70, 70),
    y: candidate.y + randomBetween(-70, 70),
  };
}

function areaAttack(
  gift: GiftAttackDefinition,
  ctx: AttackContext,
  damage: number,
  targetTeam: TeamId,
  type: "tornado" | "fireAoe",
  radius: number,
  multiplier: number,
) {
  const targets = ctx.getLivePlayers(targetTeam);
  const center = findAreaCenter(targets);
  ctx.addEffect(
    createEffect({
      type,
      x: center.x,
      y: center.y,
      color: type === "fireAoe" ? "#ff7935" : "#b7fbff",
      now: ctx.now,
      radius,
      durationMs: type === "fireAoe" ? 1000 : 1250,
      intensity: multiplier,
      team: ctx.sourceTeam,
    }),
  );

  for (const target of targets) {
    const d = distance(center, target);
    if (d <= radius) {
      const falloff = 1 - d / (radius * 1.4);
      ctx.damagePlayer(target, Math.round(damage * Math.max(0.45, falloff) * multiplier), ctx.sourceTeam, gift.label);

      if (type === "tornado") {
        const pull = normalize(center.x - target.x, center.y - target.y);
        target.x += pull.x * 30;
        target.y += pull.y * 30;
      }
    }
  }
}

function knockbackWave(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  const direction = ctx.sourceTeam === 1 ? 1 : -1;
  ctx.addEffect(
    createEffect({
      type: "knockbackWave",
      x: ctx.sourceTeam === 1 ? FIELD.x + 120 : FIELD.x + FIELD.width - 120,
      y: FIELD.centerY,
      targetX: ctx.sourceTeam === 1 ? FIELD.x + FIELD.width - 80 : FIELD.x + 80,
      targetY: FIELD.centerY,
      color: ctx.teamColor(ctx.sourceTeam),
      now: ctx.now,
      radius: 250,
      durationMs: 850,
      intensity: 1.2,
      team: ctx.sourceTeam,
    }),
  );

  for (const target of ctx.getLivePlayers(targetTeam)) {
    target.x += direction * 82;
    target.vx += direction * 140;
    ctx.damagePlayer(target, damage, ctx.sourceTeam, gift.label);
  }
}

function meteorShower(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  const targets = ctx.getLivePlayers(targetTeam);
  const bombs = Math.max(4, Math.min(8, targets.length || 4));

  for (let index = 0; index < bombs; index += 1) {
    const center = findAreaCenter(targets);
    ctx.addEffect(
      createEffect({
        type: "meteorShower",
        x: center.x + randomBetween(-80, 80),
        y: center.y + randomBetween(-80, 80),
        color: "#ffb347",
        now: ctx.now + index * 24,
        radius: 150,
        durationMs: 900,
        intensity: 1.15,
        team: ctx.sourceTeam,
      }),
    );
  }

  for (const target of targets) {
    if (Math.random() < 0.58) {
      ctx.damagePlayer(target, damage, ctx.sourceTeam, gift.label);
    }
  }
}

function giantLaser(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  const y = findAreaCenter(ctx.getLivePlayers(targetTeam)).y;
  ctx.addEffect(
    createEffect({
      type: "laser",
      x: FIELD.x + 35,
      y,
      targetX: FIELD.x + FIELD.width - 35,
      targetY: y,
      color: "#c77dff",
      now: ctx.now,
      radius: 92,
      durationMs: 1000,
      intensity: 1.4,
      team: ctx.sourceTeam,
    }),
  );

  for (const target of ctx.getLivePlayers(targetTeam)) {
    if (Math.abs(target.y - y) < 120) {
      ctx.damagePlayer(target, damage, ctx.sourceTeam, gift.label);
    }
  }
}

function ultimateScreenAttack(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  ctx.shake(18, GIFT_BALANCE.ultimateShakeMs);
  ctx.addEffect(
    createEffect({
      type: "ultimate",
      x: FIELD.centerX,
      y: FIELD.centerY,
      color: "#ffffff",
      now: ctx.now,
      radius: 820,
      durationMs: 1400,
      intensity: 1.7,
      team: ctx.sourceTeam,
    }),
  );

  for (const target of ctx.getLivePlayers(targetTeam)) {
    ctx.damagePlayer(target, damage, ctx.sourceTeam, gift.label);
  }
}

function comboChain(gift: GiftAttackDefinition, ctx: AttackContext, damage: number, targetTeam: TeamId) {
  bulletStorm(gift, ctx, Math.round(damage * 0.28), targetTeam);
  thunderBridge(gift, ctx, Math.round(damage * 0.52), targetTeam);
  meteorShower(gift, ctx, Math.round(damage * 0.62), targetTeam);
  ctx.addEffect(
    createEffect({
      type: "combo",
      x: FIELD.centerX,
      y: FIELD.centerY,
      color: ctx.teamColor(ctx.sourceTeam),
      now: ctx.now,
      radius: 520,
      durationMs: 1200,
      intensity: 1.25,
      team: ctx.sourceTeam,
    }),
  );
}
