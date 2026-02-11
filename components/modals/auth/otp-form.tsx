"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";

interface OtpFormProps {
  email: string;
  otp: string;
  onOtpChange: (otp: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isLoading: boolean;
  onBack?: () => void;
}

export function OtpForm({
  email,
  otp,
  onOtpChange,
  onSubmit,
  error,
  isLoading,
  onBack,
}: OtpFormProps) {
  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:drop-shadow-[0_0_8px_rgba(255,216,92,0.5)] transition-all mb-4 text-sm font-medium focus:outline-none focus-visible:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </button>
      )}
      <h2 className="text-2xl font-bold text-foreground mb-4">Verify Email</h2>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 backdrop-blur-sm">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="text-center">
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          We've sent a verification code to {email}
        </p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => onOtpChange(e.target.value)}
              className="h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2 text-center text-2xl tracking-widest font-semibold"
              maxLength={6}
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            isLoading={isLoading}
            className="w-full h-12 bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md cursor-pointer transition-all font-semibold"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Verify Email
          </Button>
        </form>
      </div>
    </div>
  );
}