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
- Production Socket.io relay for remote `/control` and `/live` rooms across devices and deployments.
- Creator config types prepared for later Supabase storage.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PixiJS
- Zustand
- Socket.io relay
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
NEXT_PUBLIC_REALTIME_MODE=local
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_ROOM_ID=main-live-room
REALTIME_PORT=4000
CORS_ORIGIN=
```

Use `NEXT_PUBLIC_GAME_MODE=mock` for local testing. Keep `NEXT_PUBLIC_REALTIME_MODE=local` for same-browser or same-machine tests. Switch to `socket` when `/control` and `/live` need to sync across different devices, networks, or deployed environments.

## Testing `/live` and `/control`

1. Start `npm run dev`.
2. Open `/live` in one browser tab.
3. Open `/control` in another browser tab.
4. Click `+50 stress` to add 50 fake viewers.
5. Trigger Rose, Thunder Bridge, Meteor Shower, Galaxy Laser, Ultimate, and All Combo.
6. Use pause, resume, reset, and debug mode.
7. Confirm the live view remains readable and the arena is not covered by panels.

Mock mode also generates comments, likes, follows, and gifts automatically.

## Realtime Modes

### Local Mode

Local mode is the default:

```bash
NEXT_PUBLIC_REALTIME_MODE=local
```

It uses BroadcastChannel with a localStorage fallback. This is perfect for opening `/live` and `/control` in two tabs on the same machine. It does not sync across different devices because browser storage and BroadcastChannel are local to one browser profile.

### Socket Mode

Socket mode uses the standalone relay in `server/realtime-server.mjs`:

```bash
npm run realtime
```

Then set the frontend environment:

```bash
NEXT_PUBLIC_REALTIME_MODE=socket
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_ROOM_ID=main-live-room
```

Open `/live` as the display client and `/control` as the controller. Both join the same room ID. Control commands, snapshots, config changes, theme changes, pause/resume, reset, stress tests, and gift triggers are relayed through Socket.io. If the socket disconnects, the client shows reconnect status and keeps the local fallback available for same-browser testing.

Relay health check:

```bash
curl http://localhost:4000/health
```

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

Local realtime uses:

- `lib/realtime/broadcastChannel.ts`
- `lib/realtime/broadcaster.ts`

Socket realtime uses:

- `lib/realtime/socketTypes.ts`
- `lib/realtime/socketAdapter.ts`
- `server/realtime-server.mjs`

Rooms are keyed by `NEXT_PUBLIC_ROOM_ID`. `/live` joins as a `display`, `/control` joins as a `controller`, and optional passive clients can join as `observers`. The relay broadcasts `game:command`, `game:snapshot`, and `room:presence` events without storing game state.

Future Socket.io relay hooks are intentionally isolated in `lib/realtime/broadcaster.ts` and `lib/realtime/socketAdapter.ts` so a production auth layer, creator routing, or persistence layer can be added without changing the game engine.

## Deployment Notes

Frontend deployment:

```bash
npm run build
npm run start
```

Vercel is fine for the frontend. For remote multi-device realtime, deploy a separate Node Socket.io relay to Railway, Render, Fly.io, or a VPS and set `NEXT_PUBLIC_SOCKET_URL`.

Socket relay deployment:

```bash
npm install
npm run realtime
```

Set relay environment:

```bash
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.com
```

Set frontend environment:

```bash
NEXT_PUBLIC_REALTIME_MODE=socket
NEXT_PUBLIC_SOCKET_URL=https://your-realtime-relay.example.com
NEXT_PUBLIC_ROOM_ID=main-live-room
```

Remote `/control` and `/live` need this relay because Vercel serverless routes are not a long-running Socket.io process. Railway, Render, Fly.io, or a VPS can keep the Node relay alive and route WebSocket traffic reliably.

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
- Remote `/control` does not affect `/live`: set `NEXT_PUBLIC_REALTIME_MODE=socket`, deploy the Socket.io relay, and point `NEXT_PUBLIC_SOCKET_URL` to it.
- Socket status stays reconnecting: verify the relay is running, `CORS_ORIGIN` allows the frontend domain, both clients use the same `NEXT_PUBLIC_ROOM_ID`, and `/health` returns JSON.
- Real TikTok does not connect: `lib/tiktok/realAdapter.ts` is still a placeholder until a connector is wired.
- Hydration errors: the live shell mounts a deterministic loading frame before starting the client simulation; if errors return, check for server-rendered random/timer values.
