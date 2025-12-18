import { useQuery } from "@tanstack/react-query";
import { publicApi, userApi } from "@/lib/api";

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
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Refetch every 10 seconds
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
