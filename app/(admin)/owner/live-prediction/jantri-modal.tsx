"use client";

import { X, Loader2 } from "lucide-react";
import { useMatkaLivePredictionJantri } from "@/hooks/useOwner";

interface Props {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
  whitelabelId: string | null; // "all" or a party uuid
  whitelabelName?: string;
}

type JantriCell = { nums: number; num_type: 1 | 2 | 3; sale: string };

export function JantriGridModal({
  open,
  onClose,
  shiftId,
  whitelabelId,
  whitelabelName,
}: Props) {
  const { data: rows = [], isLoading } = useMatkaLivePredictionJantri(
    shiftId,
    whitelabelId,
    open
  );

  if (!open) return null;

  const byNumType = new Map<string, string>();
  for (const r of rows as JantriCell[]) {
    byNumType.set(`${r.num_type}:${r.nums}`, r.sale);
  }

  // Dara 10x10
  const daraGrid: number[][] = [];
  for (let r = 0; r < 10; r++) {
    const row: number[] = [];
    for (let c = 0; c < 10; c++) row.push(r * 10 + c + 1);
    daraGrid.push(row);
  }
  // Bahar (B1..B9 → 111, 222, …, 999) and Ander (A1..A9 → 1111, 2222, …, 9999)
  const baharRow = Array.from({ length: 9 }, (_, i) => (i + 1) * 111);
  const anderRow = Array.from({ length: 9 }, (_, i) => (i + 1) * 1111);

  const cell = (label: string, n: number, numType: 1 | 2 | 3) => {
    const sale = Number(byNumType.get(`${numType}:${n}`) ?? 0);
    const has = sale > 0;
    return (
      <div
        key={`${numType}:${n}`}
        className={`flex flex-col items-center justify-center rounded border text-center py-1 ${
          has
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : "bg-muted/30 border-border text-muted-foreground"
        }`}
      >
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-[10px]">{has ? sale.toFixed(0) : "-"}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">
            Jantri — {whitelabelName ?? "All"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading jantri…
            </div>
          ) : (
            <>
              {/* Dara 1-100 grid */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Dara (1–100)
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {daraGrid.flat().map((n) => cell(String(n), n, 1))}
                </div>
              </div>

              {/* Bahar 111..999 */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Bahar
                </div>
                <div className="grid grid-cols-9 gap-1">
                  {baharRow.map((n) => cell(String(n), n, 2))}
                </div>
              </div>

              {/* Ander 1111..9999 */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Ander
                </div>
                <div className="grid grid-cols-9 gap-1">
                  {anderRow.map((n) => cell(String(n), n, 3))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
