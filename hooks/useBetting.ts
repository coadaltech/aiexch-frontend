import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type BetType = "back" | "lay";

interface PlaceBetParams {
  matchId: string;
  marketId: string;
  selectionId: string;
  marketName?: string;
  runnerName?: string;
  odds: number;
  stake: number;
  type: BetType;
}

export const useBetting = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const placeBetMutation = useMutation({
    mutationFn: async (params: PlaceBetParams) => {
      const response = await api.post("/betting/place", params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bets"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.refetchQueries({ queryKey: ["balance"] });
    },
  });

  const cancelBetMutation = useMutation({
    mutationFn: async (betId: string) => {
      const response = await api.post(`/betting/cancel/${betId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bets"] });
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

  return useQuery({
    queryKey: ["my-bets", status],
    queryFn: async () => {
      try {
        const response = await api.get(`/betting/my-bets?status=${status}`);
        return response.data;
      } catch (error) {
        console.error("API Error:", error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
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
