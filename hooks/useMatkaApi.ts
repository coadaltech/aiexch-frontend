import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matkaApi } from "@/lib/api";

export interface MatkaTransactionDetail {
  id: string;
  numberType: number;
  number: string;
  amount: string;
  rate: string;
  commission: string;
}

export interface MatkaTransactionFull {
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
  details: MatkaTransactionDetail[];
}

export interface MatkaShift {
  id: string;
  name: string;
  shiftDate: string;
  endTime: string;
  shiftOrder: number;
  daraRate: string;
  daraCommission: string;
  akharRate: string;
  akharCommission: string;
  mainJantriTime: string | null;
  result: number | null;
  isActive: boolean;
  nextDayAllow: boolean;
  capping: string;
}

export interface JantriTotal {
  number: string;
  numberType: number;
  totalAmount: string;
}

export const useMatkaShifts = (date?: string) => {
  return useQuery({
    queryKey: ["matka-shifts", date],
    queryFn: async () => {
      const res = await matkaApi.getShifts(date);
      return (res.data?.data ?? []) as MatkaShift[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useMatkaShift = (id: string | null) => {
  return useQuery({
    queryKey: ["matka-shift", id],
    queryFn: async () => {
      const res = await matkaApi.getShift(id!);
      return res.data?.data as MatkaShift;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

export const useMatkaJantri = (shiftId: string | null) => {
  return useQuery({
    queryKey: ["matka-jantri", shiftId],
    queryFn: async () => {
      const res = await matkaApi.getJantri(shiftId!);
      return (res.data?.data ?? []) as JantriTotal[];
    },
    enabled: !!shiftId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
};

export const usePlaceMatka = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: matkaApi.placeBet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matka-jantri"] });
      queryClient.invalidateQueries({ queryKey: ["matka-my-bets"] });
    },
  });
};

export const useMatkaMyBets = () => {
  return useQuery({
    queryKey: ["matka-my-bets"],
    queryFn: async () => {
      const res = await matkaApi.getMyBets();
      return res.data?.data ?? [];
    },
    staleTime: 30 * 1000,
  });
};

export const useMatkaTransaction = (id: string | null) => {
  return useQuery({
    queryKey: ["matka-transaction", id],
    queryFn: async () => {
      const res = await matkaApi.getTransaction(id!);
      return res.data?.data as MatkaTransactionFull;
    },
    enabled: !!id,
    staleTime: 0,
  });
};

export const useDeleteMatka = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => matkaApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matka-my-bets"] });
      queryClient.invalidateQueries({ queryKey: ["matka-jantri"] });
    },
  });
};

export const useUpdateMatka = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bets }: { id: string; bets: { number: string; numberType: number; amount: number }[] }) =>
      matkaApi.updateTransaction(id, { bets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matka-jantri"] });
      queryClient.invalidateQueries({ queryKey: ["matka-my-bets"] });
      queryClient.invalidateQueries({ queryKey: ["matka-transaction"] });
    },
  });
};

export const useConsolidatedJantri = (shiftId: string | null, date: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: ["matka-jantri-consolidated", shiftId, date],
    queryFn: async () => {
      const res = await matkaApi.getJantriConsolidated(shiftId!, date!);
      return (res.data?.data ?? []) as JantriTotal[];
    },
    enabled: !!shiftId && !!date && enabled,
    staleTime: 0,
  });
};
