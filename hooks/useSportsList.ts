import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import axios from "axios";
import { getSportDisplayName } from "@/lib/sports-config";
import { useChannelWatcher } from "./useChannelWatcher";

export interface PublicSport {
  id: string;
  name: string;
  isActive: boolean;
  isLive: boolean;
  isHighlight: boolean;
  sort_order?: number;
}

const fetchSportsList = async (): Promise<PublicSport[]> => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/sports/sports-list`,
  );
  const raw: any[] = res.data?.data ?? [];
  return raw.map((s) => {
    const id = String(s.id ?? s.eventType ?? "");
    return {
      id,
      name: getSportDisplayName(
        id,
        s.name ?? s.title ?? s.displayName ?? "Unknown Sport",
      ),
      isActive: s.isActive ?? s.is_active ?? true,
      // Default to live=true so older payloads (pre-migration) keep working.
      isLive: s.isLive ?? s.is_live ?? true,
      // Default to false so un-highlighted sports render as normal tabs.
      isHighlight: s.isHighlight ?? s.is_highlight ?? false,
      sort_order: s.sort_order,
    };
  });
};

export const SPORTS_LIST_QUERY_KEY = ["public-sports-list"] as const;

export const useSportsList = () =>
  useQuery({
    queryKey: SPORTS_LIST_QUERY_KEY,
    queryFn: fetchSportsList,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

/**
 * Same as useSportsList but live: refetches the shared list whenever the owner
 * toggles a sport (active / live / highlight / order) on the admin panel — the
 * backend broadcasts on the "sports-list" channel. Use this for themed navbars
 * and sidebars so they stay in sync with the owner panel without a reload,
 * exactly like the Default theme's header already does.
 */
export const useLiveSportsList = () => {
  const queryClient = useQueryClient();
  const query = useSportsList();
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SPORTS_LIST_QUERY_KEY });
  }, [queryClient]);
  useChannelWatcher("sports-list", invalidate);
  return query;
};

export const findSportLiveStatus = (
  sports: PublicSport[] | undefined,
  eventTypeId: string | number,
): boolean | undefined => {
  if (!sports) return undefined;
  const match = sports.find((s) => s.id === String(eventTypeId));
  return match?.isLive;
};
