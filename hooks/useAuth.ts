import { useMutation } from "@tanstack/react-query";
import { authApi, LoginRequest, RegisterRequest } from "@/lib/api";

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
