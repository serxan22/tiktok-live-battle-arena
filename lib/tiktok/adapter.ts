import type { TikTokLiveEvent } from "./types";

export interface TikTokLiveAdapter {
  mode: "mock" | "real";
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  onEvent: (listener: (event: TikTokLiveEvent) => void) => () => void;
}

export function getTikTokUsername() {
  return process.env.NEXT_PUBLIC_TIKTOK_USERNAME?.trim() || "";
}

export function getTikTokMode() {
  return (process.env.NEXT_PUBLIC_GAME_MODE || "mock").toLowerCase();
}
