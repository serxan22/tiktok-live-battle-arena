/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ARENA_HEIGHT, ARENA_WIDTH, FIELD, GOAL } from "@/lib/game/constants";
import type { BattleEngine } from "@/lib/game/engine";
import type { DamageNumber, EngineFrameState, Player, VisualEffect } from "@/lib/game/types";
import { effectProgress } from "@/lib/game/effects";
import { playerInitials } from "@/lib/game/utils";
import { useEffect, useRef } from "react";

interface BattleCanvasProps {
  engine: BattleEngine;
}

interface PlayerView {
  container: any;
  shadow: any;
  aura: any;
  body: any;
  hp: any;
  label: any;
  name: any;
}

interface DamageView {
  text: any;
}

function colorNumber(color: string) {
  return Number.parseInt(color.replace("#", ""), 16);
}

function alphaFor(effect: VisualEffect, now: number) {
  const progress = effectProgress(effect, now);
  return Math.max(0, 1 - progress);
}

export default function BattleCanvas({ engine }: BattleCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let app: any;
    const host = hostRef.current;
    const playerViews = new Map<string, PlayerView>();
    const damageViews = new Map<string, DamageView>();

    async function boot() {
      const PIXI = await import("pixi.js");
      if (disposed || !host) {
        return;
      }

      app = new PIXI.Application();
      await app.init({
        width: ARENA_WIDTH,
        height: ARENA_HEIGHT,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
      });

      app.canvas.className = "battle-canvas";
      host.appendChild(app.canvas);

      const root = new PIXI.Container();
      const fieldLayer = new PIXI.Graphics();
      const effectLayer = new PIXI.Graphics();
      const playerLayer = new PIXI.Container();
      const damageLayer = new PIXI.Container();

      app.stage.addChild(root);
      root.addChild(fieldLayer);
      root.addChild(effectLayer);
      root.addChild(playerLayer);
      root.addChild(damageLayer);

      const render = () => {
        const state = engine.getFrameState();
        const now = performance.now();
        const shake = state.shake;

        root.x = shake ? (Math.random() - 0.5) * shake : 0;
        root.y = shake ? (Math.random() - 0.5) * shake : 0;

        drawField(fieldLayer, state);
        drawEffects(effectLayer, state.effects, now);
        drawPlayers(PIXI, playerLayer, playerViews, state.players);
        drawDamage(PIXI, damageLayer, damageViews, state.damageNumbers, now);
      };

      app.ticker.add((ticker: any) => {
        engine.step(ticker.deltaMS ?? ticker.elapsedMS ?? 16.7);
        render();
      });

      render();
    }

    void boot();

    return () => {
      disposed = true;
      for (const view of playerViews.values()) {
        view.container.destroy({ children: true });
      }
      for (const view of damageViews.values()) {
        view.text.destroy();
      }
      app?.destroy(true, { children: true });
      if (host) {
        host.innerHTML = "";
      }
    };
  }, [engine]);

  return <div ref={hostRef} className="absolute inset-0 z-0 overflow-hidden" />;
}

function drawField(g: any, state: EngineFrameState) {
  const team1 = state.teams[1];
  const team2 = state.teams[2];

  g.clear();
  g.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill(0x050713);

  const tint =
    state.theme === "inferno" ? 0x24120d : state.theme === "aurora" ? 0x102435 : 0x071d1d;
  g.roundRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height, 34)
    .fill({ color: tint, alpha: 0.96 })
    .stroke({ color: 0xffffff, alpha: 0.15, width: 4 });

  for (let i = 0; i < 9; i += 1) {
    const y = FIELD.y + 78 + i * 142;
    g.moveTo(FIELD.x + 26, y)
      .lineTo(FIELD.x + FIELD.width - 26, y)
      .stroke({ color: 0xffffff, alpha: 0.045, width: 2 });
  }

  g.moveTo(FIELD.centerX, FIELD.y + 22)
    .lineTo(FIELD.centerX, FIELD.y + FIELD.height - 22)
    .stroke({ color: 0xffffff, alpha: 0.24, width: 4 });
  g.circle(FIELD.centerX, FIELD.centerY, 154).stroke({ color: 0xffffff, alpha: 0.22, width: 4 });
  g.circle(FIELD.centerX, FIELD.centerY, 10).fill({ color: 0xffffff, alpha: 0.45 });

  g.roundRect(FIELD.x - GOAL.width, FIELD.centerY - GOAL.height / 2, GOAL.width, GOAL.height, 12)
    .fill({ color: colorNumber(team1.primary), alpha: 0.22 })
    .stroke({ color: colorNumber(team1.primary), alpha: 0.8, width: 3 });
  g.roundRect(FIELD.x + FIELD.width, FIELD.centerY - GOAL.height / 2, GOAL.width, GOAL.height, 12)
    .fill({ color: colorNumber(team2.primary), alpha: 0.22 })
    .stroke({ color: colorNumber(team2.primary), alpha: 0.8, width: 3 });

  g.roundRect(FIELD.x + 34, FIELD.y + 34, FIELD.width / 2 - 50, FIELD.height - 68, 24)
    .fill({ color: colorNumber(team1.secondary), alpha: 0.045 });
  g.roundRect(FIELD.centerX + 16, FIELD.y + 34, FIELD.width / 2 - 50, FIELD.height - 68, 24)
    .fill({ color: colorNumber(team2.secondary), alpha: 0.045 });
}

