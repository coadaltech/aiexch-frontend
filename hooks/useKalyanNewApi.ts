import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kalyanNewApi } from "@/lib/api";

// Kalyan-New shares the matka_shifts table; sport_type=1005 differentiates.
// Number-type values (used in placeBet's bets[].numberType):
//   0 single pana, 1 double pana, 2 triple pana,
//   3 jodi (00-99), 4 akhar bahar (0-9), 5 akhar andar (0-9),
//   6 sangam (number = "OOOCCC" = opening pana + closing pana concatenated)
export interface KalyanNewShift {
  id: string;
  name: string;
  sportType: number;
  shiftDate: string;
  endTime: string;
  shiftOrder: number;
  singlePanaRate: string;
  singlePanaCommission: string;
  doublePanaRate: string;
  doublePanaCommission: string;
  tripleRate: string;
  tripleCommission: string;
  daraRate: string;
  daraCommission: string;
  akharRate: string;
  akharCommission: string;
  sangamRate: string;
  sangamCommission: string;
  mainJantriTime: string | null;
  closingTime: string | null;
  result?: number | null;
  isActive: boolean;
  nextDayAllow: boolean;
  capping: string;
}

export interface KalyanNewJantriTotal {
  number: string;
  numberType: number;
  totalAmount: string;
}

export interface KalyanNewTransactionDetail {
  id: string;
  numberType: number;
  number: string;
  amount: string;
  rate: string;
  commission: string;
}

export interface KalyanNewTransactionFull {
  id: string;
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  transactionDate: string;
  totalAmount: string;
  totalCommission: string;
  finalAmount: string;
  daraRate: string;
  akharRate: string;
  tripleRate: string;
  addedDate: string;
  details: KalyanNewTransactionDetail[];
}

export const useKalyanNewShifts = (date?: string) =>
  useQuery({
    queryKey: ["kalyan-new-shifts", date],
    queryFn: async () => {
      const res = await kalyanNewApi.getShifts(date);
      return (res.data?.data ?? []) as KalyanNewShift[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

export const useKalyanNewShift = (id: string | null) =>
  useQuery({
    queryKey: ["kalyan-new-shift", id],
    queryFn: async () => {
      const res = await kalyanNewApi.getShift(id!);
      return res.data?.data as KalyanNewShift;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useKalyanNewJantri = (shiftId: string | null) =>
  useQuery({
    queryKey: ["kalyan-new-jantri", shiftId],
    queryFn: async () => {
      const res = await kalyanNewApi.getJantri(shiftId!);
      return (res.data?.data ?? []) as KalyanNewJantriTotal[];
    },
    enabled: !!shiftId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

export const usePlaceKalyanNew = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kalyanNewApi.placeBet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kalyan-new-jantri"] });
      qc.invalidateQueries({ queryKey: ["kalyan-new-my-bets"] });
    },
  });
};

export const useKalyanNewMyBets = (params?: {
  shiftId?: string;
  status?: "active" | "inactive";
}) =>
  useQuery({
    queryKey: ["kalyan-new-my-bets", params?.shiftId, params?.status],
    queryFn: async () => {
      const res = await kalyanNewApi.getMyBets(params);
      return res.data?.data ?? [];
    },
    staleTime: 30 * 1000,
  });

export const useKalyanNewTransaction = (id: string | null) =>
  useQuery({
    queryKey: ["kalyan-new-transaction", id],
    queryFn: async () => {
      const res = await kalyanNewApi.getTransaction(id!);
      return res.data?.data as KalyanNewTransactionFull;
    },
    enabled: !!id,
    staleTime: 0,
  });

export const useDeleteKalyanNew = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kalyanNewApi.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kalyan-new-my-bets"] });
      qc.invalidateQueries({ queryKey: ["kalyan-new-jantri"] });
    },
  });
};
