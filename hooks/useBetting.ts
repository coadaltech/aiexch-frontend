import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoBets } from "@/lib/demo-bets";

type BetType = "back" | "lay";

export interface BetRunner {
  id: string;
  name: string;
  price: number;
}

export interface PlaceBetParams {
  matchId: string;
  marketId: string;
  eventTypeId: string;
  competitionId?: string | null;
  marketType?: string;
  bettingType?: string;
  selectionId: string;
  selectionName?: string;
  marketName?: string;
  odds: number;
  stake: number;
  run?: number | null;
  type: BetType;
  runners: BetRunner[];
  provider?: string;
}

export const useBetting = () => {
  const queryClient = useQueryClient();

  const placeBetMutation = useMutation({
    mutationFn: async (params: PlaceBetParams) => {
      const response = await api.post("/betting/place", params);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all bet-related queries in one batch.
      // invalidateQueries already triggers a refetch for active queries,
      // so no separate refetchQueries call is needed.
      queryClient.invalidateQueries({ queryKey: ["my-bets"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["market-exposure"] });
      queryClient.invalidateQueries({ queryKey: ["market-exposure-fancy"] });
    },
  });

  const cancelBetMutation = useMutation({
    mutationFn: async (betId: string) => {
      const response = await api.post(`/betting/cancel/${betId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bets"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["market-exposure"] });
      queryClient.invalidateQueries({ queryKey: ["market-exposure-fancy"] });
    },
  });

  return {
    placeBet: placeBetMutation.mutate,
    placeBetAsync: placeBetMutation.mutateAsync,
    cancelBet: cancelBetMutation.mutate,
    isPlacingBet: placeBetMutation.isPending,
    isCancellingBet: cancelBetMutation.isPending,
  };
};

export const useMyBets = (status = "matched") => {
  const { user } = useAuth();
  const isDemo = !!user?.isDemo;

  return useQuery({
    queryKey: ["my-bets", status, isDemo],
    queryFn: async () => {
      if (isDemo) {
        const data = getDemoBets();
        return { data };
      }
      const response = await api.get(`/betting/my-bets?status=${status}`);
      return response.data;
    },
    enabled: !!user,
    retry: isDemo ? false : 1,
  });
};

export const useBalance = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const response = await api.get("/betting/balance");
      return response.data;
    },
    enabled: !!user,
  });
};

// Fetch per-runner profit/loss from DB function (for odds/bookmaker markets, market_type <> 4)
// Returns a nested map: marketId → runnerId → profit (positive = profit, negative = loss)
export const useMarketExposure = (enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["market-exposure"],
    queryFn: async () => {
      const response = await api.get("/betting/market-exposure");
      return response.data;
    },
    select: (data) => {
      const rows: { market_id: string; runner_id: string; runner_profit: string }[] = data.data || [];
      const map = new Map<string, Map<string, number>>();
      for (const row of rows) {
        const mId = String(row.market_id);
        const rId = String(row.runner_id);
        const profit = parseFloat(row.runner_profit) || 0;
        if (!map.has(mId)) map.set(mId, new Map());
        map.get(mId)!.set(rId, profit);
      }
      return map;
    },
    enabled: enabled && !!user && !user.isDemo,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refreshed on bet placement via invalidation
  });
};

// Fetch detailed run-by-run exposure chart for a single fancy market
export const useFancyExposureChart = (marketId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["fancy-exposure-chart", marketId],
    queryFn: async () => {
      const response = await api.get(`/betting/fancy-exposure-chart?marketId=${marketId}`);
      return response.data;
    },
    select: (data) => {
      const rows: { run: number; runner_profit: string }[] = data.data || [];
      return rows.map((r) => ({ run: r.run, profit: parseFloat(r.runner_profit) || 0 }));
    },
    enabled: !!marketId && !!user && !user.isDemo,
    staleTime: 5000,
  });
};

// Fetch per-market worst-case profit/loss for fancy/session markets (market_type = 4)
// Returns a map: marketId → profit (min across all run scenarios)
export const useFancyMarketExposure = (enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["market-exposure-fancy"],
    queryFn: async () => {
      const response = await api.get("/betting/market-exposure-fancy");
      return response.data;
    },
    select: (data) => {
      const rows: { market_id: string; runner_profit: string }[] = data.data || [];
      const map = new Map<string, number>();
      for (const row of rows) {
        const mId = String(row.market_id);
        const profit = parseFloat(row.runner_profit) || 0;
        map.set(mId, profit);
      }
      return map;
    },
    enabled: enabled && !!user && !user.isDemo,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refreshed on bet placement via invalidation
  });
};
