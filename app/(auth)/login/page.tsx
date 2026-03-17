"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin, useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth, createDemoUser, DEMO_BALANCE } from "@/contexts/AuthContext";
import { Eye, EyeOff, Sparkles, Mail, Lock } from "lucide-react";
import { Captcha } from "@/components/modals/auth/captcha";
import { normalizeRole, normalizeMembership, PANEL_ROLE_IDS, PANEL_ROLE_STRINGS } from "@/types/enums";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const whitelabelType = whitelabelInfo?.whitelabelType ?? null;
  const isB2B =
    whitelabelType == null ||
    String(whitelabelType).toUpperCase() === "B2B";
  const isB2C = !isB2B;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (response) => {
          if (response.data.success && response.data.user) {
            const user = response.data.user as {
              id: string;
              username: string;
              email: string;
              membership: string | number;
              balance?: string;
              role?: string | number;
            };
            const roleStr = normalizeRole(user.role);
            login({
              id: user.id,
              username: user.username,
              email: user.email,
              membership: normalizeMembership(user.membership),
              balance: user.balance ?? "0",
              role: roleStr,
            });
            // Check panel access: support both numeric and string role from API
            const isPanelRole = typeof user.role === "number"
              ? PANEL_ROLE_IDS.includes(user.role)
              : PANEL_ROLE_STRINGS.includes(roleStr);
            if (isPanelRole) {
              router.push("/owner");
            } else {
              router.push("/");
            }
          } else {
            setError("Invalid credentials");
          }
        },
        onError: (error: any) => {
          setError(error.response?.data?.message || "Login failed");
        },
      }
    );
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome Back
        </h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-11"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-11 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Captcha */}
        <Captcha onValidate={setCaptchaValid} />

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
          disabled={loginMutation.isPending || !captchaValid}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </Button>

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground/70">
              Or
            </span>
          </div>
        </div>

        {/* Demo button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-dashed border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all"
          onClick={() => {
            const demoUser = createDemoUser();
            login(demoUser);
            router.push("/");
          }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="ml-1">Try Demo</span>
          <span className="ml-1.5 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
            ₹{DEMO_BALANCE}
          </span>
        </Button>
      </form>

      {/* Footer links */}
      <div className="mt-6 text-center space-y-2">
        <div>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
        {isB2C && (
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline font-semibold"
            >
              Sign up
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
