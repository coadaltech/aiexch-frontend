"use client";

import { useEffect } from "react";

// ─── Shared /ws/markets channel-bus singleton ──────────────────────────────
// A single WebSocket connection per browser tab. Each consumer subscribes to
// a named channel ("top-competitions", "recommended-events", "sports-list"),
// and the backend broadcasts `{ type: "<channel>-changed" }` on mutations.
// Multiple consumers share one connection via ref-counting and a local
// EventTarget bus.

type Channel =
  | "sports-list"
  | "top-competitions"
  | "recommended-events"
  | "pinned-events"
  | "pinned-competitions"
  // User-balance change. The payload carries `userId` so subscribers can
  // ignore changes not meant for them (channel is global, filter is client-
  // side — fan-out is tiny so this is fine).
  | "ledger"
  // Single-device session enforcement. Subscribing keeps the socket alive
  // while logged in; the server pushes `{ type: "force-logout", userId,
  // sessionToken }` here when the account logs in elsewhere.
  | "session"
  // Per-user targeted alerts (e.g. "your bet was deleted"). The server pushes
  // `{ type: "user-notifications-changed", userId, notification }`; the header
  // bell filters by its own userId.
  | "user-notifications";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const bus = new EventTarget();
const subscriptionCounts = new Map<Channel, number>();

const getWebSocketUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return apiUrl.replace(/^http/, "ws") + "/ws/markets";
};

const sendIfOpen = (msg: any) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    /* ignore */
  }
};

const subscribeServer = (channel: Channel) => {
  sendIfOpen({ action: "subscribe-channel", channel });
};

const connect = () => {
  if (typeof window === "undefined") return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const socket = new WebSocket(getWebSocketUrl());
  ws = socket;

  socket.onopen = () => {
    // Re-subscribe to every channel that has at least one listener
    for (const [channel, count] of subscriptionCounts) {
      if (count > 0) subscribeServer(channel);
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.type === "force-logout") {
        // Immediate single-device kick. Fan out on the bus; useSessionWatcher
        // does the userId/sessionToken filtering before logging the user out.
        bus.dispatchEvent(new CustomEvent("force-logout", { detail: data }));
        return;
      }
      if (typeof data?.type === "string" && data.type.endsWith("-changed")) {
        // CustomEvent so payload (e.g. { userId } on ledger-changed) can
        // reach subscribers via detail; existing handlers that ignore the
        // arg continue to work unchanged.
        bus.dispatchEvent(new CustomEvent(data.type, { detail: data }));
      }
    } catch {
      /* unrelated message */
    }
  };

  socket.onerror = () => {
    try { socket.close(); } catch { /* ignore */ }
  };

  socket.onclose = () => {
    if (ws === socket) ws = null;
    // Only reconnect while someone is still listening
    const anyActive = Array.from(subscriptionCounts.values()).some((n) => n > 0);
    if (!anyActive) return;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 3000);
  };
};

const disconnectIfIdle = () => {
  const anyActive = Array.from(subscriptionCounts.values()).some((n) => n > 0);
  if (anyActive) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    try { ws.close(); } catch { /* ignore */ }
    ws = null;
  }
};

/**
 * Subscribe to a backend broadcast channel. `onChange` is invoked each time
 * the server emits `{ type: "<channel>-changed", ... }` for this channel.
 *
 * The full message (including any payload fields like `userId`) is passed
 * as the argument so handlers can filter — e.g. `if (msg.userId !== mine) return`.
 */
export function useChannelWatcher<T extends Record<string, unknown> = Record<string, unknown>>(
  channel: Channel,
  onChange: (payload: T) => void,
) {
  useEffect(() => {
    const prev = subscriptionCounts.get(channel) ?? 0;
    subscriptionCounts.set(channel, prev + 1);
    connect();
    // If the socket is already open when this consumer mounts, tell the
    // server about the channel (re-sub on reconnect is handled in onopen).
    if (prev === 0) subscribeServer(channel);

    const evt = `${channel}-changed`;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<T>).detail ?? ({} as T);
      onChange(detail);
    };
    bus.addEventListener(evt, handler);

    return () => {
      bus.removeEventListener(evt, handler);
      const next = (subscriptionCounts.get(channel) ?? 1) - 1;
      subscriptionCounts.set(channel, Math.max(0, next));
      if (next <= 0) {
        sendIfOpen({ action: "unsubscribe-channel", channel });
      }
      disconnectIfIdle();
    };
  }, [channel, onChange]);
}

/**
 * Keeps the shared socket connected while the user is logged in and listens for
 * the backend's single-device `force-logout` push. When the account logs in on
 * another device the server broadcasts `{ userId, sessionToken }`; this device
 * logs out immediately if the broadcast targets it (`userId` matches) but
 * carries a different session token (i.e. a newer login than its own).
 *
 * @param enabled         only watch while logged in (skip for demo/guest)
 * @param userId          this device's logged-in user id
 * @param sessionToken    this device's own session token (so it ignores its own login)
 * @param onForceLogout   invoked once when this device should be kicked
 */
export function useSessionWatcher(
  enabled: boolean,
  userId: string | undefined,
  sessionToken: string | undefined,
  onForceLogout: () => void,
) {
  useEffect(() => {
    if (!enabled || !userId) return;

    const channel: Channel = "session";
    const prev = subscriptionCounts.get(channel) ?? 0;
    subscriptionCounts.set(channel, prev + 1);
    connect();
    if (prev === 0) subscribeServer(channel);

    const handler = (e: Event) => {
      const msg = (e as CustomEvent<{ userId?: string; sessionToken?: string }>).detail ?? {};
      if (msg.userId !== userId) return; // someone else's login — ignore
      // A force-logout that carries *our own* session token is our own login
      // echoed back; only react when the token differs (a newer session).
      if (sessionToken && msg.sessionToken === sessionToken) return;
      onForceLogout();
    };
    bus.addEventListener("force-logout", handler);

    return () => {
      bus.removeEventListener("force-logout", handler);
      const next = (subscriptionCounts.get(channel) ?? 1) - 1;
      subscriptionCounts.set(channel, Math.max(0, next));
      if (next <= 0) sendIfOpen({ action: "unsubscribe-channel", channel });
      disconnectIfIdle();
    };
  }, [enabled, userId, sessionToken, onForceLogout]);
}
