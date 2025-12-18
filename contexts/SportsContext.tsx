"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

type SubscriptionType =
  | "odds"
  | "bookmakers"
  | "sessions"
  | "score"
  | "premium"
  | "matchDetails"
  | "series";

interface SportsContextType {
  isConnected: boolean;
  subscribe: (
    type: SubscriptionType,
    subscription: {
      eventTypeId: string;
      marketIds?: string[];
      matchId?: string;
    },
    callback?: (data: any) => void
  ) => any;
  unsubscribe: (
    type: SubscriptionType,
    subscription: {
      eventTypeId: string;
      marketIds?: string[];
      matchId?: string;
    },
    callback?: (data: any) => void
  ) => void;
  getSubscriptionKey: (
    type: SubscriptionType,
    subscription: {
      eventTypeId: string;
      marketIds?: string[];
      matchId?: string;
    }
  ) => string;
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export function SportsProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const subscriptionsRef = useRef<Map<string, Set<(data: any) => void>>>(
    new Map()
  );
  const dataCacheRef = useRef<Map<string, any>>(new Map());
  const clientIdRef = useRef<string | null>(null);

  const getSubscriptionKey = useCallback(
    (
      type: SubscriptionType,
      subscription: {
        eventTypeId: string;
        marketIds?: string[];
        matchId?: string;
      }
    ): string => {
      if (type === "odds" || type === "bookmakers") {
        return `${type}:${subscription.eventTypeId}:${
          subscription.marketIds?.sort().join(",") || ""
        }`;
      }
      if (
        type === "sessions" ||
        type === "score" ||
        type === "premium" ||
        type === "matchDetails"
      ) {
        return `${type}:${subscription.eventTypeId}:${subscription.matchId}`;
      }
      if (type === "series") {
        return `${type}:${subscription.eventTypeId}`;
      }
      return `${type}:${subscription.eventTypeId}`;
    },
    []
  );

  const connect = useCallback(
    (shouldConnect: boolean) => {
      if (!shouldConnect) {
        // Disconnect if we shouldn't be connected
        if (wsRef.current) {
          console.log(
            "[SportsContext] Disconnecting WebSocket (not on sports page)"
          );
          wsRef.current.close();
          wsRef.current = null;
        }
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      // Get backend URL from environment or use default
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const wsProtocol = backendUrl.startsWith("https") ? "wss:" : "ws:";
      const wsHost = backendUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        (typeof window !== "undefined"
          ? `${wsProtocol}//${wsHost}/sports/ws`
          : "ws://localhost:3001/sports/ws");

      console.log("[SportsContext] Connecting to WebSocket:", wsUrl);

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("[SportsContext] ✅ WebSocket connected");
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;

          // Resubscribe to all existing subscriptions
          const subscriptionCount = subscriptionsRef.current.size;
          console.log(
            `[SportsContext] Resubscribing to ${subscriptionCount} existing subscription(s)`
          );

          subscriptionsRef.current.forEach((callbacks, subKey) => {
            const [type, ...parts] = subKey.split(":");
            const eventTypeId = parts[0];
            const rest = parts.slice(1).join(":");

            let subscription: any = { eventTypeId };
            if (type === "odds" || type === "bookmakers") {
              subscription.marketIds = rest ? rest.split(",") : [];
            } else if (
              type === "sessions" ||
              type === "score" ||
              type === "premium" ||
              type === "matchDetails"
            ) {
              subscription.matchId = rest;
            }

            const subscribeMessage = {
              action: "subscribe",
              type,
              ...subscription,
            };
            console.log(
              `[SportsContext] Resubscribing to ${subKey}:`,
              subscribeMessage
            );
            ws.send(JSON.stringify(subscribeMessage));
          });
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data, subscription } = message;

            // Ignore confirmation messages (subscribed/unsubscribed) - these are just confirmations, not data
            if (type === "subscribed" || type === "unsubscribed") {
              console.log(
                `[SportsContext] Received ${type} confirmation:`,
                subscription
              );
              return;
            }

            // Only process data update messages (series:update, odds:update, etc.)
            if (type && subscription && type.includes(":update")) {
              // Extract base type from "series:update" -> "series"
              const baseType = type.replace(/:update$/, "") as SubscriptionType;

              console.log("[SportsContext] Received data update:", {
                originalType: type,
                baseType,
                subscription,
                hasData: !!data,
                dataLength: Array.isArray(data) ? data.length : data ? 1 : 0,
              });

              const subKey = getSubscriptionKey(baseType, subscription);
              dataCacheRef.current.set(subKey, data);

              // Notify all callbacks for this subscription
              const callbacks = subscriptionsRef.current.get(subKey);
              if (callbacks) {
                console.log(
                  `[SportsContext] Notifying ${callbacks.size} callback(s) for ${subKey}`
                );
                callbacks.forEach((callback) => callback(data));
              } else {
                console.warn(
                  `[SportsContext] No callbacks found for subscription: ${subKey}`
                );
              }
            } else if (type && !type.includes(":update")) {
              // Log other message types for debugging (but don't process them)
              console.log("[SportsContext] Received non-update message:", {
                type,
                hasSubscription: !!subscription,
                hasData: !!data,
              });
            } else {
              console.warn(
                "[SportsContext] Message missing type or subscription:",
                {
                  hasType: !!type,
                  hasSubscription: !!subscription,
                  message,
                }
              );
            }
          } catch (error) {
            console.error(
              "[SportsContext] Error parsing WebSocket message:",
              error
            );
          }
        };

