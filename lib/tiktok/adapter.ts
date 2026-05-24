import type { TikTokLiveEvent } from "./types";

export type TikTokAdapterMode = "mock" | "real";

export interface TikTokLiveAdapter {
  mode: TikTokAdapterMode;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  onEvent: (listener: (event: TikTokLiveEvent) => void) => () => void;
}

/**
 * Public env only identifies the creator account and preferred frontend mode.
 * Any signing service, session cookie, API key, proxy token, or connector secret
 * must live in a server process or dedicated realtime relay, never in NEXT_PUBLIC_*.
 */
export const TIKTOK_ENV = {
  username: "NEXT_PUBLIC_TIKTOK_USERNAME",
  mode: "NEXT_PUBLIC_GAME_MODE",
  realtimeMode: "NEXT_PUBLIC_REALTIME_MODE",
  realtimeUrl: "NEXT_PUBLIC_SOCKET_URL",
  roomId: "NEXT_PUBLIC_ROOM_ID",
};

export function getTikTokUsername() {
  return process.env.NEXT_PUBLIC_TIKTOK_USERNAME?.trim() || "";
}

export function getTikTokMode(): TikTokAdapterMode {
  return process.env.NEXT_PUBLIC_GAME_MODE?.toLowerCase() === "real" ? "real" : "mock";
}
