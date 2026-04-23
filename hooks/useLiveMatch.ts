"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const getWebSocketUrl = () => {
  if (typeof window === "undefined") return "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return `${wsUrl}/ws/markets`;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// If the tab was hidden / network was offline and the last live update is older
// than this when we regain visibility, force a fresh reconnect immediately
// rather than waiting for the next backoff tick.
const VISIBILITY_RECONNECT_THRESHOLD_MS = 5_000;

export function useLiveMatch(eventId: string, eventTypeId: string) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [matchOdds, setMatchOdds] = useState<any[]>([]);
  const [bookmakers, setBookmakers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [score, setScore] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);
  const lastUpdateRef = useRef<number | null>(null);
  useEffect(() => {
    lastUpdateRef.current = lastUpdate;
  }, [lastUpdate]);

  const connect = useCallback(() => {
    if (!eventId || !eventTypeId) return;
    if (typeof window === "undefined") return;

    const url = getWebSocketUrl();
    if (!url) return;

    // Clean up existing socket
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
      ws.send(JSON.stringify({ action: "subscribe", eventId, eventTypeId }));
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const data = JSON.parse(event.data);

        if (data.type === "live-update" && data.eventId === eventId) {
          // Always set state directly — this is live data, it should always
          // reflect the latest server state. React 19 batches all these
          // setState calls into a single re-render. React's own virtual DOM
          // diffing handles skipping unchanged DOM nodes efficiently.
          //
          // Doing JSON.stringify comparison on deeply nested market data
          // 3x/second is more expensive than just letting React re-render.
          setMatchOdds(data.matchOdds || []);
          setBookmakers(data.bookmakers || []);
          setSessions(data.sessions || []);
          setScore(data.score || null);
          setLastUpdate(data.timestamp || Date.now());
        }
        else if (data.type === "market-update" && data.eventId === eventId) {
          setMatchOdds(data.markets || []);
          setLastUpdate(data.timestamp || Date.now());
        }
      } catch (err) {
        console.error("[WS] Parse error:", err);
      }
    };

    ws.onerror = () => {
      if (!isMounted.current || wsRef.current !== ws) return;
      setStatus("error");
    };

    ws.onclose = () => {
      if (!isMounted.current || wsRef.current !== ws) return;
      setStatus("disconnected");

      // Auto-reconnect with exponential backoff, capped at 30s, retrying
      // indefinitely. Previous code stopped after 10 attempts (~17 min total),
      // which left tabs that had been backgrounded for a long time stuck on
      // stale data forever — even after the user came back to the tab.
      const delay = Math.min(30_000, 1000 * Math.pow(2, reconnectAttempts.current));
      reconnectAttempts.current++;
      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect();
      }, delay);
    };
  }, [eventId, eventTypeId]);

  // Manually force an immediate reconnect (used by visibility/online handlers).
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

    if (!eventId || !eventTypeId) return;

    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ action: "unsubscribe", eventId }));
        } catch {}
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [eventId, eventTypeId, connect]);

  // When the tab regains visibility or the network comes back, force a fresh
  // reconnect. Browsers commonly close WebSockets when the laptop sleeps or
  // the tab is backgrounded for a long time; without this the user sees stale
  // data (and could place bets against markets that have already closed).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!eventId || !eventTypeId) return;

    const wakeIfStale = () => {
      const last = lastUpdateRef.current;
      const stale = last == null || Date.now() - last > VISIBILITY_RECONNECT_THRESHOLD_MS;
      if (stale) forceReconnect();
    };

    const onVisibility = () => {
      if (typeof document === "undefined") return;
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
  }, [eventId, eventTypeId, forceReconnect]);

  return {
    status,
    isConnected: status === "connected",
    matchOdds,
    bookmakers,
    sessions,
    score,
    lastUpdate,
    forceReconnect,
  };
}
