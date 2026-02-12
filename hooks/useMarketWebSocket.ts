import { create } from "zustand";
import { useEffect, useRef } from "react";

// Build WebSocket URL from API URL
const getWebSocketUrl = () => {
  if (typeof window === "undefined") return "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return `${wsUrl}/ws/markets`;
};

type MarketData = {
  markets: any[];
  timestamp: number;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface MarketWebSocketState {
  // Connection state
  status: ConnectionStatus;
  socket: WebSocket | null;

  // Per-event market data: eventId -> market data
  marketsByEvent: Record<string, MarketData>;

  // Track which eventIds are subscribed (with ref counts)
  subscriptionCounts: Record<string, number>;

  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribe: (eventId: string) => void;
  unsubscribe: (eventId: string) => void;
  getMarkets: (eventId: string) => any[];
}

let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY = 1000;

// Track if disconnect was intentional (to suppress error logs)
let intentionalClose = false;

export const useMarketWebSocketStore = create<MarketWebSocketState>(
  (set, get) => ({
    status: "disconnected",
    socket: null,
    marketsByEvent: {},
    subscriptionCounts: {},

    connect: () => {
      const { socket, status } = get();

      // Don't connect if already connected or connecting
      if (socket && (status === "connected" || status === "connecting")) {
        return;
      }

      // Don't connect during SSR
      if (typeof window === "undefined") return;

      // Clean up existing socket
      if (socket) {
        try {
          intentionalClose = true;
          socket.close();
        } catch {}
      }

      intentionalClose = false;
      set({ status: "connecting" });

      const url = getWebSocketUrl();
      if (!url) return;

      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          reconnectAttempts = 0;
          set({ status: "connected", socket: ws });

          // Re-subscribe to all active subscriptions
          const { subscriptionCounts } = get();
          for (const eventId of Object.keys(subscriptionCounts)) {
            if (subscriptionCounts[eventId] > 0) {
              ws.send(
                JSON.stringify({
                  type: "subscribe-markets",
                  eventId,
                })
              );
            }
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "market-update" && data.eventId) {
              set((state) => ({
                marketsByEvent: {
                  ...state.marketsByEvent,
                  [data.eventId]: {
                    markets: data.markets,
                    timestamp: data.timestamp || Date.now(),
                  },
                },
              }));
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = () => {
          // Only log if this wasn't an intentional close / page navigation
          if (!intentionalClose) {
            console.warn("WebSocket connection error — will retry");
          }
          // Don't set error status if we intentionally closed
          if (!intentionalClose) {
            set({ status: "error" });
          }
        };

        ws.onclose = (event) => {
          // code 1000 = normal close, 1001 = going away (page navigation)
          const isNormalClose =
            intentionalClose ||
            event.code === 1000 ||
            event.code === 1001;

          if (!isNormalClose) {
            console.log(
              `🔌 WebSocket disconnected (code: ${event.code})`
            );
          }

          set({ status: "disconnected", socket: null });

          // Only auto-reconnect on unexpected disconnects
          if (!intentionalClose) {
            const { subscriptionCounts } = get();
            const hasActiveSubscriptions = Object.values(
              subscriptionCounts
            ).some((count) => count > 0);

            if (
              hasActiveSubscriptions &&
              reconnectAttempts < MAX_RECONNECT_ATTEMPTS
            ) {
              const delay =
                RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts);
              reconnectAttempts++;
              console.log(
                `🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`
              );
              reconnectTimeout = setTimeout(() => {
                get().connect();
              }, delay);
            }
          }
        };

        set({ socket: ws });
      } catch (error) {
        console.error("WebSocket connection error:", error);
        set({ status: "error" });
      }
    },

    disconnect: () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

      const { socket } = get();
      if (socket) {
        try {
          intentionalClose = true;
          socket.close(1000, "Client disconnecting");
        } catch {}
      }
      set({
        socket: null,
        status: "disconnected",
        marketsByEvent: {},
        subscriptionCounts: {},
      });
    },

    subscribe: (eventId: string) => {
      const { socket, status, subscriptionCounts } = get();
      const currentCount = subscriptionCounts[eventId] || 0;

      // Update ref count
      set({
        subscriptionCounts: {
          ...subscriptionCounts,
          [eventId]: currentCount + 1,
        },
      });

      // Only send subscribe message if this is the first subscriber for this event
      if (currentCount === 0 && socket && status === "connected") {
        socket.send(
          JSON.stringify({
            type: "subscribe-markets",
            eventId,
          })
        );
        console.log(`📡 Subscribed to event: ${eventId}`);
      }

      // If not connected, connect now
      if (status === "disconnected" || status === "error") {
        reconnectAttempts = 0;
        intentionalClose = false;
        get().connect();
      }
    },

    unsubscribe: (eventId: string) => {
      const { socket, status, subscriptionCounts, marketsByEvent } = get();
      const currentCount = subscriptionCounts[eventId] || 0;

      if (currentCount <= 0) return;

      const newCount = currentCount - 1;
      const newSubscriptionCounts = { ...subscriptionCounts };

      if (newCount <= 0) {
        // Last subscriber — send unsubscribe and clean up
        delete newSubscriptionCounts[eventId];

        if (socket && status === "connected") {
          try {
            socket.send(
              JSON.stringify({
                type: "unsubscribe-markets",
                eventId,
              })
            );
          } catch {
            // Socket may already be closing — that's fine
          }
          console.log(`📡 Unsubscribed from event: ${eventId}`);
        }

        // Clean up market data for this event
        const newMarketsByEvent = { ...marketsByEvent };
        delete newMarketsByEvent[eventId];

        set({
          subscriptionCounts: newSubscriptionCounts,
          marketsByEvent: newMarketsByEvent,
        });

        // If no more subscriptions, disconnect cleanly
        if (Object.keys(newSubscriptionCounts).length === 0) {
          get().disconnect();
        }
      } else {
        newSubscriptionCounts[eventId] = newCount;
        set({ subscriptionCounts: newSubscriptionCounts });
      }
    },

    getMarkets: (eventId: string) => {
      return get().marketsByEvent[eventId]?.markets || [];
    },
  })
);

/**
 * Hook to subscribe to market updates for a given eventId.
 * Manages subscribe/unsubscribe lifecycle automatically.
 */
export function useMarketWebSocket(eventId: string) {
  const status = useMarketWebSocketStore((s) => s.status);
  const marketData = useMarketWebSocketStore(
    (s) => s.marketsByEvent[eventId]
  );
  const subscribe = useMarketWebSocketStore((s) => s.subscribe);
  const unsubscribe = useMarketWebSocketStore((s) => s.unsubscribe);

  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!eventId) return;

    subscribe(eventId);
    subscribedRef.current = true;

    return () => {
      if (subscribedRef.current) {
        unsubscribe(eventId);
        subscribedRef.current = false;
      }
    };
  }, [eventId, subscribe, unsubscribe]);

  return {
    status,
    isConnected: status === "connected",
    markets: marketData?.markets || [],
    lastUpdate: marketData?.timestamp || null,
  };
}
