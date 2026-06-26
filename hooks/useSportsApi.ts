import { useQuery, useMutation } from "@tanstack/react-query";
import { sportsApi } from "@/lib/api";

// Sports list
export const useSports = () => {
  return useQuery({
    queryKey: ["sports"],
    queryFn: () => sportsApi.getSports(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Series with matches.
// `poll` (default true) keeps the list fresh on listing pages where matches
// go in/out of play. Pass `{ poll: false }` on pages that only need the static
// series/match names once (e.g. a single match page) so we don't background-
// poll the whole sport's catalogue while the user watches one match.
export const useSeries = (
  eventTypeId: string | null,
  enabled = true,
  opts: { poll?: boolean } = {},
) => {
  const { poll = true } = opts;
  return useQuery({
    queryKey: ["series", eventTypeId],
    queryFn: async () => {
      const res = await sportsApi.getSeries(eventTypeId!);
      return (res.data?.data ?? []) as any[];
    },
    enabled: enabled && !!eventTypeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: poll ? 5 * 60 * 1000 : false,
    placeholderData: (prev: any[] | undefined) => prev,
  });
};

// Flat matches list for a sport (with defaultMarketId per match).
// Odds are NOT included — stream them over the /ws/markets WebSocket.
// Backed by the SQL function fn_get_matches_with_default_markets.
export interface MatchListItem {
  id: string;
  name: string;
  openDate: string | null;
  status: string;
  inPlay: boolean;
  defaultMarketId: string;
  seriesId: string;
  seriesName: string;
  /** Current user's matched bet count on this match (0 if anonymous). */
  betCount: number;
}

export const useMatchesList = (eventTypeId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ["matches-list", eventTypeId],
    queryFn: async () => {
      const res = await sportsApi.getMatchesList(eventTypeId!);
      return (res.data?.data ?? []) as MatchListItem[];
    },
    enabled: enabled && !!eventTypeId,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Membership authority for the snapshot-seeded lists: refresh every 60s so a
    // newly in-play match appears (and a finished one drops) promptly, and the
    // per-user betCount stays current. Odds/instant paint come from the shared
    // snapshot + WS, so this stays a light, cacheable call.
    refetchInterval: 60 * 1000,
    placeholderData: (prev: MatchListItem[] | undefined) => prev,
  });
};

// Combined events + default-market odds snapshot for a sport, served from a
// shared server-side notepad file. The match list seeds events AND odds from
// this in a single fetch so the whole list paints at once (no one-by-one row
// reveal as odds stream in). Live odds still arrive over /ws/markets on top.
export interface MatchListSnapshotItem extends MatchListItem {
  /** The default market's current odds (runners[].back/lay are [{price,size}]). */
  market: any | null;
}

export const useMatchListSnapshot = (
  eventTypeId: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["matchlist-snapshot", eventTypeId],
    queryFn: async () => {
      const res = await sportsApi.getMatchListSnapshot(eventTypeId!);
      return (res.data?.data ?? []) as MatchListSnapshotItem[];
    },
    enabled: enabled && !!eventTypeId,
    // The file is a shared, cheap read and only seeds the initial paint +
    // membership (WS streams live odds afterwards). Refetch every 30s so new
    // in-play events appear and finished ones drop without per-user load.
    staleTime: 15 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 30 * 1000,
    placeholderData: (prev: MatchListSnapshotItem[] | undefined) => prev,
  });
};

// Racing meetings grouped by country -> venue (Horse 7 / Greyhound 4339).
export type RacingRace = {
  marketId: string;
  name: string;
  raceTime: string | null;
};
export type RacingMeeting = {
  eventId: number;
  name: string;
  venue: string | null;
  countryCode: string | null;
  timezone: string | null;
  openDate: string | null;
  marketCount: number;
  races: RacingRace[];
};
export type RacingCountry = { countryCode: string; meetings: RacingMeeting[] };

export const useRacing = (eventTypeId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ["racing", eventTypeId],
    queryFn: async () => {
      const res = await sportsApi.getRacing(eventTypeId!);
      return (res.data?.data ?? []) as RacingCountry[];
    },
    enabled: enabled && !!eventTypeId,
    // Racing is time-sensitive — the backend refreshes meetings/races every
    // minute, so poll at the same cadence to add new races and drop finished ones.
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 60 * 1000,
    placeholderData: (prev: RacingCountry[] | undefined) => prev,
  });
};

// Matches
export const useMatches = (
  eventTypeId: string,
  competitionId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["matches", eventTypeId, competitionId],
    queryFn: () => sportsApi.getMatches(eventTypeId, competitionId),
    enabled: enabled && !!eventTypeId && !!competitionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Markets
export const useMarkets = (
  eventTypeId: string,
  eventId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["markets", eventTypeId, eventId],
    queryFn: () => sportsApi.getMarkets(eventTypeId, eventId),
    enabled: enabled && !!eventTypeId && !!eventId,
    staleTime: 5 * 60 * 1000,
  });
};

// Results mutations
export const useOddsResults = () => {
  return useMutation({
    mutationFn: ({
      eventTypeId,
      marketIds,
    }: {
      eventTypeId: string;
      marketIds: string[];
    }) => sportsApi.getOddsResults(eventTypeId, marketIds),
  });
};

export const useBookmakersResults = () => {
  return useMutation({
    mutationFn: ({
      eventTypeId,
      marketIds,
    }: {
      eventTypeId: string;
      marketIds: string[];
    }) => sportsApi.getBookmakersResults(eventTypeId, marketIds),
  });
};

export const useSessionsResults = () => {
  return useMutation({
    mutationFn: ({
      eventTypeId,
      marketIds,
    }: {
      eventTypeId: string;
      marketIds: string[];
    }) => sportsApi.getSessionsResults(eventTypeId, marketIds),
  });
};

export const useFancyResults = () => {
  return useMutation({
    mutationFn: ({
      eventTypeId,
      marketIds,
    }: {
      eventTypeId: string;
      marketIds: string[];
    }) => sportsApi.getFancyResults(eventTypeId, marketIds),
  });
};

