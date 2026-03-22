"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const getWebSocketUrl = () => {
  if (typeof window === "undefined") return "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return `${wsUrl}/ws/markets`;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

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

      // Auto-reconnect with exponential backoff
      if (reconnectAttempts.current < 10) {
        const delay = 1000 * Math.pow(2, reconnectAttempts.current);
        reconnectAttempts.current++;
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) connect();
        }, delay);
      }
    };
  }, [eventId, eventTypeId]);

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

  return {
    status,
    isConnected: status === "connected",
    matchOdds,
    bookmakers,
    sessions,
    score,
    lastUpdate,
  };
}
