"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChannelWatcher } from "./useChannelWatcher";

/**
 * Keeps the user-facing sports lists in sync with owner edits in real time.
 *
 * When an owner toggles a competition or event active, the backend regenerates
 * the notepad (DB = source of truth) and broadcasts `series-changed` with the
 * affected `eventTypeId`. We invalidate that sport's React Query caches so the
 * sidebar series, homepage matches list, and racing list refetch instantly —
 * no manual refresh. (sports-list / pinned / top / recommended have their own
 * watchers already.)
 *
 * Mount once, app-wide (in MainLayout), alongside useLedgerLiveSync.
 */
export function useSportsLiveSync() {
  const queryClient = useQueryClient();

  const onSeriesChange = useCallback(
    (payload: { eventTypeId?: number | string }) => {
      const et =
        payload?.eventTypeId != null ? String(payload.eventTypeId) : undefined;
      if (et) {
        queryClient.invalidateQueries({ queryKey: ["series", et] });
        queryClient.invalidateQueries({ queryKey: ["matches-list", et] });
        queryClient.invalidateQueries({ queryKey: ["racing", et] });
      } else {
        // No id in payload — refetch all sports lists to be safe.
        queryClient.invalidateQueries({ queryKey: ["series"] });
        queryClient.invalidateQueries({ queryKey: ["matches-list"] });
        queryClient.invalidateQueries({ queryKey: ["racing"] });
      }
    },
    [queryClient],
  );

  useChannelWatcher("series-changed", onSeriesChange);
}
