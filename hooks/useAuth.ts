import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi, LoginRequest, RegisterRequest, publicApi } from "@/lib/api";

export type WhitelabelType = "B2B" | "B2C" | null;

export const useWhitelabelInfo = () => {
  return useQuery({
    queryKey: ["whitelabel-info"],
    queryFn: async () => {
      const { data } = await publicApi.getWhitelabelInfo();
      return data?.data as { whitelabelType: WhitelabelType; id: string | null; name: string | null };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
  });
};

export const useSendOTP = () => {
  return useMutation({
    mutationFn: (data: { email: string; type?: string }) =>
      authApi.sendOTP(data),
  });
};

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authApi.verifyOTP(email, otp),
  });
};
