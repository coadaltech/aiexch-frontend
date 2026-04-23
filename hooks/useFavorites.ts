"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface FavoriteMatch {
  favoriteId: string;
  eventId: number;
  name: string | null;
  competitionId: number | null;
  competitionName: string | null;
  sportId: number | null;
  sportName: string | null;
  openDate: string | null;
  isActive: boolean | null;
  addedDate: string;
}

const FAVORITES_QUERY_KEY = ["user", "favorites"] as const;
const FAVORITES_CHANGED_EVENT = "favorites:changed";

/** Fire-and-forget signal so the sidebar can refetch when the list mutates. */
function notifyFavoritesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

export { FAVORITES_CHANGED_EVENT };

export function useFavorites() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: async (): Promise<FavoriteMatch[]> => {
      const { data } = await favoritesApi.list();
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: (eventId: number | string) => favoritesApi.add(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<FavoriteMatch[]>(FAVORITES_QUERY_KEY);
      const stub: FavoriteMatch = {
        favoriteId: `pending-${eventId}`,
        eventId: Number(eventId),
        name: null,
        competitionId: null,
        competitionName: null,
        sportId: null,
        sportName: null,
        openDate: null,
        isActive: true,
        addedDate: new Date().toISOString(),
      };
      queryClient.setQueryData<FavoriteMatch[]>(FAVORITES_QUERY_KEY, (prev) => {
        if (!prev) return [stub];
        if (prev.some((f) => f.eventId === Number(eventId))) return prev;
        return [stub, ...prev];
      });
      return { previous };
    },
    onError: (_err, _eventId, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
      notifyFavoritesChanged();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (eventId: number | string) => favoritesApi.remove(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<FavoriteMatch[]>(FAVORITES_QUERY_KEY);
      queryClient.setQueryData<FavoriteMatch[]>(FAVORITES_QUERY_KEY, (prev) =>
        prev ? prev.filter((f) => f.eventId !== Number(eventId)) : prev,
      );
      return { previous };
    },
    onError: (_err, _eventId, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
      notifyFavoritesChanged();
    },
  });

  const isFavorite = useCallback(
    (eventId: number | string) => {
      const id = Number(eventId);
      return (query.data ?? []).some((f) => f.eventId === id);
    },
    [query.data],
  );

  const toggle = useCallback(
    (eventId: number | string) => {
      const id = Number(eventId);
      if (isFavorite(id)) removeMutation.mutate(id);
      else addMutation.mutate(id);
    },
    [isFavorite, addMutation, removeMutation],
  );

  return {
    favorites: query.data ?? [],
    isLoading: query.isLoading,
    isFavorite,
    toggle,
    isMutating: addMutation.isPending || removeMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
  };
}
