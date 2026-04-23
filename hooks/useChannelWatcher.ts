"use client";

import { useEffect } from "react";

// ─── Shared /ws/markets channel-bus singleton ──────────────────────────────
// A single WebSocket connection per browser tab. Each consumer subscribes to
// a named channel ("top-competitions", "recommended-events", "sports-list"),
// and the backend broadcasts `{ type: "<channel>-changed" }` on mutations.
// Multiple consumers share one connection via ref-counting and a local
// EventTarget bus.

type Channel = "sports-list" | "top-competitions" | "recommended-events";

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
      if (typeof data?.type === "string" && data.type.endsWith("-changed")) {
        bus.dispatchEvent(new Event(data.type));
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
 * the server emits `{ type: "<channel>-changed" }` for this channel.
 */
export function useChannelWatcher(channel: Channel, onChange: () => void) {
  useEffect(() => {
    const prev = subscriptionCounts.get(channel) ?? 0;
    subscriptionCounts.set(channel, prev + 1);
    connect();
    // If the socket is already open when this consumer mounts, tell the
    // server about the channel (re-sub on reconnect is handled in onopen).
    if (prev === 0) subscribeServer(channel);

    const evt = `${channel}-changed`;
    const handler = () => onChange();
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
