import type { RealtimeMessage } from "./socketTypes";

type MessageListener = (message: RealtimeMessage) => void;
type OutgoingRealtimeMessage =
  | Omit<Extract<RealtimeMessage, { kind: "command" }>, "senderId" | "sentAt">
  | Omit<Extract<RealtimeMessage, { kind: "snapshot" }>, "senderId" | "sentAt">;

const STORAGE_PREFIX = "battle_arena_message";

function randomSenderId() {
  return `client_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export class LocalBroadcastTransport {
  readonly senderId = randomSenderId();

  private channel?: BroadcastChannel;

  private listeners = new Set<MessageListener>();

  private storageHandler?: (event: StorageEvent) => void;

  private customHandler?: (event: Event) => void;

  constructor(private channelName: string) {
    if (typeof window === "undefined") {
      return;
    }

    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (event: MessageEvent<RealtimeMessage>) => {
        this.emit(event.data);
      };
      return;
    }

    this.storageHandler = (event: StorageEvent) => {
      if (!event.key?.startsWith(STORAGE_PREFIX) || !event.newValue) {
        return;
      }

      try {
        this.emit(JSON.parse(event.newValue) as RealtimeMessage);
      } catch {
        // Ignore malformed cross-tab payloads.
      }
    };

    this.customHandler = (event: Event) => {
      const detail = (event as CustomEvent<RealtimeMessage>).detail;
      if (detail) {
        this.emit(detail);
      }
    };

    window.addEventListener("storage", this.storageHandler);
    window.addEventListener(this.channelName, this.customHandler);
  }

  post(message: OutgoingRealtimeMessage) {
    const payload = {
      ...message,
      senderId: this.senderId,
      sentAt: Date.now(),
    } as RealtimeMessage;

    this.emit(payload);

    if (this.channel) {
      this.channel.postMessage(payload);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(this.channelName, { detail: payload }));
    try {
      const key = `${STORAGE_PREFIX}:${this.channelName}:${Date.now()}:${Math.random()}`;
      window.localStorage.setItem(key, JSON.stringify(payload));
      window.localStorage.removeItem(key);
    } catch {
      // localStorage can be unavailable in some embedded browser contexts.
    }
  }

  subscribe(listener: MessageListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.channel?.close();
    if (typeof window !== "undefined" && this.storageHandler) {
      window.removeEventListener("storage", this.storageHandler);
    }
    if (typeof window !== "undefined" && this.customHandler) {
      window.removeEventListener(this.channelName, this.customHandler);
    }
    this.listeners.clear();
  }

  private emit(message: RealtimeMessage) {
    if (message.senderId === this.senderId) {
      return;
    }

    for (const listener of this.listeners) {
      listener(message);
    }
  }
}