        ws.onerror = (error) => {
          console.error("[SportsContext] WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("[SportsContext] WebSocket disconnected");
          setIsConnected(false);
          wsRef.current = null;

          // Attempt to reconnect with exponential backoff
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          reconnectAttemptsRef.current++;

          console.log(
            `[SportsContext] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("[SportsContext] Failed to create WebSocket:", error);
        setIsConnected(false);
      }
    },
    [getSubscriptionKey]
  );

  const subscribe = useCallback(
    (
      type: SubscriptionType,
      subscription: {
        eventTypeId: string;
        marketIds?: string[];
        matchId?: string;
      },
      callback?: (data: any) => void
    ) => {
      const subKey = getSubscriptionKey(type, subscription);

      // Add subscription to map
      if (!subscriptionsRef.current.has(subKey)) {
        subscriptionsRef.current.set(subKey, new Set());
      }

      // Add callback if provided
      if (callback) {
        const callbacks = subscriptionsRef.current.get(subKey);
        if (callbacks) {
          callbacks.add(callback);
        }
      }

      // Send subscribe message if connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const subscribeMessage = {
          action: "subscribe",
          type,
          ...subscription,
        };
        console.log("[SportsContext] Sending subscribe:", subscribeMessage);
        wsRef.current.send(JSON.stringify(subscribeMessage));
      } else {
        console.warn(
          `[SportsContext] WebSocket not connected, cannot subscribe to ${subKey}`
        );
      }

      // Return cached data if available
      return dataCacheRef.current.get(subKey);
    },
    [getSubscriptionKey]
  );

  const unsubscribe = useCallback(
    (
      type: SubscriptionType,
      subscription: {
        eventTypeId: string;
        marketIds?: string[];
        matchId?: string;
      },
      callback?: (data: any) => void
    ) => {
      const subKey = getSubscriptionKey(type, subscription);

      // Remove callback if provided
      if (callback) {
        const callbacks = subscriptionsRef.current.get(subKey);
        if (callbacks) {
          callbacks.delete(callback);
          // If no more callbacks, send unsubscribe message
          if (callbacks.size === 0) {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  action: "unsubscribe",
                  type,
                  ...subscription,
                })
              );
            }
            subscriptionsRef.current.delete(subKey);
            dataCacheRef.current.delete(subKey);
          }
        }
      } else {
        // Remove all callbacks for this subscription
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              action: "unsubscribe",
              type,
              ...subscription,
            })
          );
        }
        subscriptionsRef.current.delete(subKey);
        dataCacheRef.current.delete(subKey);
      }
    },
    [getSubscriptionKey]
  );

  useEffect(() => {
    // Only connect if on sports page
    const isSportsPage =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/sports");
    connect(isSportsPage);

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Monitor route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const isSportsPage = window.location.pathname.startsWith("/sports");
      if (isSportsPage && !wsRef.current) {
        console.log("[SportsContext] Navigated to sports page, connecting...");
        connect(true);
      } else if (!isSportsPage && wsRef.current) {
        console.log(
          "[SportsContext] Navigated away from sports page, disconnecting..."
        );
        connect(false);
      }
    };

    // Listen for navigation events
    window.addEventListener("popstate", handleRouteChange);

    // For Next.js client-side navigation, we need to check periodically
    const interval = setInterval(handleRouteChange, 1000);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      clearInterval(interval);
    };
  }, [connect]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      subscriptionsRef.current.forEach((callbacks, subKey) => {
        const [type, ...parts] = subKey.split(":");
        const eventTypeId = parts[0];
        const rest = parts.slice(1).join(":");

        let subscription: any = { eventTypeId };
        if (type === "odds" || type === "bookmakers") {
          subscription.marketIds = rest ? rest.split(",") : [];
        } else if (
          type === "sessions" ||
          type === "score" ||
          type === "premium" ||
          type === "matchDetails"
        ) {
          subscription.matchId = rest;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              action: "unsubscribe",
              type,
              ...subscription,
            })
          );
        }
      });

      if (wsRef.current) {
        wsRef.current.close();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <SportsContext.Provider
      value={{
        isConnected,
        subscribe,
        unsubscribe,
        getSubscriptionKey,
      }}
    >
      {children}
    </SportsContext.Provider>
  );
}

export function useSportsContext() {
  const context = useContext(SportsContext);
  if (!context) {
    throw new Error("useSportsContext must be used within SportsProvider");
  }
  return context;
}

// Hook for series data
export function useSportsSeries(
  eventTypeId: string,
  enabled: boolean = true
): any[] {
  const { subscribe, unsubscribe, isConnected } = useSportsContext();
  const [data, setData] = useState<any[]>([]);
  const callbackRef = useRef<((data: any) => void) | null>(null);
  const subscribedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !eventTypeId) {
      if (subscribedRef.current) {
        // Unsubscribe from previous if eventTypeId changed
        const prevSubscription = { eventTypeId: subscribedRef.current };
        if (callbackRef.current) {
          unsubscribe("series", prevSubscription, callbackRef.current);
        }
        subscribedRef.current = null;
      }
      return;
    }

    // Wait for WebSocket connection before subscribing
    if (!isConnected) {
      console.log(`[useSportsSeries] WebSocket not connected yet, waiting...`);
      return;
    }

    // Prevent duplicate subscriptions for the same eventTypeId
    if (subscribedRef.current === eventTypeId) {
      console.log(
        `[useSportsSeries] Already subscribed to eventType: ${eventTypeId}, skipping`
      );
      return;
    }

    // Unsubscribe from previous eventTypeId if it changed
    if (subscribedRef.current && subscribedRef.current !== eventTypeId) {
      console.log(
        `[useSportsSeries] EventType changed from ${subscribedRef.current} to ${eventTypeId}, unsubscribing from previous`
      );
      const prevSubscription = { eventTypeId: subscribedRef.current };
      if (callbackRef.current) {
        unsubscribe("series", prevSubscription, callbackRef.current);
      }
    }

    console.log(
      `[useSportsSeries] Subscribing to series for eventType: ${eventTypeId}`
    );
    const subscription = { eventTypeId };

    // Create stable callback using ref
    const updateData = (newData: any) => {
      console.log(
        `[useSportsSeries] Received data update for eventType ${eventTypeId}:`,
        Array.isArray(newData) ? `${newData.length} items` : "non-array",
        newData
      );
      setData(Array.isArray(newData) ? newData : []);
    };
    callbackRef.current = updateData;
    subscribedRef.current = eventTypeId;

    // Subscribe and get initial cached data
    const cachedData = subscribe("series", subscription, updateData);
    if (cachedData) {
      console.log(
        `[useSportsSeries] Using cached data:`,
        Array.isArray(cachedData) ? `${cachedData.length} items` : "non-array"
      );
      updateData(cachedData);
    } else {
      console.log(`[useSportsSeries] No cached data available`);
    }

    return () => {
      console.log(
        `[useSportsSeries] Cleanup: Unsubscribing from series for eventType: ${eventTypeId}`
      );
      if (callbackRef.current && subscribedRef.current === eventTypeId) {
        unsubscribe("series", subscription, callbackRef.current);
        subscribedRef.current = null;
        callbackRef.current = null;
      }
    };
    // Only depend on eventTypeId and enabled - isConnected is handled inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypeId, enabled, isConnected]);

  return data;
}

// Hook for odds data
export function useSportsOdds(
  eventTypeId: string,
  marketIds: string[],
  enabled: boolean = true
): any[] {
  const { subscribe, unsubscribe } = useSportsContext();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled || !eventTypeId || !marketIds || marketIds.length === 0)
      return;

    const subscription = { eventTypeId, marketIds };
    const updateData = (newData: any) => {
      setData(Array.isArray(newData) ? newData : []);
    };

    const cachedData = subscribe("odds", subscription, updateData);
    if (cachedData) {
      updateData(cachedData);
    }

    return () => {
      unsubscribe("odds", subscription, updateData);
    };
  }, [eventTypeId, marketIds.join(","), enabled, subscribe, unsubscribe]);

  return data;
}

// Hook for bookmakers data
export function useSportsBookmakers(
  eventTypeId: string,
  marketIds: string[],
  enabled: boolean = true
): any[] {
  const { subscribe, unsubscribe } = useSportsContext();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled || !eventTypeId || !marketIds || marketIds.length === 0)
      return;

    const subscription = { eventTypeId, marketIds };
    const updateData = (newData: any) => {
      setData(Array.isArray(newData) ? newData : []);
    };

    const cachedData = subscribe("bookmakers", subscription, updateData);
    if (cachedData) {
      updateData(cachedData);
    }

    return () => {
      unsubscribe("bookmakers", subscription, updateData);
    };
  }, [eventTypeId, marketIds.join(","), enabled, subscribe, unsubscribe]);

  return data;
}

// Hook for sessions data
export function useSportsSessions(
  eventTypeId: string,
  matchId: string,
  enabled: boolean = true
): any[] {
  const { subscribe, unsubscribe } = useSportsContext();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled || !eventTypeId || !matchId) return;

    const subscription = { eventTypeId, matchId };
    const updateData = (newData: any) => {
      setData(Array.isArray(newData) ? newData : []);
    };

    const cachedData = subscribe("sessions", subscription, updateData);
    if (cachedData) {
      updateData(cachedData);
    }

    return () => {
      unsubscribe("sessions", subscription, updateData);
    };
  }, [eventTypeId, matchId, enabled, subscribe, unsubscribe]);

  return data;
}

// Hook for score data
export function useSportsScore(
  eventTypeId: string,
  matchId: string,
  enabled: boolean = true
): any {
  const { subscribe, unsubscribe } = useSportsContext();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!enabled || !eventTypeId || !matchId) return;

    const subscription = { eventTypeId, matchId };
    const updateData = (newData: any) => {
      setData(newData);
    };

    const cachedData = subscribe("score", subscription, updateData);
    if (cachedData) {
      updateData(cachedData);
    }

    return () => {
      unsubscribe("score", subscription, updateData);
    };
  }, [eventTypeId, matchId, enabled, subscribe, unsubscribe]);

  return data;
}

// Hook for premium data
export function useSportsPremium(
  eventTypeId: string,
  matchId: string,
  enabled: boolean = true
): any[] {
  const { subscribe, unsubscribe } = useSportsContext();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled || !eventTypeId || !matchId) return;

    const subscription = { eventTypeId, matchId };
    const updateData = (newData: any) => {
      setData(Array.isArray(newData) ? newData : []);
    };

    const cachedData = subscribe("premium", subscription, updateData);
    if (cachedData) {
      updateData(cachedData);
    }

    return () => {
      unsubscribe("premium", subscription, updateData);
    };
  }, [eventTypeId, matchId, enabled, subscribe, unsubscribe]);

  return data;
}

// Hook for match details
export function useSportsMatchDetails(
  eventTypeId: string,
  matchId: string,
  enabled: boolean = true
): any {
  const { subscribe, unsubscribe } = useSportsContext();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!enabled || !eventTypeId || !matchId) return;

    const subscription = { eventTypeId, matchId };
    const updateData = (newData: any) => {
      setData(newData);
    };

    const cachedData = subscribe("matchDetails", subscription, updateData);
    if (cachedData) {
      updateData(cachedData);
    }

    return () => {
      unsubscribe("matchDetails", subscription, updateData);
    };
  }, [eventTypeId, matchId, enabled, subscribe, unsubscribe]);

  return data;
}
