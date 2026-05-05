import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface PublicSport {
  id: string;
  name: string;
  isActive: boolean;
  isLive: boolean;
  sort_order?: number;
}

const fetchSportsList = async (): Promise<PublicSport[]> => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/sports/sports-list`,
  );
  const raw: any[] = res.data?.data ?? [];
  return raw.map((s) => ({
    id: String(s.id ?? s.eventType ?? ""),
    name: s.name ?? s.title ?? s.displayName ?? "Unknown Sport",
    isActive: s.isActive ?? s.is_active ?? true,
    // Default to live=true so older payloads (pre-migration) keep working.
    isLive: s.isLive ?? s.is_live ?? true,
    sort_order: s.sort_order,
  }));
};

export const SPORTS_LIST_QUERY_KEY = ["public-sports-list"] as const;

export const useSportsList = () =>
  useQuery({
    queryKey: SPORTS_LIST_QUERY_KEY,
    queryFn: fetchSportsList,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

export const findSportLiveStatus = (
  sports: PublicSport[] | undefined,
  eventTypeId: string | number,
): boolean | undefined => {
  if (!sports) return undefined;
  const match = sports.find((s) => s.id === String(eventTypeId));
  return match?.isLive;
};
