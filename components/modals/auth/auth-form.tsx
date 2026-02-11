"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthFormData } from "@/types";
import { Captcha } from "./captcha";
import { SignupForm } from "./signup-form";

interface AuthFormProps {
  mode: "signin" | "signup";
  formData: AuthFormData;
  onFormChange: (data: AuthFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isLoading: boolean;
  onForgotPassword: () => void;
}

export function AuthForm({
  mode,
  formData,
  onFormChange,
  onSubmit,
  error,
  isLoading,
  onForgotPassword,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-1">
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
          className="h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2"
          required
        />
      </div>

      <div className="relative space-y-1">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            onFormChange({ ...formData, password: e.target.value })
          }
          className="h-12 pr-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2"
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-1 cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {mode === "signup" && (
        <SignupForm formData={formData} onFormChange={onFormChange} />
      )}

      {mode === "signin" && <Captcha onValidate={setCaptchaValid} />}

      {mode === "signin" && (
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-muted-foreground hover:text-primary transition-all font-medium focus:outline-none focus-visible:underline cursor-pointer"
          >
            Forgot your password?
          </button>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || (mode === "signin" && !captchaValid)}
        isLoading={isLoading}
        className="w-full h-12 bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md cursor-pointer transition-all font-semibold"
      >
        {mode === "signin" ? "Sign In" : "Sign Up"}
      </Button>
    </form>
  );
}
