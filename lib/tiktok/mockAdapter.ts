import { GIFT_ATTACKS } from "@/lib/game/gifts";
import { randomUsername } from "@/lib/game/mockUsers";
import type { TeamId } from "@/lib/game/types";
import { pickOne } from "@/lib/game/utils";
import type { TikTokLiveAdapter } from "./adapter";
import type { TikTokLiveEvent, TikTokUser } from "./types";

function mockUser(): TikTokUser {
  const username = randomUsername();
  return {
    userId: username,
    username,
    displayName: username.replace("@", ""),
    avatarUrl: `generated://${encodeURIComponent(username)}`,
  };
}

export class MockTikTokLiveAdapter implements TikTokLiveAdapter {
  mode = "mock" as const;

  private listeners = new Set<(event: TikTokLiveEvent) => void>();

  private timer?: ReturnType<typeof setInterval>;

  constructor(private username = "mock-live") {}

  async connect() {
    this.emit({ type: "connected", username: this.username });
    this.timer = setInterval(() => {
      const roll = Math.random();
      const user = mockUser();
      const teamHint = (Math.random() > 0.5 ? 1 : 2) as TeamId;

      if (roll < 0.45) {
        this.emit({ type: "comment", user, comment: String(teamHint) });
        return;
      }

      if (roll < 0.68) {
        this.emit({
          type: "like",
          user,
          likeCount: Math.floor(Math.random() * 5) + 1,
          teamHint,
        });
        return;
      }

      if (roll < 0.84) {
        this.emit({ type: "follow", user, teamHint });
        return;
      }

      const gift = pickOne(GIFT_ATTACKS);
      this.emit({
        type: "gift",
        user,
        giftName: gift.tiktokGiftName,
        giftId: gift.id,
        repeatCount: 1,
        teamHint,
      });
    }, 1900);
  }

  async disconnect() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.emit({ type: "disconnected", username: this.username, reason: "mock stopped" });
  }

  onEvent(listener: (event: TikTokLiveEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: TikTokLiveEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
