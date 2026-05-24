import type { TikTokLiveAdapter } from "./adapter";
import type { TikTokLiveEvent } from "./types";

export class RealTikTokLiveAdapter implements TikTokLiveAdapter {
  mode = "real" as const;

  private listeners = new Set<(event: TikTokLiveEvent) => void>();

  private reconnectAttempts = 0;

  private disconnected = false;

  constructor(private username: string) {}

  async connect() {
    this.disconnected = false;
    this.emit({
      type: "disconnected",
      username: this.username,
      reason:
        "Real TikTok connector placeholder active. Wire TikTokLiveConnector here or run it inside the future Socket.io relay.",
      reconnecting: false,
    });

    /*
      Production wiring point for TikTokLiveConnector:

      const { TikTokLiveConnection } = await import("tiktok-live-connector");
      const connection = new TikTokLiveConnection(this.username);

      connection.on("chat", (data) => this.emit({
        type: "comment",
        user: normalizeUser(data),
        comment: data.comment,
      }));
      connection.on("gift", (data) => this.emit({
        type: "gift",
        user: normalizeUser(data),
        giftName: data.giftName,
        giftId: data.giftId ? String(data.giftId) : undefined,
        repeatCount: data.repeatCount ?? 1,
        diamondCount: data.diamondCount,
      }));
      connection.on("like", (data) => this.emit({
        type: "like",
        user: normalizeUser(data),
        likeCount: data.likeCount ?? 1,
        totalLikeCount: data.totalLikeCount,
      }));
      connection.on("follow", (data) => this.emit({
        type: "follow",
        user: normalizeUser(data),
      }));
      connection.on("connected", () => {
        this.reconnectAttempts = 0;
        this.emit({ type: "connected", username: this.username });
      });
      connection.on("disconnected", () => this.scheduleReconnect());
      connection.on("error", () => this.scheduleReconnect());
      await connection.connect();

      Recommended production topology:
      1. Run the connector inside a Node realtime relay if the package needs
         server-only credentials, proxies, or signing.
      2. Relay normalized TikTokLiveEvent payloads to /live through Socket.io.
      3. Keep NEXT_PUBLIC_TIKTOK_USERNAME as display/config only.
      4. Never place cookies, tokens, or signing secrets in browser env vars.
    */
  }

  async disconnect() {
    this.disconnected = true;
    this.emit({ type: "disconnected", username: this.username, reason: "real connector disconnected" });
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

  private scheduleReconnect() {
    if (this.disconnected) {
      return;
    }

    this.reconnectAttempts += 1;
    const delayMs = Math.min(30_000, 1000 * 2 ** Math.min(5, this.reconnectAttempts));
    this.emit({
      type: "disconnected",
      username: this.username,
      reason: `Connector disconnected. Reconnect attempt ${this.reconnectAttempts} in ${Math.round(delayMs / 1000)}s.`,
      reconnecting: true,
    });
  }
}
