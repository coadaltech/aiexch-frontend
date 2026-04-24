"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const getWebSocketUrl = () => {
  if (typeof window === "undefined") return "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return `${wsUrl}/ws/markets`;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface MultimarketItem {
  eventId: string;
  marketId: string;
}

const VISIBILITY_RECONNECT_THRESHOLD_MS = 5_000;

/**
 * Subscribe to live odds for a set of markets pinned across multiple events.
 * The backend pushes one `multimarket-update` message per event per tick; we
 * merge them into a single map keyed by marketId.
 */
export function useLiveMultimarket(items: MultimarketItem[], eventTypeId = "4") {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [oddsByMarketId, setOddsByMarketId] = useState<Record<string, any>>({});
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);
  const lastUpdateRef = useRef<number | null>(null);
  useEffect(() => {
    lastUpdateRef.current = lastUpdate;
  }, [lastUpdate]);

  // Stable string key so re-renders with the same items don't reconnect.
  const itemsKey = items
    .map((i) => `${i.eventId}:${i.marketId}`)
    .sort()
    .join(",");

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!itemsKey) return;

    const url = getWebSocketUrl();
    if (!url) return;

    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    setStatus("connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current || wsRef.current !== ws) return;
      setStatus("connected");
      reconnectAttempts.current = 0;
      ws.send(
        JSON.stringify({
          action: "subscribe-multimarket",
          items,
          eventTypeId,
        }),
      );
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "multimarket-update") return;
        const incoming: any[] = Array.isArray(data.matchOdds) ? data.matchOdds : [];
        setOddsByMarketId((prev) => {
          const next = { ...prev };
          for (const m of incoming) {
            if (m?.marketId) next[m.marketId] = m;
          }
          return next;
        });
        setLastUpdate(data.timestamp || Date.now());
      } catch (err) {
        console.error("[WS multimarket] Parse error:", err);
      }
    };

    ws.onerror = () => {
      if (!isMounted.current || wsRef.current !== ws) return;
      setStatus("error");
    };

    ws.onclose = () => {
      if (!isMounted.current || wsRef.current !== ws) return;
      setStatus("disconnected");
      const delay = Math.min(30_000, 1000 * Math.pow(2, reconnectAttempts.current));
      reconnectAttempts.current++;
      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect();
      }, delay);
    };
    // items intentionally captured via itemsKey dep below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, eventTypeId]);

  const forceReconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    isMounted.current = true;
    if (!itemsKey) return;

    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ action: "unsubscribe-multimarket" }));
        } catch {}
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [itemsKey, connect]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!itemsKey) return;

    const wakeIfStale = () => {
      const last = lastUpdateRef.current;
      const stale = last == null || Date.now() - last > VISIBILITY_RECONNECT_THRESHOLD_MS;
      if (stale) forceReconnect();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") wakeIfStale();
    };
    const onOnline = () => forceReconnect();
    const onFocus = () => wakeIfStale();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
    };
  }, [itemsKey, forceReconnect]);

  return {
    status,
    isConnected: status === "connected",
    oddsByMarketId,
    lastUpdate,
    forceReconnect,
  };
}
