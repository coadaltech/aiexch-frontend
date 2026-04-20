"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trophy, Search, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useOwnerMatkaShifts,
  useMatkaLivePrediction,
  useMatkaLivePredictionWhitelabels,
  useMatkaAgentSale,
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

// Returns ms-to-main-jantri (negative once reached) plus a human-readable
// countdown. A null shiftDate/mainJantriTime means the shift has no jantri
// gate — allow declare immediately (`msLeft = 0`, `display = '—'`).
function useMainJantriCountdown(
  shiftDate?: string | null,
  mainJantriTime?: string | null,
  nextDayAllow?: boolean
) {
  const [state, setState] = useState<{ msLeft: number; display: string }>({
    msLeft: 0,
    display: "—",
  });

  useEffect(() => {
    if (!shiftDate || !mainJantriTime) {
      setState({ msLeft: 0, display: "—" });
      return;
    }

    const target = (() => {
      const [h, m] = mainJantriTime.split(":").map(Number);
      const t = new Date(shiftDate);
      t.setHours(h, m, 0, 0);
      if (nextDayAllow) t.setDate(t.getDate() + 1);
      return t;
    })();

    const tick = () => {
      const ms = target.getTime() - Date.now();
      if (ms <= 0) {
        setState({ msLeft: ms, display: "Ready" });
        return;
      }
      const hrs = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setState({
        msLeft: ms,
        display:
          hrs > 0
            ? `${hrs}h ${mins}m ${secs}s`
            : mins > 0
            ? `${mins}m ${secs}s`
            : `${secs}s`,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [shiftDate, mainJantriTime, nextDayAllow]);

  return state;
}

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

  const { data: agentSales = [], isLoading: agentSaleLoading } =
    useMatkaAgentSale(shiftId || null, selectedNum);

  const [resultInput, setResultInput] = useState("");
  const declareMutation = useDeclareMatkaResult();
  const { data: declaredHistory = [] } = useMatkaDeclaredHistory(50);

  const jantri = useMainJantriCountdown(
    selectedShift?.shiftDate,
    selectedShift?.mainJantriTime,
    selectedShift?.nextDayAllow
  );
  const [earlyDeclareOpen, setEarlyDeclareOpen] = useState(false);
  const isDeclared = selectedShift?.shiftDate === "1970-01-01";

  const handleDeclare = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(resultInput, 10);
    if (!shiftId || isNaN(n) || n < 0 || n > 100) return;
    // Guard against declaring before main_jantri_time. Backend also enforces.
    if (jantri.msLeft > 0) {
      setEarlyDeclareOpen(true);
      return;
    }
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
    <div className="flex flex-col gap-3 h-[calc(100vh-80px)]">
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

        <div
          className={`flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold ${
            isDeclared
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
              : jantri.msLeft > 0
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
          }`}
          title="Time until main jantri (declare becomes available)"
        >
          <Clock className="h-3.5 w-3.5" />
          {isDeclared ? (
            <span>Declared</span>
          ) : !selectedShift?.mainJantriTime ? (
            <span>No jantri time set</span>
          ) : jantri.msLeft > 0 ? (
            <span>Main Jantri in {jantri.display}</span>
          ) : (
            <span>Main Jantri {jantri.display}</span>
          )}
        </div>

        <Button
          size="sm"
          className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Search className="h-3.5 w-3.5 mr-1" />
          Search
        </Button>
      </div>

      {/* ─── Main: numbers list + party breakdown + agent group + declare column ─── */}
      <div className="grid grid-cols-[260px_minmax(0,1fr)_220px_240px] gap-2 flex-1 min-h-0">
        {/* Numbers list */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
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
            <div className="overflow-y-auto flex-1">
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
          <div className="overflow-y-auto flex-1 min-h-0">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-emerald-600 text-white z-10">
                <tr>
                  <th className="px-2 py-1.5 font-semibold text-left">Party</th>
                  <th className="px-2 py-1.5 font-semibold text-right w-20">
                    Sale
                  </th>
                  <th className="px-2 py-1.5 font-semibold text-right w-20">
                    P&amp;L
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedNum == null ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      Select a number on the left to see the party breakdown.
                    </td>
                  </tr>
                ) : wlLoading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-10 text-center">
                      <span className="inline-flex items-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading…
                      </span>
                    </td>
                  </tr>
                ) : whitelabels.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      No bets placed on this number.
                    </td>
                  </tr>
                ) : (
                  whitelabels.map((wl) => {
                    const profit = Number(wl.profit);
                    const isSel = selectedWl?.user_id === wl.user_id;
                    return (
                      <tr
                        key={wl.user_id}
                        onClick={() => setSelectedWl(wl)}
                        className={`cursor-pointer border-t border-border/60 hover:bg-accent/30 ${
                          isSel ? "bg-primary/10" : ""
                        }`}
                      >
                        <td className="px-2 py-1 font-medium text-foreground truncate max-w-0 uppercase">
                          {wl.name}
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

        {/* Agent Group */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 min-h-0">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-emerald-600 text-white z-10">
                <tr>
                  <th className="px-2 py-1.5 font-semibold text-left">
                    Agent Groups
                  </th>
                  <th className="px-2 py-1.5 font-semibold text-right w-20">
                    Sale
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedNum == null ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      Select a number to see agent groups.
                    </td>
                  </tr>
                ) : agentSaleLoading ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-10 text-center">
                      <span className="inline-flex items-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading…
                      </span>
                    </td>
                  </tr>
                ) : agentSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      No agent sales for this number.
                    </td>
                  </tr>
                ) : (
                  agentSales.map((ag) => (
                    <tr
                      key={ag.whitelabel_id}
                      className="border-t border-border/60 hover:bg-accent/30"
                    >
                      <td className="px-2 py-1 font-medium text-foreground truncate max-w-0 uppercase">
                        {ag.name}
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums font-semibold text-foreground">
                        {fmt(ag.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                    !shiftId ||
                    !resultInput ||
                    declareMutation.isPending ||
                    isDeclared
                  }
                  className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {declareMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  )}
                  Declare
                </Button>
              </form>
              {isDeclared && (
                <p className="mt-2 text-[11px] text-amber-600">
                  Result already declared for this shift.
                </p>
              )}
              {!isDeclared && jantri.msLeft > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Declare unlocks in{" "}
                  <span className="font-semibold text-amber-600">
                    {jantri.display}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold shrink-0">
              Previous Declared Numbers
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
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
        whitelabelId="all"
        whitelabelName={selectedWl?.name ?? "All"}
      />

      {earlyDeclareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setEarlyDeclareOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-foreground">
                  Too early to declare
                </h3>
              </div>
              <button
                onClick={() => setEarlyDeclareOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-foreground">
              <p className="mb-3">
                Main jantri time for{" "}
                <span className="font-semibold">{selectedShift?.name}</span>{" "}
                hasn&apos;t arrived yet. Please wait:
              </p>
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-center">
                <div className="text-[11px] uppercase tracking-wider text-amber-700/70">
                  Time remaining
                </div>
                <div className="mt-1 text-xl font-bold tabular-nums text-amber-700">
                  {jantri.display}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border bg-muted/40 px-4 py-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEarlyDeclareOpen(false)}
                className="h-7 px-3"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
