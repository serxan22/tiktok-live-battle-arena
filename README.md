# TikTok LIVE Battle Arena

Production-oriented Next.js prototype for a vertical TikTok LIVE interactive football battle arena. Viewers join Team 1 or Team 2 by commenting `1` or `2`, avatars spawn into a 2D pitch, units auto-fight, and gifts fire mapped attacks with premium OBS-ready visuals.

## What This Includes

- `/live`: 9:16 OBS game screen designed for a `1080x1920` Browser Source.
- `/control`: creator dashboard for local testing, fake users, gifts, match state, balance, teams, themes, and config JSON.
- PixiJS client renderer with a real game loop outside React.
- Auto-targeting combat, HP rings, damage numbers, deaths, respawns, boosted units, score, kill feed, gift feed, and debug overlay.
- Gift engine with cooldowns, tiers, target modes, visual effects, and balance overrides.
- Mock TikTok adapter plus real TikTok connector placeholder.
- BroadcastChannel/localStorage realtime fallback for same-machine `/live` and `/control`.
- Socket.io-ready types and adapter for future remote control rooms.
- Creator config types prepared for later Supabase storage.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PixiJS
- Zustand
- Socket.io architecture
- BroadcastChannel/localStorage fallback

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

- `http://localhost:3000/live`
- `http://localhost:3000/control`

## Environment

```bash
NEXT_PUBLIC_TIKTOK_USERNAME=
NEXT_PUBLIC_GAME_MODE=mock
SOCKET_SERVER_URL=
NEXT_PUBLIC_SOCKET_SERVER_URL=
```

Use `NEXT_PUBLIC_GAME_MODE=mock` for local testing. `NEXT_PUBLIC_SOCKET_SERVER_URL` is only needed once a remote Socket.io relay exists.

## Testing `/live` and `/control`

1. Start `npm run dev`.
2. Open `/live` in one browser tab.
3. Open `/control` in another browser tab.
4. Click `+50 stress` to add 50 fake viewers.
5. Trigger Rose, Thunder Bridge, Meteor Shower, Galaxy Laser, Ultimate, and All Combo.
6. Use pause, resume, reset, and debug mode.
7. Confirm the live view remains readable and the arena is not covered by panels.

Mock mode also generates comments, likes, follows, and gifts automatically.

## OBS Setup

Create an OBS Browser Source:

- URL: `http://localhost:3000/live`
- Width: `1080`
- Height: `1920`
- FPS: `60`
- Shutdown source when not visible: optional
- Refresh browser when scene becomes active: optional

The live screen uses a centered vertical stage with safe top, arena, feed, and gift-dock bands. It also scales down cleanly for laptop preview while keeping the OBS coordinate system intact.

## Gift Customization

Gift definitions live in:

- `lib/game/gifts.ts`
- `lib/game/attacks.ts`
- `lib/game/balancing.ts`

Each gift includes:

- `id`
- TikTok gift name
- label
- icon
- tier
- damage
- cooldown
- target mode
- animation type
- description
- handler

Runtime damage and cooldown overrides can be changed in `/control` and exported/imported as JSON.

## Teams, Themes, and Layout

Core creator defaults live in:

- `lib/game/config.ts`
- `lib/game/constants.ts`
- `lib/creator/defaultConfig.ts`

Config includes team identity, theme colors, round duration, max visible players, respawn settings, attack balance, and OBS layout bands.

## TikTok Connector Plan

Current real connector boundary:

- `lib/tiktok/adapter.ts`
- `lib/tiktok/types.ts`
- `lib/tiktok/handlers.ts`
- `lib/tiktok/realAdapter.ts`

The real connector is intentionally not wired yet. Add `TikTokLiveConnector` in `lib/tiktok/realAdapter.ts` or, preferably, inside a future Node Socket.io relay if the connector needs server-only credentials, cookies, signing, or proxy configuration.

Mapping rules:

- Comment `1` joins Team 1.
- Comment `2` joins Team 2.
- Gifts map by TikTok gift name to `lib/game/gifts.ts`.
- Likes create small team effects.
- Follows spawn boosted units and a hook effect.

No secrets should ever be placed in `NEXT_PUBLIC_*` variables.

## Realtime Architecture

Local testing uses:

- `lib/realtime/broadcastChannel.ts`
- `lib/realtime/broadcaster.ts`

Future remote control uses:

- `lib/realtime/socketTypes.ts`
- `lib/realtime/socketAdapter.ts`

When `/control` and `/live` run on different machines or browsers without shared local browser channels, deploy a Socket.io relay. The relay should join room IDs and rebroadcast `game:command` and `game:snapshot` events.

## Deployment Notes

Frontend deployment:

```bash
npm run build
npm run start
```

Vercel is fine for the frontend. For remote multi-device realtime, deploy a separate Node Socket.io relay to Railway, Render, Fly.io, or a VPS and set `NEXT_PUBLIC_SOCKET_SERVER_URL`.

## Future Supabase Plan

No database is included yet. Supabase can later persist:

- creators
- rooms/sessions
- match history
- gift configs
- theme configs

Start from `lib/creator/types.ts` and `lib/creator/defaultConfig.ts`.

## Performance Notes

- PixiJS renders every frame.
- React receives lower-frequency snapshots.
- Player views, damage numbers, and effects are pruned continuously.
- Visible players are capped by config.
- Effects are drawn with simple shapes and short lifetimes for stable 50-100 viewer tests.

## Troubleshooting

- `/control` says `Open /live`: open `/live` in another tab first.
- Buttons do nothing: check gift cooldowns and selected target team.
- OBS crops the scene: use `1080x1920` Browser Source dimensions.
- Remote `/control` does not affect `/live`: deploy the Socket.io relay and set `NEXT_PUBLIC_SOCKET_SERVER_URL`.
- Real TikTok does not connect: `lib/tiktok/realAdapter.ts` is still a placeholder until a connector is wired.
- Hydration errors: the live shell mounts a deterministic loading frame before starting the client simulation; if errors return, check for server-rendered random/timer values.
