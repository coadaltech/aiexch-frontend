"use client";
import { Button } from "@/components/ui/button";
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

const CARD_CLS = "rounded-2xl border border-gray-200 bg-white shadow-sm";

export default function PromoCodePage() {
  const [promoInput, setPromoInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemStatus, setRedeemStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: promocodes = [], isLoading } = usePromocodes();

  const redeemMutation = useMutation({
    mutationFn: (code: string) => userApi.redeemPromocode(code),
    onSuccess: (response) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "expired":
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "used":
        return "text-gray-600 bg-gray-100 border-gray-200";
      default:
        return "text-gray-500 bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className="w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="shrink-0 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900 sm:h-10 sm:w-10">
          <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">
          Promo Codes
        </h1>
      </div>

      {/* ── Redeem Section ── */}
      <div className={`${CARD_CLS} p-4 sm:p-6`}>
        <div className="mb-4 flex items-center gap-3">
          <Tag className="h-6 w-6 text-[var(--header-primary)]" />
          <h2 className="text-lg font-semibold text-gray-900">Redeem Promo Code</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Enter promo code..."
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--header-primary)] focus:outline-none sm:text-base"
            />
            <Button
              onClick={handleRedeemCode}
              disabled={!promoInput.trim() || redeemMutation.isPending}
              className="bg-[var(--header-primary)] text-white hover:bg-[var(--header-primary)]/90 disabled:opacity-50"
            >
              {redeemMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Redeem"
              )}
            </Button>
          </div>

          {redeemStatus === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              Promo code redeemed successfully!
            </div>
          )}

          {redeemStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-rose-600">
              <Clock className="h-4 w-4" />
              {errorMessage || "Invalid or expired promo code"}
            </div>
          )}
        </div>
      </div>

      {/* ── Available Promo Codes ── */}
      <div className="min-w-0">
        <h2 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
          Available Promo Codes
        </h2>

        {promocodes.length === 0 ? (
          <div className={`${CARD_CLS} p-6 text-center sm:p-8`}>
            <Tag className="mx-auto mb-4 h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            <p className="text-sm text-gray-500 sm:text-base">No promocodes available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {promocodes.map((promo: PromoCode) => (
              <div
                key={promo.id}
                className={`${CARD_CLS} p-4 transition-all duration-300 hover:border-[var(--header-primary)]/50 sm:p-6`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--header-primary)]/10">
                          <span className="text-sm font-bold">🎁</span>
                        </div>
                        <h3 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                          {promo.title}
                        </h3>
                      </div>
                      <div
                        className={`flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-semibold ${getStatusColor(
                          promo.status
                        )}`}
                      >
                        <span className="capitalize">{promo.status}</span>
                      </div>
                    </div>

                    <p className="mb-4 break-words text-xs leading-relaxed text-gray-500 sm:text-sm">
                      {promo.description}
                    </p>

                    {/* Code + Copy */}
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
                        <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                          Promo Code
                        </div>
                        <div className="font-mono text-lg font-bold tracking-wider text-[var(--header-primary)]">
                          {promo.code}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCopyCode(promo.code)}
                        variant="ghost"
                        size="sm"
                        className="rounded-xl border border-gray-300 p-3 text-[var(--header-primary)] hover:bg-[var(--header-primary)]/10 hover:text-[var(--header-primary)]"
                      >
                        {copiedCode === promo.code ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Extra Info */}
                    <div className="mb-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500">
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
                        <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500">
                          👥 Uses: {promo.usedCount || 0}/{promo.usageLimit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Content */}
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                    <div className="text-center">
                      <div className="mb-1 text-3xl font-bold text-[var(--header-primary)]">
                        ₹{promo.value}
                      </div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
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
                        className="rounded-xl bg-[var(--header-primary)] px-6 py-3 font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[var(--header-primary)]/90"
                        disabled={redeemMutation.isPending}
                      >
                        {redeemMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-2">🎯 Use Code</span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
