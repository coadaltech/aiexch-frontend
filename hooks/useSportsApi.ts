import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sportsApi } from "@/lib/api";

// Sports list
export const useSports = () => {
  return useQuery({
    queryKey: ["sports"],
    queryFn: () => sportsApi.getSports(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Odds
export const useOdds = (
  eventTypeId: string,
  marketId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["odds", eventTypeId, marketId],
    queryFn: () => sportsApi.getOdds(eventTypeId, marketId),
    enabled: enabled && !!eventTypeId && !!marketId,
    refetchInterval: 2000, // 2 seconds
    staleTime: 1000, // 1 second
  });
};

// Bookmakers
export const useBookmakers = (
  eventTypeId: string,
  marketId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["bookmakers", eventTypeId, marketId],
    queryFn: () => sportsApi.getBookmakers(eventTypeId, marketId),
    enabled: enabled && !!eventTypeId && !!marketId,
    refetchInterval: 2000,
    staleTime: 1000,
  });
};

// Sessions
export const useSessions = (
  eventTypeId: string,
  matchId: string,
  gtype?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["sessions", eventTypeId, matchId, gtype],
    queryFn: () => sportsApi.getSessions(eventTypeId, matchId, gtype),
    enabled: enabled && !!eventTypeId && !!matchId,
    refetchInterval: 2000,
    staleTime: 1000,
  });
};

// Premium/Fancy
export const usePremium = (
  eventTypeId: string,
  matchId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["premium", eventTypeId, matchId],
    queryFn: () => sportsApi.getPremium(eventTypeId, matchId),
    enabled: enabled && !!eventTypeId && !!matchId,
    refetchInterval: 2000,
    staleTime: 1000,
  });
};

// Score
export const useScore = (
  eventTypeId: string,
  matchId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["score", eventTypeId, matchId],
    queryFn: () => sportsApi.getScore(eventTypeId, matchId),
    enabled: enabled && !!eventTypeId && !!matchId,
    refetchInterval: 5000,
    staleTime: 1000,
  });
};

// Series
export const useSeries = (eventTypeId: string, enabled = true) => {
  return useQuery({
    queryKey: ["series", eventTypeId],
    queryFn: () => sportsApi.getSeries(eventTypeId),
    enabled: enabled && !!eventTypeId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
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

// Markets with Odds
export const useMarketsWithOdds = (
  eventTypeId: string,
  eventId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["marketsWithOdds", eventTypeId, eventId],
    queryFn: () => sportsApi.getMarketsWithOdds(eventTypeId, eventId),
    enabled: enabled && !!eventTypeId && !!eventId,
    staleTime: 10 * 1000, // 2 seconds for live odds
    refetchInterval: 2000,
  });
};

// Bookmakers list
export const useBookmakersList = (
  eventTypeId: string,
  eventId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["bookmakersList", eventTypeId, eventId],
    queryFn: () => sportsApi.getBookmakersList(eventTypeId, eventId),
    enabled: enabled && !!eventTypeId && !!eventId,
    staleTime: 5 * 60 * 1000,
  });
};

// Bookmakers with Odds
export const useBookmakersWithOdds = (
  eventTypeId: string,
  eventId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["bookmakersWithOdds", eventTypeId, eventId],
    queryFn: () => sportsApi.getBookmakersWithOdds(eventTypeId, eventId),
    enabled: enabled && !!eventTypeId && !!eventId,
    staleTime: 2 * 1000,
    refetchInterval: 2000,
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

// Match Details (All data in one call)
export const useMatchDetails = (
  eventTypeId: string,
  eventId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["matchDetails", eventTypeId, eventId],
    queryFn: () => sportsApi.getMatchDetails(eventTypeId, eventId),
    enabled: enabled && !!eventTypeId && !!eventId,
    staleTime: 2 * 1000,
    refetchInterval: 2000,
  });
};

// Utility hook for refreshing live data
export const useRefreshSportsData = () => {
  const queryClient = useQueryClient();

  return {
    refreshOdds: (eventTypeId: string, marketId: string) => {
      queryClient.invalidateQueries({
        queryKey: ["odds", eventTypeId, marketId],
      });
    },
    refreshSessions: (eventTypeId: string, matchId: string) => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", eventTypeId, matchId],
      });
    },
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: ["odds"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bookmakers"] });
    },
  };
};
