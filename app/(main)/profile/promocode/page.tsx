"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Tag,
  Copy,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePromocodes } from "@/hooks/useUserQueries";
import { userApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GenericProfileSkeleton } from "@/components/skeletons/profile-skeletons";
import type { PromoCode } from "@/types";

export default function PromoCodePage() {
  const [promoInput, setPromoInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemStatus, setRedeemStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: promocodes = [], isLoading, error } = usePromocodes();

  const redeemMutation = useMutation({
    mutationFn: (code: string) => userApi.redeemPromocode(code),
    onSuccess: (response) => {
      console.log("Redeem response:", response.data);
      if (response.data.success) {
        setRedeemStatus("success");
        setPromoInput("");
        queryClient.invalidateQueries({ queryKey: ["promocodes"] });
        queryClient.invalidateQueries({ queryKey: ["balance"] });
      } else {
        setRedeemStatus("error");
        setErrorMessage(response.data.message || "Failed to redeem promocode");
      }
      setTimeout(() => {
        setRedeemStatus("idle");
        setErrorMessage("");
      }, 3000);
    },
    onError: (error: any) => {
      console.error("Redeem error:", error);
      setRedeemStatus("error");
      setErrorMessage(
        error.response?.data?.message || "Failed to redeem promocode"
      );
      setTimeout(() => {
        setRedeemStatus("idle");
        setErrorMessage("");
      }, 3000);
    },
  });

  if (isLoading) {
    return <GenericProfileSkeleton />;
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleRedeemCode = () => {
    if (!promoInput.trim()) return;
    redeemMutation.mutate(promoInput);
  };

  const getPromoTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return "💰";
      case "fixed":
        return "💵";
      case "free_spins":
        return "🎰";
      default:
        return "🎁";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "expired":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "used":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <div className="max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 lg:p-0 lg:mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Promo Codes
          </h1>
        </div>

        {/* Redeem Section */}
        <Card className="mt-4 p-4 lg:p-6 mb-6 lg:mx-0">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Redeem Promo Code
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex md:flex-row flex-col gap-3">
              <input
                type="text"
                placeholder="Enter promo code..."
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <Button
                onClick={handleRedeemCode}
                disabled={!promoInput.trim() || redeemMutation.isPending}
                className="disabled:opacity-50"
              >
                {redeemMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Redeem"
                )}
              </Button>
            </div>

            {redeemStatus === "success" && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Promo code redeemed successfully!
              </div>
            )}

            {redeemStatus === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <Clock className="w-4 h-4" />
                {errorMessage || "Invalid or expired promo code"}
              </div>
            )}
          </div>
        </Card>

        {/* Available Promo Codes */}
        <div className=" lg:px-0">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Available Promo Codes
          </h2>

          {promocodes.length === 0 ? (
            <Card className="p-8 text-center">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No promocodes available</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {promocodes.map((promo: PromoCode) => (
                <Card
                  key={promo.id}
                  className="border p-6 hover:border-primary/50 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 relative">
                    {/* Left Content */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              🎁
                            </span>
                          </div>
                          <h3 className="text-foreground font-bold text-lg">
                            {promo.title}
                          </h3>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(
                            promo.status
                          )}`}
                        >
                          <span className="capitalize">{promo.status}</span>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        {promo.description}
                      </p>

                      {/* Code + Copy */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border border-primary/30 flex-1">
                          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                            Promo Code
                          </div>
                          <div className="font-mono text-primary font-bold text-lg tracking-wider">
                            {promo.code}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCopyCode(promo.code)}
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary/10 hover:text-primary border border-primary/30 rounded-xl p-3"
                        >
                          {copiedCode === promo.code ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </Button>
                      </div>

                      {/* Extra Info */}
                      <div className="flex flex-wrap gap-2 text-xs mb-4">
                        <span className="bg-muted px-3 py-2 rounded-lg text-muted-foreground border border-border">
                          📅 Expires:{" "}
                          {(() => {
                            if (!promo.validTo) return "No expiry";
                            const date = new Date(promo.validTo);
                            return isNaN(date.getTime())
                              ? promo.validTo
                              : date.toLocaleDateString();
                          })()}
                        </span>
                        {promo.usageLimit && (
                          <span className="bg-muted px-3 py-2 rounded-lg text-muted-foreground border border-border">
                            👥 Uses: {promo.usedCount || 0}/{promo.usageLimit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                      <div className="text-center">
                        <div className="text-primary font-bold text-3xl mb-1">
                          ₹{promo.value}
                        </div>
                        <div className="text-muted-foreground text-xs uppercase tracking-wide">
                          Bonus Value
                        </div>
                      </div>
                      {promo.status === "active" && (
                        <Button
                          onClick={() => {
                            setPromoInput(promo.code);
                            redeemMutation.mutate(promo.code);
                          }}
                          size="lg"
                          className="bg-gradient-to-r from-primary to-primary/80 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
                          disabled={redeemMutation.isPending}
                        >
                          {redeemMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <span className="flex items-center gap-2">
                              🎯 Use Code
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
