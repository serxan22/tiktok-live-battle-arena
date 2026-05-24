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
}

export type TikTokLiveEvent =
  | TikTokCommentEvent
  | TikTokGiftEvent
  | TikTokLikeEvent
  | TikTokFollowEvent
  | TikTokConnectionEvent;
