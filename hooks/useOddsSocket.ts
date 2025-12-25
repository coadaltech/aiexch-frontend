import { useEffect, useMemo } from "react";

export type OddsUpdatePayload = {
  type: "odds:update";
  eventTypeId: string;
  marketIds: string[];
  markets: any[];
};

interface UseOddsSocketProps {
  eventTypeId: string;
  marketIds: string[];
  enabled?: boolean;
  onOdds?: (payload: OddsUpdatePayload) => void;
}

const buildWsUrl = () => {
  const base =
    process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "";
  if (!base) return null;
  const normalizedBase = base.replace(/\/$/, "");
  return normalizedBase.replace(/^http/, "ws") + "/sports/odds-stream";
};

export function useOddsWebSocket({
  eventTypeId,
  marketIds,
  enabled = true,
  onOdds,
}: UseOddsSocketProps) {
  const normalizedIds = useMemo(() => {
    if (!Array.isArray(marketIds)) return [];
    const filtered = marketIds
      .map((id) => (typeof id === "string" ? id.trim() : String(id ?? "")))
      .filter(Boolean);
    return Array.from(new Set(filtered)).sort();
  }, [marketIds]);

  const idsKey = normalizedIds.join(",");

  useEffect(() => {
    if (!enabled || !eventTypeId || !idsKey) return;
    const wsUrl = buildWsUrl();
    if (!wsUrl) {
      console.warn(
        "[useOddsWebSocket] Missing NEXT_PUBLIC_WS_URL or NEXT_PUBLIC_API_URL"
      );
      return;
    }

    const ws = new WebSocket(wsUrl);
    const subscriptionIds = idsKey.split(",").filter(Boolean);
    if (!subscriptionIds.length) {
      ws.close();
      return;
    }
    const payload = {
      action: "subscribe",
      eventTypeId,
      marketIds: subscriptionIds,
    };

    ws.onopen = () => {
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "odds:update") {
          onOdds?.(data as OddsUpdatePayload);
        }
      } catch (error) {
        console.error("[useOddsWebSocket] Failed to parse message", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[useOddsWebSocket] WebSocket error", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                action: "unsubscribe",
                eventTypeId,
                marketIds: subscriptionIds,
              })
            );
          }
        } catch (error) {
          console.error("[useOddsWebSocket] Failed to unsubscribe", error);
        }
        ws.close();
      }
    };
  }, [enabled, eventTypeId, idsKey, onOdds]);
}

