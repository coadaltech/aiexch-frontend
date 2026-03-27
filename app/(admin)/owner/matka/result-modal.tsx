"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Trophy } from "lucide-react";
import { useSetMatkaResult } from "@/hooks/useOwner";

interface Props {
  open: boolean;
  onClose: () => void;
  shift?: any;
}

export function MatkaResultModal({ open, onClose, shift }: Props) {
  const setResultMutation = useSetMatkaResult();
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    if (shift?.result !== null && shift?.result !== undefined) {
      setResult(String(shift.result));
    } else {
      setResult("");
    }
  }, [shift, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(result, 10);
    if (isNaN(num) || num < 0 || num > 100) return;
    try {
      await setResultMutation.mutateAsync({ id: shift.id, result: num });
      onClose();
    } catch {}
  };

  if (!open || !shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Set Result
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">
              {shift.name}
            </p>
            <p className="text-muted-foreground text-sm">
              {new Date(shift.shiftDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Winning Number (0-100)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Enter result number"
              required
              className="text-center text-2xl font-bold h-14"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={setResultMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {setResultMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Set Result
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
