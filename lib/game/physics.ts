import {
  FIELD,
  PLAYER_ATTACK_COOLDOWN_MS,
  PLAYER_ATTACK_RANGE,
} from "./constants";
import { COMBAT_BALANCE } from "./balancing";
import type { Player } from "./types";
import { clamp, distance, normalize } from "./utils";

export interface PhysicsCallbacks {
  onHit: (attacker: Player, defender: Player, amount: number, critical: boolean) => void;
}

function liveEnemies(player: Player, players: Player[]) {
  return players.filter((candidate) => candidate.alive && candidate.team !== player.team);
}

function nearestEnemy(player: Player, players: Player[]) {
  let nearest: Player | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const enemy of liveEnemies(player, players)) {
    const d = distance(player, enemy);
    if (d < nearestDistance) {
      nearest = enemy;
      nearestDistance = d;
    }
  }

  return nearest;
}

export function stepPlayers(players: Player[], dtSeconds: number, now: number, callbacks: PhysicsCallbacks) {
  for (const player of players) {
    if (!player.alive) {
      player.vx = 0;
      player.vy = 0;
      continue;
    }

    const target = nearestEnemy(player, players);
    player.targetId = target?.id;

    if (!target) {
      player.vx *= 0.9;
      player.vy *= 0.9;
      continue;
    }

    const vector = normalize(target.x - player.x, target.y - player.y);
    const attackRange = PLAYER_ATTACK_RANGE + player.radius * 0.35;

    if (vector.len > attackRange) {
      player.vx = vector.x * player.speed;
      player.vy = vector.y * player.speed;
      player.x += player.vx * dtSeconds;
      player.y += player.vy * dtSeconds;
    } else {
      player.vx *= 0.78;
      player.vy *= 0.78;

      if (now - player.lastAttackAt >= PLAYER_ATTACK_COOLDOWN_MS) {
        player.lastAttackAt = now;
        const critical = Math.random() < COMBAT_BALANCE.criticalChance;
        const raw = player.attack * (critical ? COMBAT_BALANCE.criticalMultiplier : 1);
        const amount = Math.max(COMBAT_BALANCE.minDamage, Math.round(raw - target.defense * 0.45));
        callbacks.onHit(player, target, amount, critical);
      }
    }

    player.x = clamp(player.x, FIELD.x + player.radius, FIELD.x + FIELD.width - player.radius);
    player.y = clamp(player.y, FIELD.y + player.radius, FIELD.y + FIELD.height - player.radius);
  }

  resolveOverlap(players, dtSeconds);
}

function resolveOverlap(players: Player[], dtSeconds: number) {
  for (let i = 0; i < players.length; i += 1) {
    const a = players[i];
    if (!a.alive) {
      continue;
    }

    for (let j = i + 1; j < players.length; j += 1) {
      const b = players[j];
      if (!b.alive) {
        continue;
      }

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const minDistance = a.radius + b.radius + 4;

      if (len >= minDistance) {
        continue;
      }

      const push = (minDistance - len) * 0.5 * COMBAT_BALANCE.overlapPush * dtSeconds;
      const nx = dx / len;
      const ny = dy / len;

      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }
}
