import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bombayBazarApi } from "@/lib/api";

// Bombay Bazar shares the matka_shifts table; sport_type=1005 differentiates.
// Number-type values (used in placeBet's bets[].numberType):
//   0 single pana, 1 double pana, 2 triple pana,
//   3 jodi (00-99), 4 akhar bahar (0-9), 5 akhar andar (0-9),
//   6 sangam (number = "OOOCCC" = opening pana + closing pana concatenated)
export interface BombayBazarShift {
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

export interface BombayBazarJantriTotal {
  number: string;
  numberType: number;
  totalAmount: string;
}

export interface BombayBazarTransactionDetail {
  id: string;
  numberType: number;
  number: string;
  amount: string;
  rate: string;
  commission: string;
}

export interface BombayBazarTransactionFull {
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
  details: BombayBazarTransactionDetail[];
}

export const useBombayBazarShifts = (date?: string) =>
  useQuery({
    queryKey: ["bombay-bazar-shifts", date],
    queryFn: async () => {
      const res = await bombayBazarApi.getShifts(date);
      return (res.data?.data ?? []) as BombayBazarShift[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

export const useBombayBazarShift = (id: string | null) =>
  useQuery({
    queryKey: ["bombay-bazar-shift", id],
    queryFn: async () => {
      const res = await bombayBazarApi.getShift(id!);
      return res.data?.data as BombayBazarShift;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useBombayBazarJantri = (shiftId: string | null) =>
  useQuery({
    queryKey: ["bombay-bazar-jantri", shiftId],
    queryFn: async () => {
      const res = await bombayBazarApi.getJantri(shiftId!);
      return (res.data?.data ?? []) as BombayBazarJantriTotal[];
    },
    enabled: !!shiftId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

export const usePlaceBombayBazar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bombayBazarApi.placeBet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bombay-bazar-jantri"] });
      qc.invalidateQueries({ queryKey: ["bombay-bazar-my-bets"] });
    },
  });
};

export const useBombayBazarMyBets = (params?: {
  shiftId?: string;
  status?: "active" | "inactive";
}) =>
  useQuery({
    queryKey: ["bombay-bazar-my-bets", params?.shiftId, params?.status],
    queryFn: async () => {
      const res = await bombayBazarApi.getMyBets(params);
      return res.data?.data ?? [];
    },
    staleTime: 30 * 1000,
  });

export const useBombayBazarTransaction = (id: string | null) =>
  useQuery({
    queryKey: ["bombay-bazar-transaction", id],
    queryFn: async () => {
      const res = await bombayBazarApi.getTransaction(id!);
      return res.data?.data as BombayBazarTransactionFull;
    },
    enabled: !!id,
    staleTime: 0,
  });

export const useDeleteBombayBazar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bombayBazarApi.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bombay-bazar-my-bets"] });
      qc.invalidateQueries({ queryKey: ["bombay-bazar-jantri"] });
    },
  });
};
