"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { multimarketsApi, type PinMarketPayload } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface MultimarketPin {
  multimarketId: string;
  marketId: string;
  marketName: string;
  marketType: string;
  eventId: number;
  eventName: string;
  openDate: string | null;
  isActive: boolean;
  suspended: boolean;
  competitionId: number;
  competitionName: string;
  sportId: number;
  sportName: string;
  addedDate: string;
}

const MULTIMARKETS_QUERY_KEY = ["user", "multimarkets"] as const;
const MULTIMARKETS_CHANGED_EVENT = "multimarkets:changed";

function notifyMultimarketsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MULTIMARKETS_CHANGED_EVENT));
}

export { MULTIMARKETS_CHANGED_EVENT };

export function useMultimarkets() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: MULTIMARKETS_QUERY_KEY,
    queryFn: async (): Promise<MultimarketPin[]> => {
      const { data } = await multimarketsApi.list();
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: (payload: PinMarketPayload) => multimarketsApi.add(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: MULTIMARKETS_QUERY_KEY });
      const previous = queryClient.getQueryData<MultimarketPin[]>(MULTIMARKETS_QUERY_KEY);
      const stub: MultimarketPin = {
        multimarketId: `pending-${payload.marketId}`,
        marketId: payload.marketId,
        marketName: payload.marketName,
        marketType: payload.marketType,
        eventId: Number(payload.eventId),
        eventName: payload.eventName,
        openDate: payload.openDate ?? null,
        isActive: true,
        suspended: false,
        competitionId: Number(payload.competitionId),
        competitionName: payload.competitionName,
        sportId: Number(payload.sportId),
        sportName: payload.sportName,
        addedDate: new Date().toISOString(),
      };
      queryClient.setQueryData<MultimarketPin[]>(MULTIMARKETS_QUERY_KEY, (prev) => {
        if (!prev) return [stub];
        if (prev.some((p) => p.marketId === payload.marketId)) return prev;
        return [stub, ...prev];
      });
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(MULTIMARKETS_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MULTIMARKETS_QUERY_KEY });
      notifyMultimarketsChanged();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (marketId: string) => multimarketsApi.remove(marketId),
    onMutate: async (marketId) => {
      await queryClient.cancelQueries({ queryKey: MULTIMARKETS_QUERY_KEY });
      const previous = queryClient.getQueryData<MultimarketPin[]>(MULTIMARKETS_QUERY_KEY);
      queryClient.setQueryData<MultimarketPin[]>(MULTIMARKETS_QUERY_KEY, (prev) =>
        prev ? prev.filter((p) => p.marketId !== marketId) : prev,
      );
      return { previous };
    },
    onError: (_err, _marketId, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(MULTIMARKETS_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MULTIMARKETS_QUERY_KEY });
      notifyMultimarketsChanged();
    },
  });

  const isPinned = useCallback(
    (marketId: string) => (query.data ?? []).some((p) => p.marketId === marketId),
    [query.data],
  );

  const toggle = useCallback(
    (payload: PinMarketPayload) => {
      if (isPinned(payload.marketId)) removeMutation.mutate(payload.marketId);
      else addMutation.mutate(payload);
    },
    [isPinned, addMutation, removeMutation],
  );

  return {
    pins: query.data ?? [],
    isLoading: query.isLoading,
    isPinned,
    toggle,
    remove: (marketId: string) => removeMutation.mutate(marketId),
    isMutating: addMutation.isPending || removeMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: MULTIMARKETS_QUERY_KEY }),
  };
}
