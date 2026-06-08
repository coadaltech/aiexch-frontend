"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useChannelWatcher } from "@/hooks/useChannelWatcher";

/**
 * Keeps the `["ledger"]` (BAL/EXP) cache live from the `ledger` WebSocket.
 *
 * MUST be mounted somewhere that never unmounts across route changes — i.e.
 * MainLayout — NOT inside Header/CasinoWallet. Header is removed on casino
 * routes and the sidebar's channels drop there too, so if the subscription
 * lived in those components the shared /ws/markets socket would churn (close →
 * reopen → re-subscribe) exactly when you open a casino game, and the
 * balance/exposure push that arrives during that gap would be lost — which is
 * what made BAL/EXP look like it lagged 5-10s on casino routes.
 *
 * Owning it here means one continuous subscription for the whole session, so
 * the backend's post-bet broadcast repaints BAL/EXP the instant it arrives,
 * with no polling.
 */
export function useLedgerLiveSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const myUserId = user?.id;

  const onLedgerChange = useCallback(
    (payload: {
      userId?: string;
      ledger?: {
        userId: string;
        userBalance: string;
        userLimit: string;
        limitConsumed: string;
        fixLimit: string;
        finalLimit: string;
      };
    }) => {
      if (!myUserId || payload?.userId !== myUserId) return;
      if (payload.ledger) {
        // Populate the cache directly from the snapshot the backend computed
        // post-commit — repaints in the same tick the WS message arrives, no
        // HTTP round-trip. Shape matches useLedger's queryFn (.data.data).
        queryClient.setQueryData(["ledger"], { data: { data: payload.ledger } });
      } else {
        queryClient.invalidateQueries({ queryKey: ["ledger"] });
      }
      // /balance isn't in the snapshot — refresh it too.
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
    [myUserId, queryClient],
  );

  useChannelWatcher("ledger", onLedgerChange);
}
