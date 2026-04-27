import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publicApi, userApi } from "@/lib/api";

export interface StakeButton { label: string; value: number }

export const DEFAULT_STAKES: StakeButton[] = [
  { label: "500",   value: 500     },
  { label: "1K",    value: 1000    },
  { label: "5K",    value: 5000    },
  { label: "10K",   value: 10000   },
  { label: "50K",   value: 50000   },
  { label: "1L",    value: 100000  },
  { label: "5L",    value: 500000  },
  { label: "10L",   value: 1000000 },
];

export const useStakeSettings = (enabled = true) => {
  return useQuery({
    queryKey: ["stake-settings"],
    queryFn: () => userApi.getStakeSettings(),
    select: (res) => (res.data?.data as StakeButton[]) ?? DEFAULT_STAKES,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveStakeSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stakes: StakeButton[]) => userApi.saveStakeSettings(stakes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stake-settings"] }),
  });
};

export const useTransactions = (params?: {
  type?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => userApi.getTransactions(params),
    select: (data) => data.data.data || [],
  });
};

export const useAccountStatement = (params: { fromDate: string; toDate: string }) => {
  return useQuery({
    queryKey: ["account-statement", params.fromDate, params.toDate],
    queryFn: () => userApi.getAccountStatement(params),
    select: (data) => (data.data?.data?.transactions ?? []) as any[],
    enabled: !!params.fromDate && !!params.toDate,
  });
};

export const useBetDetails = (marketId: string | null, voucherId?: string | null) => {
  return useQuery({
    queryKey: ["bet-details", marketId, voucherId],
    queryFn: () => userApi.getBetDetails(marketId!, voucherId),
    select: (data) => ({
      bets:      (data.data?.data?.bets      ?? []) as any[],
      marketPnl: parseFloat(data.data?.data?.marketPnl ?? 0) as number,
    }),
    enabled: !!marketId,
  });
};

export const useBetHistory = (params?: { result?: string; type?: string }) => {
  return useQuery({
    queryKey: ["betHistory", params],
    queryFn: () => userApi.getBetHistory(params),
    select: (data) => data.data.data || [],
  });
};

export const useNotifications = (userId?: number) => {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => userApi.getNotifications(userId!),
    select: (data) => data.data.data || [],
    enabled: !!userId,
  });
};

export const usePromocodes = () => {
  return useQuery({
    queryKey: ["promocodes"],
    queryFn: () => publicApi.getPromocodes(),
    select: (data) => data.data.data || [],
  });
};

export const usePromotions = (type?: string) => {
  return useQuery({
    queryKey: ["promotions", type],
    queryFn: () => publicApi.getPromotions(type),
    select: (data) => data.data.data || [],
  });
};

export const useBalance = (enabled = true) => {
  return useQuery({
    queryKey: ["balance"],
    queryFn: () => userApi.getBalance(),
    select: (data) => data.data.balance || "0",
    enabled,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds (also refreshed on bet placement)
  });
};

export const useLedger = (enabled = true) => {
  return useQuery({
    queryKey: ["ledger"],
    queryFn: () => userApi.getLedgerInfo(),
    select: (data) => data.data.data as {
      userId: string;
      userBalance: string;
      userLimit: string;
      limitConsumed: string;
      fixLimit: string;
      finalLimit: string;
    } | null,
    enabled,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds (also refreshed on bet placement)
  });
};

export interface ExposureUsageRow {
  marketId: string | number | null;
  shiftId: string | null;
  intFlag: number;
  limitUse: string;
  sportName: string | null;
  competitionName: string | null;
  eventName: string | null;
  shiftName: string | null;
  marketName: string | null;
}

export const useExposureUsage = (enabled = true) => {
  return useQuery({
    queryKey: ["exposure-usage"],
    queryFn: () => userApi.getExposureUsage(),
    select: (res) => (res.data?.data as ExposureUsageRow[]) ?? [],
    enabled,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });
};

export const usePublicPopups = (path?: string) => {
  const page = path === "/" ? "home" : path?.replace("/", "") || "";
  return useQuery({
    queryKey: ["public-popups", page],
    queryFn: () => publicApi.getPopups(page),
    select: (data) => data.data.data || [],
  });
};
