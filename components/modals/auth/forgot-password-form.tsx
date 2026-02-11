"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ForgotPasswordFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
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
  setOtp,
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
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  // Validate password length
  useEffect(() => {
    if (resetEmailSent && resetPassword) {
      if (resetPassword.length > 0 && resetPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long");
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }
  }, [resetPassword, resetEmailSent]);

  // Validate confirm password
  useEffect(() => {
    if (resetEmailSent && confirmResetPassword) {
      if (confirmResetPassword.length > 0 && confirmResetPassword.length < 8) {
        setConfirmPasswordError("Password must be at least 8 characters long");
      } else if (resetPassword && confirmResetPassword !== resetPassword) {
        setConfirmPasswordError("Passwords don't match");
      } else {
        setConfirmPasswordError("");
      }
    } else {
      setConfirmPasswordError("");
    }
  }, [confirmResetPassword, resetPassword, resetEmailSent]);

  // Clear errors when error prop changes (from parent)
  useEffect(() => {
    if (error && error.includes("Validation failed")) {
      // Only show generic error if it's not a password length issue
      if (!passwordError && !confirmPasswordError) {
        // Keep the error visible
      }
    }
  }, [error, passwordError, confirmPasswordError]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Reset Password
      </h2>

      {error && !passwordError && !confirmPasswordError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 backdrop-blur-sm">
          <p className="text-destructive text-sm font-medium">{error}</p> 
        </div>
      )}

      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        {resetEmailSent
          ? `Enter the code sent to ${email} and your new password.`
          : "Enter your email address and we'll send you a code to reset your password."}
      </p>

      {/* ✅ autofill off */}
      <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
        {/* 🔥 Strong autofill blocker (Chrome hack) */}
        <input
          type="text"
          name="fake_username"
          autoComplete="username"
          className="hidden"
          tabIndex={-1}
        />
        <input
          type="password"
          name="fake_password"
          autoComplete="current-password"
          className="hidden"
          tabIndex={-1}
        />

        {!resetEmailSent ? (
          <div className="space-y-1">
            <Input
              id="forgot_email"
              name="forgot_email"
              type="email"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2"
              required
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* OTP */}
            <div className="space-y-1">
              <Input
                id="reset_otp"
                name="reset_otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setOtp(onlyDigits);
                  onOtpChange(onlyDigits);
                }}
                className="h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2 text-center text-2xl tracking-widest font-semibold"
                maxLength={6}
                required
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <Input
                id="reset_new_password"
                name="reset_new_password"
                type="password"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck={false}
                placeholder="New Password"
                value={resetPassword}
                onChange={(e) => onResetPasswordChange(e.target.value)}
                className={`h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:ring-2 ${
                  passwordError
                    ? "border-destructive focus-visible:border-destructive"
                    : "border-blue-700/30 focus-visible:border-primary"
                }`}
                required
              />
              {passwordError && (
                <p className="text-destructive text-xs mt-1 px-1">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <Input
                id="reset_confirm_password"
                name="reset_confirm_password"
                type="password"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Confirm New Password"
                value={confirmResetPassword}
                onChange={(e) => onConfirmResetPasswordChange(e.target.value)}
                className={`h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:ring-2 ${
                  confirmPasswordError
                    ? "border-destructive focus-visible:border-destructive"
                    : "border-blue-700/30 focus-visible:border-primary"
                }`}
                required
              />
              {confirmPasswordError && (
                <p className="text-destructive text-xs mt-1 px-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          className="w-full h-12 bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md cursor-pointer transition-all font-semibold"
        >
          {resetEmailSent ? "Reset Password" : "Send Reset Code"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-muted-foreground text-sm">
          Remember your password?{" "}
          <button
            type="button"
            onClick={onBackToSignIn}
            className="text-primary font-medium  transition-all focus:outline-none focus-visible:underline cursor-pointer"
          >
            Back to Sign In
          </button>
        </span>
      </div>
    </div>
  );
}
