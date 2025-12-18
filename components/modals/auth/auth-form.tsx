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
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
        className="h-12"
        required
      />

      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            onFormChange({ ...formData, password: e.target.value })
          }
          className="h-12 pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Forgot your password?
          </button>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || (mode === "signin" && !captchaValid)}
        isLoading={isLoading}
        className="w-full h-12"
      >
        {mode === "signin" ? "Sign In" : "Sign Up"}
      </Button>
    </form>
  );
}
