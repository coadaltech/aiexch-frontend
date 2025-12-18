"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthModalProps, AuthFormData } from "@/types";
import { useLogin, useRegister, useSendOTP } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, publicApi } from "@/lib/api";
import { toast } from "sonner";
import { AuthForm } from "./auth/auth-form";
import { ForgotPasswordForm } from "./auth/forgot-password-form";
import { OtpForm } from "./auth/otp-form";
import Image from "next/image";

const initialFormData: AuthFormData = {
  email: "",
  password: "",
  referralCode: "",
  name: "",
  country: "",
  phone: "",
  agreeTerms: false,
  agreeMarketing: false,
};

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<
    "signin" | "signup" | "forgot" | "verify-otp"
  >(initialMode);
  const [formData, setFormData] = useState<AuthFormData>(initialFormData);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [authImage, setAuthImage] = useState<string>("");

  const { login } = useAuth();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const sendOTPMutation = useSendOTP();

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setOtp("");
    setResetPassword("");
    setConfirmResetPassword("");
    setResetEmailSent(false);
    setError("");
  }, []);

  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    sendOTPMutation.isPending;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signin") {
      loginMutation.mutate(
        { email: formData.email, password: formData.password },
        {
          onSuccess: (response) => {
            if (response.data.success && response.data.user) {
              login(response.data.user);
              onClose();
              resetForm();
            } else {
              setError("Invalid credentials");
            }
          },
          onError: (error: any) => {
            setError(
              error.response?.data?.message || error.message || "Login failed"
            );
          },
        }
      );
    } else {
      if (!formData.agreeTerms) {
        setError("You must agree to the terms and conditions");
        return;
      }
      sendOTPMutation.mutate(
        { email: formData.email, type: "registration" },
        {
          onSuccess: () => setMode("verify-otp"),
          onError: (error: any) => {
            setError(error.response?.data?.message || "Failed to send OTP");
          },
        }
      );
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    registerMutation.mutate(
      {
        username: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        country: formData.country,
        otp,
      },
      {
        onSuccess: () => {
          toast.success("Registration successful! Please login.");
          resetForm();
          setMode("signin");
        },
        onError: (error: any) => {
          setError(error.response?.data?.message || "Registration failed");
        },
      }
    );
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resetEmailSent) {
      sendOTPMutation.mutate(
        { email: formData.email, type: "password_reset" },
        {
          onSuccess: () => setResetEmailSent(true),
          onError: (error: any) => {
            setError(error.response?.data?.message || "Failed to send OTP");
          },
        }
      );
    } else {
      if (resetPassword !== confirmResetPassword) {
        setError("Passwords don't match");
        return;
      }
      try {
        await authApi.resetPassword({
          email: formData.email,
          otp,
          newPassword: resetPassword,
        });
        toast.success("Password reset successfully");
        resetForm();
        setMode("signin");
        onClose();
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to reset password");
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch auth image from settings
      publicApi
        .getSettings()
        .then(({ data }) => {
          console.log("Settings data:", data);
          if (data.data?.authImage) {
            setAuthImage(data.data.authImage);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch settings:", error);
        });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="backdrop-blur-2xl border-border max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <div className="w-full relative">
          {/* {authImage && (
            <div className="w-full mb-4">
              <Image
                src={authImage}
                alt="Auth background"
                width={800}
                height={200}
                className="w-full h-48 object-cover"
              />
            </div>
          )} */}

          {/* Auth Tabs */}
          {(mode === "signin" || mode === "signup") && (
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as "signin" | "signup")}
              className="mb-6 mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Form Content */}
          <div className="mb-8">
            {mode === "verify-otp" && (
              <OtpForm
                email={formData.email}
                otp={otp}
                onOtpChange={setOtp}
                onSubmit={handleOtpSubmit}
                error={error}
                isLoading={isLoading}
              />
            )}

            {mode === "forgot" && (
              <ForgotPasswordForm
                email={formData.email}
                onEmailChange={(email) => setFormData({ ...formData, email })}
                otp={otp}
                onOtpChange={setOtp}
                resetPassword={resetPassword}
                onResetPasswordChange={setResetPassword}
                confirmResetPassword={confirmResetPassword}
                onConfirmResetPasswordChange={setConfirmResetPassword}
                resetEmailSent={resetEmailSent}
                onSubmit={handleForgotSubmit}
                onBackToSignIn={() => {
                  setMode("signin");
                  resetForm();
                }}
                error={error}
                isLoading={isLoading}
              />
            )}

            {(mode === "signin" || mode === "signup") && (
              <AuthForm
                mode={mode}
                formData={formData}
                onFormChange={setFormData}
                onSubmit={handleAuthSubmit}
                error={error}
                isLoading={isLoading}
                onForgotPassword={() => {
                  setMode("forgot");
                  resetForm();
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
