# TikTok LIVE Battle Arena

A production-oriented Next.js prototype for an OBS-ready 9:16 TikTok LIVE interactive battle game. Viewers join Team 1 or Team 2 by commenting `1` or `2`, avatars spawn into a football-style arena, units fight automatically, and gifts trigger mapped attacks.

## Features

- `/live` vertical 1080x1920 OBS game screen with PixiJS rendering.
- `/control` creator dashboard for fake users, gifts, timer, pause/resume, reset, teams, themes, debug, and config JSON.
- Real game loop with movement, nearest-enemy targeting, attacks, HP, kills, deaths, respawns, damage numbers, health rings, death effects, and screen shake.
- Gift attack engine with Rose, Like Burst, Follow, Paper Crane, Doughnut, Fire Lotus, Dragon Palm, Meteor Shower, Galaxy, Lion/Universe, All Combo, and All +1 Win.
- TikTok adapter interface with mock adapter, real connector placeholder, and comment/gift/like/follow handlers.
- Realtime architecture with Socket.io event types/adapters and local BroadcastChannel fallback so `/control` can drive `/live`.
- Creator config, theme config, gift runtime overrides, and future Supabase-ready types.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

- `http://localhost:3000/live`
- `http://localhost:3000/control`

## Local Testing

1. Start `npm run dev`.
2. Open `/live` in one browser tab.
3. Open `/control` in another tab.
4. Use `+50 stress` to validate 50+ fake users.
5. Trigger every gift from the gift attack grid.
6. Toggle debug mode to view tick/player/effect counts on `/live`.

The live screen also starts a mock TikTok adapter by default, so comments, likes, follows, and gifts continue to arrive automatically.

## OBS Setup

Use an OBS Browser Source:

- URL: `http://localhost:3000/live`
- Width: `1080`
- Height: `1920`
- FPS: `60`
- Enable browser source transparency only if you want to composite over another scene.

The layout is designed for a vertical TikTok LIVE canvas and keeps controls outside the OBS screen.

## How `/live` and `/control` Work

`/live` owns the authoritative client-side simulation. It runs the battle engine and PixiJS renderer, listens for commands, and broadcasts snapshots.

`/control` sends commands over the realtime broadcaster and receives snapshots for cooldowns and status. Locally this uses `BroadcastChannel`, with a `localStorage` event fallback. Socket.io types and adapters are already present for a future dedicated realtime server.

## Customizing Gifts

Gift definitions live in:

- `lib/game/gifts.ts`
- `lib/game/attacks.ts`
- `lib/game/balancing.ts`

Each gift has `id`, TikTok gift name, label, icon, tier, damage, cooldown, target mode, animation type, description, and handler. Runtime damage/cooldown overrides can be edited in `/control` and exported/imported as JSON.

## Connecting Real TikTok Later

The real integration boundary is:

- `lib/tiktok/adapter.ts`
- `lib/tiktok/handlers.ts`
- `lib/tiktok/realAdapter.ts`

Wire the real `TikTokLiveConnector` in `lib/tiktok/realAdapter.ts`. Keep secrets, signing services, and any credentialed calls on a server process. Do not expose secrets through `NEXT_PUBLIC_*` variables.

Set:

```bash
NEXT_PUBLIC_TIKTOK_USERNAME=your_live_username
NEXT_PUBLIC_GAME_MODE=real
```

Until the connector is wired, real mode uses the placeholder plus mock fallback so the game remains testable.

## Deploying the Frontend

Deploy the Next.js app to Vercel, Netlify, Render, or a VPS:

```bash
npm run build
npm run start
```

For a pure local/OBS setup, no external service is required.

## Deploying Realtime Later

For multi-device creator panels or remote producers, deploy a small Node Socket.io server on Railway, Render, Fly.io, or a VPS using the contracts in:

- `lib/realtime/socketTypes.ts`
- `lib/realtime/socketAdapter.ts`
- `lib/realtime/broadcaster.ts`

The server should accept `room:join`, relay `game:command` to the room, and optionally relay `game:snapshot` to control panels.

## Future Supabase Storage

No database is required now. Later, Supabase can store:

- creators
- rooms/sessions
- matches
- gift configs
- theme configs

The starter types are in `lib/creator/types.ts` and `lib/creator/defaultConfig.ts`. Add Supabase clients server-side first, then persist room config before the live shell creates the battle engine.

## Performance Notes

- The PixiJS renderer updates every frame while React receives snapshots at a lower cadence.
- The engine keeps combat and effects outside React state.
- Visible players are capped by `maxVisiblePlayers`.
- Damage numbers, visual effects, and feed items are pruned continuously.
- The `+50 stress` button is intended for quick local performance checks.

## Troubleshooting

- If `/control` says `Open /live`, open `/live` in another tab so it can own the simulation.
- If commands do not cross tabs, check browser support for `BroadcastChannel`; the fallback uses `localStorage` events.
- If gift buttons appear to do nothing, check cooldown labels.
- If the OBS source is cropped, set Browser Source size to `1080x1920`.
- If real TikTok events do not arrive, confirm `lib/tiktok/realAdapter.ts` has been wired to a real connector and that secrets are not placed in public env vars.