function drawPlayers(PIXI: any, layer: any, views: Map<string, PlayerView>, players: Player[]) {
  const active = new Set(players.map((player) => player.id));

  for (const [id, view] of views) {
    if (!active.has(id)) {
      layer.removeChild(view.container);
      view.container.destroy({ children: true });
      views.delete(id);
    }
  }

  for (const player of players) {
    let view = views.get(player.id);
    if (!view) {
      view = createPlayerView(PIXI);
      views.set(player.id, view);
      layer.addChild(view.container);
    }

    updatePlayerView(view, player);
  }
}

function createPlayerView(PIXI: any): PlayerView {
  const container = new PIXI.Container();
  const shadow = new PIXI.Graphics();
  const aura = new PIXI.Graphics();
  const body = new PIXI.Graphics();
  const hp = new PIXI.Graphics();
  const label = new PIXI.Text({
    text: "",
    style: {
      fontFamily: "Arial",
      fontSize: 18,
      fontWeight: "900",
      fill: 0xffffff,
      align: "center",
    },
  });
  const name = new PIXI.Text({
    text: "",
    style: {
      fontFamily: "Arial",
      fontSize: 12,
      fontWeight: "700",
      fill: 0xdbeafe,
      align: "center",
    },
  });

  label.anchor.set(0.5);
  name.anchor.set(0.5);
  name.y = 35;

  container.addChild(shadow, aura, body, hp, label, name);
  return { container, shadow, aura, body, hp, label, name };
}

function updatePlayerView(view: PlayerView, player: Player) {
  const color = player.team === 1 ? 0x18d4ff : 0xff3568;
  const alt = player.team === 1 ? 0x235bff : 0xff8b1f;
  const hpRatio = Math.max(0, player.hp / player.maxHp);
  const radius = player.radius;

  view.container.x = player.x;
  view.container.y = player.y;
  view.container.alpha = player.alive ? 1 : 0.24;
  view.container.scale.set(player.alive ? 1 : 0.72);

  view.shadow.clear().ellipse(0, radius + 9, radius * 1.28, radius * 0.42).fill({ color: 0x000000, alpha: 0.35 });

  view.aura.clear();
  if (player.isBoosted) {
    view.aura.circle(0, 0, radius + 11).fill({ color, alpha: 0.16 }).stroke({ color, alpha: 0.55, width: 3 });
  }

  view.body
    .clear()
    .circle(0, 0, radius)
    .fill({ color: alt, alpha: 0.96 })
    .circle(-radius * 0.28, -radius * 0.35, radius * 0.46)
    .fill({ color: 0xffffff, alpha: 0.22 })
    .stroke({ color, alpha: 0.92, width: 3 });

  view.hp.clear();
  view.hp.circle(0, 0, radius + 6).stroke({ color: 0x0f172a, alpha: 0.75, width: 4 });
  view.hp.arc(0, 0, radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpRatio).stroke({
    color: hpRatio > 0.45 ? 0x60f7b1 : hpRatio > 0.22 ? 0xffd166 : 0xff4d6d,
    alpha: 1,
    width: 4,
  });

  view.label.text = playerInitials(player.username);
  view.name.text = player.username.replace("@", "").slice(0, 10);
}

