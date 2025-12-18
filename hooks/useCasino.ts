import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { casinoApi } from "@/lib/api";
import { toast } from "sonner";

const DEFAULT_PER_PAGE = 24;

export const useCasinoGames = (
  expand?: string,
  page?: number,
  per_page?: number
) => {
  return useQuery({
    queryKey: ["casino-games", expand, page, per_page],
    queryFn: () =>
      casinoApi.getGames(expand, page, per_page).then((res) => res.data),
  });
};

export const useCasinoGamesFromDb = (
  filters?: {
    provider?: string;
    type?: string;
    technology?: string;
    search?: string;
    sort_by?: string;
    order?: string;
  },
  perPage: number = DEFAULT_PER_PAGE
) => {
  return useInfiniteQuery({
    queryKey: ["casino-games-db", filters, perPage],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      casinoApi
        .getGamesFromDb({
          ...filters,
          page: pageParam.toString(),
          per_page: perPage.toString(),
        })
        .then((res) => res.data),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      const nextPage = pagination.page + 1;
      return nextPage <= pagination.total_pages ? nextPage : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      const pagination = firstPage?.pagination;
      if (!pagination) return undefined;
      const prevPage = pagination.page - 1;
      return prevPage >= 1 ? prevPage : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCasinoLobby = (
  game_uuid: string,
  currency: string,
  technology?: string
) => {
  return useQuery({
    queryKey: ["casino-lobby", game_uuid, currency, technology],
    queryFn: () =>
      casinoApi
        .getLobby(game_uuid, currency, technology)
        .then((res) => res.data),
    enabled: !!game_uuid && !!currency,
  });
};

export const useInit = () => {
  return useMutation({
    mutationFn: (data: Record<string, any>) => casinoApi.initGame(data),
    onError: () => toast.error("Failed to initialize game"),
  });
};

export const useInitDemo = () => {
  return useMutation({
    mutationFn: (data: Record<string, any>) => casinoApi.initDemo(data),
    onError: () => toast.error("Failed to initialize demo"),
  });
};

export const useFreespinBets = (game_uuid: string, currency: string) => {
  return useQuery({
    queryKey: ["freespin-bets", game_uuid, currency],
    queryFn: () =>
      casinoApi.getFreespinBets(game_uuid, currency).then((res) => res.data),
    enabled: !!game_uuid && !!currency,
  });
};

export const useSetFreespin = () => {
  return useMutation({
    mutationFn: (data: Record<string, any>) => casinoApi.setFreespin(data),
    onSuccess: () => toast.success("Freespin set successfully"),
    onError: () => toast.error("Failed to set freespin"),
  });
};

export const useFreespin = (freespin_id: string) => {
  return useQuery({
    queryKey: ["freespin", freespin_id],
    queryFn: () => casinoApi.getFreespin(freespin_id).then((res) => res.data),
    enabled: !!freespin_id,
  });
};

export const useCancelFreespin = () => {
  return useMutation({
    mutationFn: (freespin_id: string) => casinoApi.cancelFreespin(freespin_id),
    onSuccess: () => toast.success("Freespin cancelled"),
    onError: () => toast.error("Failed to cancel freespin"),
  });
};

export const useCasinoLimits = () => {
  return useQuery({
    queryKey: ["casino-limits"],
    queryFn: () => casinoApi.getLimits().then((res) => res.data),
  });
};

export const useFreespinLimits = () => {
  return useQuery({
    queryKey: ["freespin-limits"],
    queryFn: () => casinoApi.getFreespinLimits().then((res) => res.data),
  });
};

export const useJackpots = () => {
  return useQuery({
    queryKey: ["jackpots"],
    queryFn: () => casinoApi.getJackpots().then((res) => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useBalanceNotify = () => {
  return useMutation({
    mutationFn: ({
      balance,
      session_id,
    }: {
      balance: number;
      session_id?: string;
    }) => casinoApi.balanceNotify(balance, session_id),
  });
};

export const useSelfValidate = () => {
  return useMutation({
    mutationFn: () => casinoApi.selfValidate(),
  });
};

export const useGameTags = (expand?: string) => {
  return useQuery({
    queryKey: ["game-tags", expand],
    queryFn: () => casinoApi.getGameTags(expand).then((res) => res.data),
  });
};

export const useCasinoProviders = () => {
  return useQuery({
    queryKey: ["casino-providers"],
    queryFn: () => casinoApi.getProviders().then((res) => res.data),
    staleTime: 60 * 60 * 1000,
  });
};

export const useCasinoTypes = () => {
  return useQuery({
    queryKey: ["casino-types"],
    queryFn: () => casinoApi.getTypes().then((res) => res.data),
    staleTime: 60 * 60 * 1000,
  });
};

export const useCasinoProvidersWithTypes = () => {
  return useQuery({
    queryKey: ["casino-providers-types"],
    queryFn: () => casinoApi.getProvidersWithTypes().then((res) => res.data),
    staleTime: 60 * 60 * 1000,
  });
};
