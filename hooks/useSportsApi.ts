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

// Series with matches
export const useSeries = (eventTypeId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ["series", eventTypeId],
    queryFn: async () => {
      const res = await sportsApi.getSeries(eventTypeId!);
      return (res.data?.data ?? []) as any[];
    },
    enabled: enabled && !!eventTypeId,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 60 * 1000,
    placeholderData: (prev: any[] | undefined) => prev,
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

