"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegister, useSendOTP } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { countries } from "@/data/countries";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    referralCode: "",
    agreeTerms: false,
    agreeMarketing: false,
  });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const registerMutation = useRegister();
  const sendOTPMutation = useSendOTP();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.agreeTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }

    sendOTPMutation.mutate(
      { email: formData.email, type: "registration" },
      {
        onSuccess: () => setStep("otp"),
        onError: (error: any) => {
          setError(error.response?.data?.message || "Failed to send OTP");
        },
      }
    );
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
          router.push("/login");
        },
        onError: (error: any) => {
          setError(error.response?.data?.message || "Registration failed");
        },
      }
    );
  };

  if (step === "otp") {
    return (
      <Card className="h-full lg:h-auto p-6 lg:p-8 border-0 lg:border lg:border-border/50 shadow-none lg:shadow-xl rounded-none lg:rounded-lg overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verify Email
          </h1>
          <p className="text-muted-foreground">
            Enter the OTP sent to {formData.email}
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-5">
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

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full h-11 text-base"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Verifying..." : "Verify & Sign Up"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={() => setStep("form")}
          >
            Back
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="h-full lg:h-auto p-6 lg:p-8 border-0 lg:border lg:border-border/50 shadow-none lg:shadow-xl rounded-none lg:rounded-lg overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create Account
        </h1>
        <p className="text-muted-foreground">Sign up to get started</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="h-12"
          required
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="h-12 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        <Input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="h-12"
          required
        />

        <Select
          value={formData.country}
          onValueChange={(value) =>
            setFormData({ ...formData, country: value })
          }
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="h-12"
          required
        />

        <Input
          type="text"
          placeholder="Enter Referral / Promo Code (Optional)"
          value={formData.referralCode || ""}
          onChange={(e) =>
            setFormData({ ...formData, referralCode: e.target.value })
          }
          className="h-12"
        />

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={formData.agreeTerms}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreeTerms: checked as boolean })
              }
              className="mt-1"
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-relaxed"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary font-medium hover:underline"
              >
                User Agreement
              </Link>{" "}
              & confirm I am at least 18 years old
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="marketing"
              checked={formData.agreeMarketing}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreeMarketing: checked as boolean })
              }
              className="mt-1"
            />
            <label
              htmlFor="marketing"
              className="text-sm text-muted-foreground leading-relaxed"
            >
              I agree to receive marketing promotions.
            </label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12"
          disabled={sendOTPMutation.isPending}
        >
          {sendOTPMutation.isPending ? "Sending OTP..." : "Sign Up"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
