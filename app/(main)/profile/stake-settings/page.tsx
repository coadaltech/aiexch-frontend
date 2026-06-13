"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, SlidersHorizontal, Plus, Minus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useStakeSettings, useSaveStakeSettings, DEFAULT_STAKES, StakeButton } from "@/hooks/useUserQueries";
import { useAuth } from "@/contexts/AuthContext";

const CARD_CLS = "rounded-2xl border border-gray-200 bg-white shadow-sm";

export default function StakeSettingsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { data: savedStakes, isLoading } = useStakeSettings(isLoggedIn);
  const { mutate: save, isPending: isSaving } = useSaveStakeSettings();

  const [stakes, setStakes] = useState<StakeButton[]>(DEFAULT_STAKES);

  useEffect(() => {
    if (savedStakes && savedStakes.length > 0) {
      // Pad to 9 if fewer saved
      const padded = [...savedStakes];
      while (padded.length < 9) padded.push({ label: "", value: 0 });
      setStakes(padded.slice(0, 9));
    }
  }, [savedStakes]);

  const update = (index: number, field: "label" | "value", raw: string) => {
    setStakes((prev) => {
      const next = [...prev];
      if (field === "label") {
        next[index] = { ...next[index], label: raw };
      } else {
        const n = parseInt(raw, 10);
        next[index] = { ...next[index], value: isNaN(n) ? 0 : Math.max(0, n) };
      }
      return next;
    });
  };

  const increment = (index: number) => {
    setStakes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value: next[index].value + 100 };
      return next;
    });
  };

  const decrement = (index: number) => {
    setStakes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value: Math.max(0, next[index].value - 100) };
      return next;
    });
  };

  const handleReset = () => {
    setStakes(DEFAULT_STAKES);
    toast.info("Reset to default stakes");
  };

  const handleSave = () => {
    const valid = stakes.filter((s) => s.value > 0);
    if (valid.length === 0) {
      toast.error("Please set at least one valid stake value");
      return;
    }
    save(stakes, {
      onSuccess: () => toast.success("Stake settings saved!"),
      onError: () => toast.error("Failed to save. Please try again."),
    });
  };

  if (isLoading) {
    return (
      <div className="w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6">
      {/* ── Header ── */}
      <div className="mb-2 flex items-center gap-2 sm:gap-3">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="shrink-0 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900 sm:h-10 sm:w-10">
          <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">
          Stake Settings
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="shrink-0 gap-1.5 border-gray-300 text-gray-800 hover:bg-gray-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      <p className="mb-5 ml-11 text-sm text-gray-500 sm:ml-14">
        Customise the quick-stake buttons shown in the bet panel.
      </p>

      {/* ── 3×3 grid ── */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stakes.map((stake, i) => (
          <div key={i} className={`${CARD_CLS} space-y-3 p-4`}>
            {/* Label row */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-gray-500">Button Label</span>
              <Input
                value={stake.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder={`Stake ${i + 1}`}
                className="h-8 text-sm text-gray-900 bg-white"
                maxLength={20}
              />
            </div>

            {/* Value row */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-gray-500">Input Value</span>
              <div className="flex flex-1 items-center overflow-hidden rounded-md border border-gray-300">
                <button
                  type="button"
                  onClick={() => decrement(i)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center bg-gray-100 text-gray-800 transition-colors hover:bg-gray-200"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <Input
                  type="number"
                  value={stake.value === 0 ? "" : stake.value}
                  onChange={(e) => update(i, "value", e.target.value)}
                  placeholder="0"
                  className="h-8 flex-1 rounded-none border-0 bg-white text-center text-sm text-gray-900 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                />
                <button
                  type="button"
                  onClick={() => increment(i)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center bg-gray-100 text-gray-800 transition-colors hover:bg-gray-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Preview chip */}
            {stake.label && stake.value > 0 && (
              <div className="flex justify-end">
                <span className="rounded-full bg-[var(--header-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--header-text)]">
                  Preview: {stake.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Save button ── */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="h-11 w-full gap-2 bg-[var(--header-primary)] text-sm font-semibold text-white hover:bg-[var(--header-primary)]/90"
      >
        {isSaving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
