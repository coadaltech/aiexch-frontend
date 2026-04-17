"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trophy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useOwnerMatkaShifts,
  useMatkaLivePrediction,
  useMatkaLivePredictionWhitelabels,
  useDeclareMatkaResult,
  useMatkaDeclaredHistory,
  type LivePredictionWhitelabelRow,
} from "@/hooks/useOwner";
import { useAuth } from "@/contexts/AuthContext";
import { JantriGridModal } from "./jantri-modal";

const fmt = (v: string | number) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(0);
};


const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function OwnerLivePredictionPage() {
  const { user: currentUser } = useAuth();
  const isOwner = String(currentUser?.role ?? "").toLowerCase() === "owner";

  const { data: shifts = [], isLoading: shiftsLoading } =
    useOwnerMatkaShifts();
  const [shiftId, setShiftId] = useState<string>("");

  useEffect(() => {
    if (!shiftId && shifts.length > 0) setShiftId(shifts[0].id);
  }, [shifts, shiftId]);

  const selectedShift = useMemo(
    () => shifts.find((s: any) => s.id === shiftId),
    [shifts, shiftId]
  );

  const { data: livePrediction, isLoading: gridLoading } =
    useMatkaLivePrediction(shiftId || null);
  const numbers = livePrediction?.numbers ?? [];
  const meta = livePrediction?.meta;

  // Sort numbers by P/L descending (biggest profit first, biggest loss last).
  const sortedNumbers = useMemo(
    () => [...numbers].sort((a, b) => Number(b.profit) - Number(a.profit)),
    [numbers]
  );

  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const { data: whitelabels = [], isLoading: wlLoading } =
    useMatkaLivePredictionWhitelabels(shiftId || null, selectedNum);

  const [resultInput, setResultInput] = useState("");
  const declareMutation = useDeclareMatkaResult();
  const { data: declaredHistory = [] } = useMatkaDeclaredHistory(50);

  const handleDeclare = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(resultInput, 10);
    if (!shiftId || isNaN(n) || n < 0 || n > 100) return;
    declareMutation.mutate(
      { shiftId, result: n },
      { onSuccess: () => setResultInput("") }
    );
  };

  const [jantriOpen, setJantriOpen] = useState(false);
  const [selectedWl, setSelectedWl] =
    useState<LivePredictionWhitelabelRow | null>(null);

  const selectedRow = selectedNum
    ? numbers.find((n) => n.nums === selectedNum)
    : undefined;
  const summaryProfit = selectedRow?.profit ?? "0";
  const summaryLabel = selectedRow
    ? String(selectedRow.nums)
    : selectedNum != null
    ? String(selectedNum)
    : null;

  return (
    <div className="space-y-3">
      {/* ─── Top bar: title + shift + date + search ─── */}
      <div className="bg-card border border-border rounded-lg px-3 py-2 flex flex-wrap items-center gap-3">
        <h1 className="text-base font-bold text-foreground mr-auto">
          Live Prediction
        </h1>

        <div className="flex items-center gap-1">
          <label className="text-xs text-muted-foreground">Shift</label>
          <select
            value={shiftId}
            onChange={(e) => {
              setShiftId(e.target.value);
              setSelectedNum(null);
              setSelectedWl(null);
            }}
            className="border border-border bg-card text-foreground rounded px-2 py-1 text-xs min-w-[140px] focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={shiftsLoading}
          >
            {shifts.length === 0 ? (
              <option value="">No shifts</option>
            ) : (
              shifts.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <label className="text-xs text-muted-foreground">Date</label>
          <input
            type="text"
            readOnly
            value={fmtDate(selectedShift?.shiftDate)}
            className="border border-border bg-muted/40 text-foreground rounded px-2 py-1 text-xs w-[110px] cursor-not-allowed"
          />
        </div>

        <Button
          size="sm"
          className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Search className="h-3.5 w-3.5 mr-1" />
          Search
        </Button>
      </div>

      {/* ─── Main: numbers list + party breakdown + declare column ─── */}
      {/* Always 3 columns; Numbers and Declare have fixed widths so the
          Party column shrinks first instead of wrapping onto the next row. */}
      <div className="grid grid-cols-[260px_minmax(0,1fr)_240px] gap-2">
        {/* Numbers list */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {meta && (meta.txCount === 0 || meta.commCount === 0) && (
            <div className="text-[11px] text-amber-700 bg-amber-500/10 border-b border-amber-500/30 px-2 py-1">
              txns: <b>{meta.txCount}</b> · commission rows for this owner:{" "}
              <b>{meta.commCount}</b>
              {meta.txCount > 0 && meta.commCount === 0 &&
                " — bets exist but not attributed to this owner."}
            </div>
          )}
          {gridLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <div className="max-h-[calc(100vh-230px)] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-emerald-600 text-white z-10">
                  <tr>
                    <th className="px-2 py-1.5 font-semibold text-left w-14">
                      Result
                      <br />
                      Number
                    </th>
                    <th className="px-2 py-1.5 font-semibold text-left w-14">
                      Number
                    </th>
                    <th className="px-2 py-1.5 font-semibold text-right">
                      Sale
                    </th>
                    <th className="px-2 py-1.5 font-semibold text-right">
                      Amt P/L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNumbers.map((row) => {
                    const profit = Number(row.profit);
                    const isSelected = row.nums === selectedNum;
                    return (
                      <tr
                        key={row.nums}
                        onClick={() => setSelectedNum(row.nums)}
                        className={`cursor-pointer border-t border-border/60 hover:bg-accent/30 ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                      >
                        <td className="px-2 py-1 text-center">
                          <span className="inline-flex items-center justify-center min-w-[26px] h-5 rounded bg-emerald-500/15 text-emerald-700 font-semibold">
                            {row.declared_count ?? 0}
                          </span>
                        </td>
                        <td className="px-2 py-1 font-semibold text-foreground">
                          {row.nums}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-foreground">
                          {fmt(row.sale)}
                        </td>
                        <td
                          className={`px-2 py-1 text-right tabular-nums font-semibold ${
                            profit >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {profit >= 0 ? "" : "-"}
                          {Math.abs(profit).toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Party breakdown */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="max-h-[calc(100vh-270px)] overflow-y-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-emerald-600 text-white z-10">
                <tr>
                  <th className="px-1.5 py-1.5 w-7"></th>
                  <th className="px-2 py-1.5 font-semibold text-left">Party</th>
                  <th className="px-2 py-1.5 font-semibold text-right w-20">
                    Sale
                  </th>
                  <th className="px-2 py-1.5 font-semibold text-right w-20">
                    P&amp;L
                  </th>
                  <th className="px-2 py-1.5 font-semibold text-center w-16">
                    Last Win
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedNum == null ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      Select a number on the left to see the party breakdown.
                    </td>
                  </tr>
                ) : wlLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center">
                      <span className="inline-flex items-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading…
                      </span>
                    </td>
                  </tr>
                ) : whitelabels.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      No bets placed on this number.
                    </td>
                  </tr>
                ) : (
                  whitelabels.map((wl) => {
                    const profit = Number(wl.profit);
                    const isSel = selectedWl?.whitelabelId === wl.whitelabelId;
                    return (
                      <tr
                        key={wl.whitelabelId ?? "null"}
                        onClick={() => setSelectedWl(wl)}
                        className={`cursor-pointer border-t border-border/60 hover:bg-accent/30 ${
                          isSel ? "bg-primary/10" : ""
                        }`}
                      >
                        <td className="px-1.5 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() =>
                              setSelectedWl(isSel ? null : wl)
                            }
                            className="accent-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-2 py-1 font-medium text-foreground truncate max-w-0 uppercase">
                          {wl.whitelabelName}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-foreground">
                          {fmt(wl.sale)}
                        </td>
                        <td
                          className={`px-2 py-1 text-right tabular-nums font-semibold ${
                            profit >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {profit >= 0 ? "" : "-"}
                          {Math.abs(profit).toFixed(0)}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[36px] px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              wl.lastWinStatus === "W"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : "bg-rose-500/15 text-rose-700"
                            }`}
                          >
                            {wl.lastWinStatus}
                            {wl.consecutiveCount || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom bar: selected-number summary + Jantri button */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 py-2">
            <div className="text-xs">
              {selectedNum != null ? (
                <>
                  <span className="text-muted-foreground">Number:</span>{" "}
                  <span className="font-bold text-foreground">
                    {summaryLabel}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-muted-foreground">Profit:</span>{" "}
                  <span
                    className={`font-bold ${
                      Number(summaryProfit) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {fmt(summaryProfit)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Select a number to see summary
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => setJantriOpen(true)}
              disabled={!shiftId}
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Jantri
            </Button>
          </div>
        </div>

        {/* Right column: (owner-only) Declare panel, then Previous Declared list */}
        <div className="flex flex-col gap-3">
          {isOwner && (
            <div className="bg-card border border-border rounded-lg p-3">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Declare Result
              </h3>
              <form onSubmit={handleDeclare} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Winning Number (0–100)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={resultInput}
                    onChange={(e) => setResultInput(e.target.value)}
                    placeholder="Enter number"
                    className="h-8 text-center font-bold"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    !shiftId || !resultInput || declareMutation.isPending
                  }
                  className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {declareMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  )}
                  Declare
                </Button>
              </form>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden flex-1">
            <div className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold">
              Previous Declared Numbers
            </div>
            <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/70 backdrop-blur">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-2 py-1 font-semibold">Date</th>
                    <th className="px-2 py-1 font-semibold text-right">
                      Number
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {declaredHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-2 py-5 text-center text-muted-foreground"
                      >
                        No previous declarations.
                      </td>
                    </tr>
                  ) : (
                    declaredHistory.map((h) => (
                      <tr key={h.id} className="border-t border-border/60">
                        <td className="px-2 py-1 text-foreground">
                          {new Date(h.declared_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-2 py-1 text-right font-semibold text-foreground">
                          {h.runs}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <JantriGridModal
        open={jantriOpen}
        onClose={() => setJantriOpen(false)}
        shiftId={shiftId || null}
        whitelabelId={selectedWl?.whitelabelId ?? "all"}
        whitelabelName={selectedWl?.whitelabelName ?? "All"}
      />
    </div>
  );
}
