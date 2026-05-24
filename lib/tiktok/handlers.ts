import { GIFT_BY_ID, getGiftByName } from "@/lib/game/gifts";
import type { GameCommand, TeamId } from "@/lib/game/types";
import { opposingTeam } from "@/lib/game/utils";
import type { TikTokLiveEvent } from "./types";

const userTeams = new Map<string, TeamId>();

/**
 * Converts normalized TikTok events into game commands. This is intentionally
 * connector-agnostic: the real adapter should normalize TikTokLiveConnector
 * payloads into TikTokLiveEvent first, then this function owns battle semantics.
 */
export function tiktokEventToCommands(event: TikTokLiveEvent): GameCommand[] {
  switch (event.type) {
    case "comment": {
      const trimmed = event.comment.trim();
      if (trimmed !== "1" && trimmed !== "2") {
        return [];
      }

      const team = Number(trimmed) as TeamId;
      userTeams.set(event.user.userId, team);
      return [
        {
          type: "addPlayer",
          team,
          username: event.user.username,
        },
      ];
    }
    case "gift": {
      const gift = getGiftByName(event.giftName);
      const giftId = event.giftId && GIFT_BY_ID[event.giftId] ? event.giftId : gift?.id;
      if (!giftId) {
        return [];
      }

      // Gifts inherit the viewer's last chosen team. If the viewer gifted before
      // joining, Team 1 is used so the event remains deterministic in mock mode.
      const sourceTeam = event.teamHint ?? userTeams.get(event.user.userId) ?? 1;
      return [
        {
          type: "triggerGift",
          giftId,
          fromUser: event.user.username,
          sourceTeam,
          targetTeam: opposingTeam(sourceTeam),
        },
      ];
    }
    case "like": {
      return [
        {
          type: "like",
          fromUser: event.user.username,
          count: event.likeCount,
          team: event.teamHint ?? userTeams.get(event.user.userId),
        },
      ];
    }
    case "follow": {
      const team = event.teamHint ?? userTeams.get(event.user.userId) ?? 1;
      userTeams.set(event.user.userId, team);
      return [
        {
          type: "follow",
          username: event.user.username,
          team,
        },
      ];
    }
    case "connected":
    case "disconnected":
      return [];
  }
}

export function resetTikTokUserTeams() {
  userTeams.clear();
}