function drawEffects(g: any, effects: VisualEffect[], now: number) {
  g.clear();

  for (const effect of effects) {
    const progress = effectProgress(effect, now);
    const alpha = alphaFor(effect, now);
    const color = colorNumber(effect.color.startsWith("#") ? effect.color : "#ffffff");
    const x = effect.targetX == null ? effect.x : effect.x + (effect.targetX - effect.x) * progress;
    const y = effect.targetY == null ? effect.y : effect.y + (effect.targetY - effect.y) * progress;

    if (effect.type === "missile" || effect.type === "bulletStorm") {
      g.moveTo(effect.x, effect.y)
        .lineTo(x, y)
        .stroke({ color, alpha: Math.max(0.15, alpha), width: effect.type === "missile" ? 7 : 3 });
      g.circle(x, y, effect.radius * (effect.type === "missile" ? 0.75 : 0.5)).fill({ color, alpha: 0.9 });
      continue;
    }

    if (effect.type === "laser" || effect.type === "thunderBridge" || effect.type === "knockbackWave") {
      const width = effect.type === "laser" ? 42 : effect.type === "thunderBridge" ? 12 : 24;
      g.moveTo(effect.x, effect.y)
        .lineTo(effect.targetX ?? effect.x, effect.targetY ?? effect.y)
        .stroke({ color, alpha: Math.max(0.08, alpha * 0.85), width });
      g.moveTo(effect.x, effect.y + 12)
        .lineTo(effect.targetX ?? effect.x, (effect.targetY ?? effect.y) - 12)
        .stroke({ color: 0xffffff, alpha: Math.max(0.04, alpha * 0.45), width: Math.max(3, width * 0.28) });
      continue;
    }

    if (effect.type === "meteorShower") {
      g.circle(effect.x, effect.y, effect.radius * (0.18 + progress)).fill({ color, alpha: 0.16 * alpha });
      g.circle(effect.x, effect.y, 28 + progress * 18).fill({ color, alpha: 0.72 * alpha });
      g.moveTo(effect.x - 92, effect.y - 150)
        .lineTo(effect.x, effect.y)
        .stroke({ color: 0xfff3b0, alpha: 0.7 * alpha, width: 8 });
      continue;
    }

    if (effect.type === "tornado") {
      for (let i = 0; i < 4; i += 1) {
        g.circle(effect.x, effect.y, effect.radius * (0.32 + progress * 0.42) - i * 18)
          .stroke({ color, alpha: 0.42 * alpha, width: 8 - i });
      }
      continue;
    }

    if (effect.type === "ultimate" || effect.type === "combo") {
      g.circle(effect.x, effect.y, effect.radius * (0.18 + progress * 0.96)).fill({ color, alpha: 0.08 * alpha });
      g.circle(effect.x, effect.y, effect.radius * (0.08 + progress * 0.82)).stroke({
        color: 0xffffff,
        alpha: 0.75 * alpha,
        width: 11,
      });
      continue;
    }

    g.circle(effect.x, effect.y, Math.max(12, effect.radius * (0.35 + progress * 0.75)))
      .fill({ color, alpha: 0.12 * alpha })
      .stroke({ color, alpha: 0.7 * alpha, width: 6 });
  }
}

function drawDamage(PIXI: any, layer: any, views: Map<string, DamageView>, numbers: DamageNumber[], now: number) {
  const active = new Set(numbers.map((number) => number.id));

  for (const [id, view] of views) {
    if (!active.has(id)) {
      layer.removeChild(view.text);
      view.text.destroy();
      views.delete(id);
    }
  }

  for (const number of numbers) {
    let view = views.get(number.id);
    if (!view) {
      const text = new PIXI.Text({
        text: "",
        style: {
          fontFamily: "Arial",
          fontSize: number.critical ? 26 : 19,
          fontWeight: "900",
          fill: colorNumber(number.color.startsWith("#") ? number.color : "#ffffff"),
          stroke: { color: 0x000000, width: 4 },
        },
      });
      text.anchor.set(0.5);
      view = { text };
      views.set(number.id, view);
      layer.addChild(text);
    }

    const duration = Math.max(1, number.expiresAt - number.createdAt);
    const progress = Math.min(1, Math.max(0, (now - number.createdAt) / duration));
    view.text.text = `${number.critical ? "CRIT " : ""}-${number.value}`;
    view.text.x = number.x;
    view.text.y = number.y - progress * 46;
    view.text.alpha = 1 - progress;
    view.text.scale.set(1 + (number.critical ? 0.18 : 0) + (1 - progress) * 0.08);
  }
}
