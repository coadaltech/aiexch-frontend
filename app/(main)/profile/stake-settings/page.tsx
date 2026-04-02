"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, SlidersHorizontal, Plus, Minus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useStakeSettings, useSaveStakeSettings, DEFAULT_STAKES, StakeButton } from "@/hooks/useUserQueries";
import { useAuth } from "@/contexts/AuthContext";

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
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button onClick={() => router.back()} variant="ghost" size="sm" className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SlidersHorizontal className="w-5 h-5 text-primary shrink-0" />
          <h1 className="text-foreground font-bold text-base sm:text-lg truncate">Stake Settings</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="shrink-0 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      <p className="text-muted-foreground text-sm mb-5 ml-11">
        Customise the quick-stake buttons shown in the bet panel.
      </p>

      {/* 3×3 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {stakes.map((stake, i) => (
          <Card key={i} className="p-4 space-y-3">
            {/* Label row */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Button Label</span>
              <Input
                value={stake.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder={`Stake ${i + 1}`}
                className="h-8 text-sm text-foreground"
                maxLength={20}
              />
            </div>

            {/* Value row */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Input Value</span>
              <div className="flex items-center flex-1 border border-border rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => decrement(i)}
                  className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground shrink-0 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <Input
                  type="number"
                  value={stake.value === 0 ? "" : stake.value}
                  onChange={(e) => update(i, "value", e.target.value)}
                  placeholder="0"
                  className="flex-1 h-8 text-sm text-center text-foreground border-0 rounded-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                />
                <button
                  type="button"
                  onClick={() => increment(i)}
                  className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview chip */}
            {stake.label && stake.value > 0 && (
              <div className="flex justify-end">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Preview: {stake.label}
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-11 text-sm font-semibold gap-2"
      >
        {isSaving ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
