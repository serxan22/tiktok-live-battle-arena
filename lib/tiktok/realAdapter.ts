import type { TikTokLiveAdapter } from "./adapter";
import type { TikTokLiveEvent } from "./types";

export class RealTikTokLiveAdapter implements TikTokLiveAdapter {
  mode = "real" as const;

  private listeners = new Set<(event: TikTokLiveEvent) => void>();

  constructor(private username: string) {}

  async connect() {
    this.emit({
      type: "disconnected",
      username: this.username,
      reason:
        "Real TikTok connector placeholder active. Install a TikTokLiveConnector package and wire it in lib/tiktok/realAdapter.ts.",
    });

    /*
      Production wiring point:

      const { TikTokLiveConnection } = await import("tiktok-live-connector");
      const connection = new TikTokLiveConnection(this.username);
      connection.on("chat", (data) => this.emit({ type: "comment", ... }));
      connection.on("gift", (data) => this.emit({ type: "gift", ... }));
      connection.on("like", (data) => this.emit({ type: "like", ... }));
      connection.on("follow", (data) => this.emit({ type: "follow", ... }));
      await connection.connect();

      Keep credentials and signing services on the server side. Do not expose secrets
      through NEXT_PUBLIC_* variables.
    */
  }

  async disconnect() {
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
}
