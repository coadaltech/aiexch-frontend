"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ForgotPasswordFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  otp: string;
  onOtpChange: (otp: string) => void;
  resetPassword: string;
  onResetPasswordChange: (password: string) => void;
  confirmResetPassword: string;
  onConfirmResetPasswordChange: (password: string) => void;
  resetEmailSent: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToSignIn: () => void;
  error: string;
  isLoading: boolean;
}

export function ForgotPasswordForm({
  email,
  onEmailChange,
  otp,
  onOtpChange,
  resetPassword,
  onResetPasswordChange,
  confirmResetPassword,
  onConfirmResetPasswordChange,
  resetEmailSent,
  onSubmit,
  onBackToSignIn,
  error,
  isLoading,
}: ForgotPasswordFormProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Reset Password
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <p className="text-muted-foreground text-sm mb-4">
        {resetEmailSent
          ? `Enter the code sent to ${email} and your new password.`
          : "Enter your email address and we'll send you a code to reset your password."}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {!resetEmailSent ? (
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="h-12"
            required
          />
        ) : (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => onOtpChange(e.target.value)}
              className="h-12"
              maxLength={6}
              required
            />
            <Input
              type="password"
              placeholder="New Password"
              value={resetPassword}
              onChange={(e) => onResetPasswordChange(e.target.value)}
              className="h-12"
              required
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmResetPassword}
              onChange={(e) => onConfirmResetPasswordChange(e.target.value)}
              className="h-12"
              required
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          className="w-full h-12"
        >
          {resetEmailSent ? "Reset Password" : "Send Reset Code"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-muted-foreground text-sm">
          Remember your password?{" "}
          <button
            onClick={onBackToSignIn}
            className="text-primary font-medium hover:text-primary/80"
          >
            Back to Sign In
          </button>
        </span>
      </div>
    </div>
  );
}
