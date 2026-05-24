import type { TeamId } from "@/lib/game/types";

export type TikTokEventType = "comment" | "gift" | "like" | "follow" | "connected" | "disconnected";

export interface TikTokUser {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface TikTokCommentEvent {
  type: "comment";
  user: TikTokUser;
  comment: string;
}

export interface TikTokGiftEvent {
  type: "gift";
  user: TikTokUser;
  giftName: string;
  giftId?: string;
  repeatCount: number;
  diamondCount?: number;
  teamHint?: TeamId;
}

export interface TikTokLikeEvent {
  type: "like";
  user: TikTokUser;
  likeCount: number;
  totalLikeCount?: number;
  teamHint?: TeamId;
}

export interface TikTokFollowEvent {
  type: "follow";
  user: TikTokUser;
  teamHint?: TeamId;
}

export interface TikTokConnectionEvent {
  type: "connected" | "disconnected";
  username: string;
  reason?: string;
  reconnecting?: boolean;
}

export type TikTokLiveEvent =
  | TikTokCommentEvent
  | TikTokGiftEvent
  | TikTokLikeEvent
  | TikTokFollowEvent
  | TikTokConnectionEvent;

export interface TikTokConnectorPlan {
  usernameEnv: "NEXT_PUBLIC_TIKTOK_USERNAME";
  publicModeEnv: "NEXT_PUBLIC_GAME_MODE";
  serverSecretPolicy: "no-public-secrets";
  commentMapping: "comment 1 joins team 1, comment 2 joins team 2";
  giftMapping: "TikTok gift name maps to lib/game/gifts.ts attack definitions";
  reconnectStrategy: "exponential-backoff-with-status-events";
}
