"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useSendOTP } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const sendOTPMutation = useSendOTP();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    sendOTPMutation.mutate(
      { email, type: "password_reset" },
      {
        onSuccess: () => setStep("reset"),
        onError: (error: any) => {
          setError(error.response?.data?.message || "Failed to send OTP");
        },
      }
    );
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      await authApi.resetPassword({ email, otp, newPassword: password });
      toast.success("Password reset successfully");
      router.push("/login");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to reset password");
    }
  };

  if (step === "reset") {
    return (
      <Card className="h-full lg:h-auto p-6 lg:p-8 border-0 lg:border lg:border-border/50 shadow-none lg:shadow-xl rounded-none lg:rounded-lg overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Reset Password
          </h1>
          <p className="text-muted-foreground">
            Enter OTP and your new password
          </p>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-5">
          <div>
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
            />
          </div>

          <div>
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" className="w-full h-11 text-base">
            Reset Password
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={() => setStep("email")}
          >
            Back
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="h-full lg:h-auto p-6 lg:p-8 border-0 lg:border lg:border-border/50 shadow-none lg:shadow-xl rounded-none lg:rounded-lg flex flex-col justify-center">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Forgot Password
        </h1>
        <p className="text-muted-foreground">
          Enter your email to receive a reset code
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full h-11 text-base"
          disabled={sendOTPMutation.isPending}
        >
          {sendOTPMutation.isPending ? "Sending..." : "Send Reset Code"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-primary hover:underline font-semibold"
        >
          Back to login
        </Link>
      </div>
    </Card>
  );
}
