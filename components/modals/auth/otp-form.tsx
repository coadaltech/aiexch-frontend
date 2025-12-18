"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface OtpFormProps {
  email: string;
  otp: string;
  onOtpChange: (otp: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isLoading: boolean;
}

export function OtpForm({
  email,
  otp,
  onOtpChange,
  onSubmit,
  error,
  isLoading,
}: OtpFormProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">Verify Email</h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="text-center">
        <p className="text-muted-foreground text-sm mb-4">
          We've sent a verification code to {email}
        </p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => onOtpChange(e.target.value)}
            className="h-12 text-center text-2xl tracking-widest"
            maxLength={6}
            required
          />
          
          <Button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            isLoading={isLoading}
            className="w-full h-12"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Verify Email
          </Button>
        </form>
      </div>
    </div>
  );
}