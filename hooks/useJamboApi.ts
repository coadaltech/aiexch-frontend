import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jamboApi } from "@/lib/api";

// Jambo shares the matka_shifts table shape — same fields, but sport_type=1004.
export interface JamboShift {
  id: string;
  name: string;
  sportType: number;
  shiftDate: string;
  endTime: string;
  shiftOrder: number;
  // tripleRate → number_type 0. daraRate → 1,2 (jodi). akharRate → 3-5.
  tripleRate: string;
  tripleCommission: string;
  daraRate: string;
  daraCommission: string;
  akharRate: string;
  akharCommission: string;
  mainJantriTime: string | null;
  result?: number | null;
  isActive: boolean;
  nextDayAllow: boolean;
  capping: string;
}

export interface JamboJantriTotal {
  number: string;
  numberType: number;
  totalAmount: string;
}

export interface JamboTransactionDetail {
  id: string;
  numberType: number;
  number: string;
  amount: string;
  rate: string;
  commission: string;
}

export interface JamboTransactionFull {
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
  addedDate: string;
  details: JamboTransactionDetail[];
}

export const useJamboShifts = (date?: string) =>
  useQuery({
    queryKey: ["jambo-shifts", date],
    queryFn: async () => {
      const res = await jamboApi.getShifts(date);
      return (res.data?.data ?? []) as JamboShift[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

export const useJamboShift = (id: string | null) =>
  useQuery({
    queryKey: ["jambo-shift", id],
    queryFn: async () => {
      const res = await jamboApi.getShift(id!);
      return res.data?.data as JamboShift;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useJamboJantri = (shiftId: string | null) =>
  useQuery({
    queryKey: ["jambo-jantri", shiftId],
    queryFn: async () => {
      const res = await jamboApi.getJantri(shiftId!);
      return (res.data?.data ?? []) as JamboJantriTotal[];
    },
    enabled: !!shiftId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

export const usePlaceJambo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jamboApi.placeBet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jambo-jantri"] });
      qc.invalidateQueries({ queryKey: ["jambo-my-bets"] });
    },
  });
};

export const useJamboMyBets = (params?: { shiftId?: string; status?: "active" | "inactive" }) =>
  useQuery({
    queryKey: ["jambo-my-bets", params?.shiftId, params?.status],
    queryFn: async () => {
      const res = await jamboApi.getMyBets(params);
      return res.data?.data ?? [];
    },
    staleTime: 30 * 1000,
  });

export const useJamboTransaction = (id: string | null) =>
  useQuery({
    queryKey: ["jambo-transaction", id],
    queryFn: async () => {
      const res = await jamboApi.getTransaction(id!);
      return res.data?.data as JamboTransactionFull;
    },
    enabled: !!id,
    staleTime: 0,
  });

export const useDeleteJambo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jamboApi.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jambo-my-bets"] });
      qc.invalidateQueries({ queryKey: ["jambo-jantri"] });
    },
  });
};
