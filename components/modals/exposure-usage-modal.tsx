"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ChevronRight, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useExposureUsage,
  useExposureMarketDetail,
  useExposureShiftDetail,
  type ExposureUsageRow,
} from "@/hooks/useUserQueries";
import { formatBalance } from "@/lib/format-balance";
import { formatLocalDateTime } from "@/lib/date-utils";

type Selection =
  | { kind: "market"; marketId: string | number; eventLabel: string; marketLabel: string; amount: number }
  | { kind: "shift"; shiftId: string; eventLabel: string; marketLabel: string; amount: number };

function rowLabels(row: ExposureUsageRow) {
  if (row.intFlag === 1) {
    return {
      eventLabel: row.shiftName || "Matka Shift",
      marketLabel: "Matka",
    };
  }
  return {
    eventLabel: row.eventName || "—",
    marketLabel: row.marketName || "—",
  };
}

function rowToSelection(row: ExposureUsageRow): Selection | null {
  const { eventLabel, marketLabel } = rowLabels(row);
  const amount = Math.abs(parseFloat(row.limitUse || "0"));
  if (row.intFlag === 1 && row.shiftId) {
    return { kind: "shift", shiftId: row.shiftId, eventLabel, marketLabel, amount };
  }
  if (row.intFlag === 0 && row.marketId != null) {
    return { kind: "market", marketId: row.marketId, eventLabel, marketLabel, amount };
  }
  return null;
}

function fmt(n: any) {
  const v = parseFloat(n ?? "0");
  return isNaN(v)
    ? "0.00"
    : v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ExposureUsageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const { data: rows = [], isLoading, isError } = useExposureUsage(open && !selected);

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="bg-card border max-h-[90vh] overflow-hidden max-w-3xl w-[95vw] sm:w-full p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-foreground text-base sm:text-lg font-semibold flex items-center gap-2">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />
            {selected
              ? `${selected.eventLabel} — ${selected.marketLabel}`
              : "Exposure Usage"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!selected ? (
            <ExposureList
              rows={rows}
              isLoading={isLoading}
              isError={isError}
              onSelect={(s) => setSelected(s)}
            />
          ) : selected.kind === "market" ? (
            <MarketDetail selection={selected} />
          ) : (
            <ShiftJantri selection={selected} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── List of exposure rows ──────────────────────────────────────────────────
function ExposureList({
  rows,
  isLoading,
  isError,
  onSelect,
}: {
  rows: ExposureUsageRow[];
  isLoading: boolean;
  isError: boolean;
  onSelect: (s: Selection) => void;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 m-2 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-rose-200 shadow-sm p-6 m-2 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <p className="text-gray-800 font-semibold">Could not load exposure</p>
        <p className="text-gray-500 text-sm mt-1">Please try again in a moment.</p>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 m-2 text-center">
        <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">No active exposure</p>
        <p className="text-gray-400 text-sm mt-1">
          Place a bet to see your exposure usage here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="sm:hidden space-y-2 p-2">
        {rows.map((row, i) => {
          const sel = rowToSelection(row);
          const { eventLabel, marketLabel } = rowLabels(row);
          const amt = Math.abs(parseFloat(row.limitUse || "0"));
          return (
            <button
              type="button"
              disabled={!sel}
              onClick={() => sel && onSelect(sel)}
              key={`${row.marketId ?? row.shiftId ?? i}`}
              className="w-full text-left bg-white rounded-lg border border-gray-200 shadow-sm p-3 hover:bg-blue-50/40 disabled:hover:bg-white transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Event</p>
                  <p className="text-sm font-bold text-gray-900 break-words">{eventLabel}</p>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mt-2">Market</p>
                  <p className="text-sm font-medium text-gray-700 break-words">{marketLabel}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Exposure</p>
                  <p className="text-base font-bold text-rose-600">₹{formatBalance(String(amt)).inr}</p>
                  {sel && <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop / tablet: table */}
      <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto m-2">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#142969] text-white text-[13px] font-bold uppercase tracking-wide">
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Event</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Market</th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap">Exposure</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const sel = rowToSelection(row);
              const { eventLabel, marketLabel } = rowLabels(row);
              const amt = Math.abs(parseFloat(row.limitUse || "0"));
              const zebra = i % 2 === 0 ? "bg-white" : "bg-gray-50";
              return (
                <tr
                  key={`${row.marketId ?? row.shiftId ?? i}`}
                  onClick={() => sel && onSelect(sel)}
                  className={`${zebra} text-gray-800 border-t border-gray-100 hover:bg-blue-50/40 transition-colors ${sel ? "cursor-pointer" : ""}`}
                >
                  <td className="px-3 py-2.5 text-[14px] font-bold align-top">
                    <span className="block break-words">{eventLabel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[14px] font-medium text-gray-700 align-top">
                    <span className="block break-words">{marketLabel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[14px] font-bold text-right text-rose-600 whitespace-nowrap align-top">
                    ₹{formatBalance(String(amt)).inr}
                  </td>
                  <td className="pr-2 text-gray-400">
                    {sel && <ChevronRight className="w-4 h-4" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Sports market drill-down: list of user's matched bets ──────────────────
function MarketDetail({ selection }: { selection: Extract<Selection, { kind: "market" }> }) {
  const { data, isLoading, isError } = useExposureMarketDetail(selection.marketId);

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <p className="text-gray-700 font-medium">Could not load bet details</p>
      </div>
    );
  }

  const { market, bets, summary } = data;

  return (
    <div className="p-2 sm:p-3 space-y-3">
      <div className="bg-white border border-gray-200 rounded-lg p-3 text-[13px] flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <span className="text-gray-500">Sport:</span>{" "}
          <span className="font-semibold text-gray-800">{market?.sportName ?? "—"}</span>
        </div>
        <div>
          <span className="text-gray-500">Competition:</span>{" "}
          <span className="font-semibold text-gray-800">{market?.competitionName ?? "—"}</span>
        </div>
        <div>
          <span className="text-gray-500">Market Type:</span>{" "}
          <span className="font-semibold text-gray-800 capitalize">{market?.marketType?.replace(/_/g, " ") ?? "—"}</span>
        </div>
        <div>
          <span className="text-gray-500">Total Bets:</span>{" "}
          <span className="font-semibold text-gray-800">{summary.totalBets}</span>
        </div>
        <div>
          <span className="text-gray-500">Total Stake:</span>{" "}
          <span className="font-semibold text-gray-800">₹{fmt(summary.totalStake)}</span>
        </div>
        <div>
          <span className="text-gray-500">Exposure:</span>{" "}
          <span className="font-bold text-rose-600">₹{fmt(selection.amount)}</span>
        </div>
      </div>

      {bets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
          No active bets on this market.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-[11px] uppercase border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold">Nation</th>
                <th className="px-3 py-2 text-right font-semibold">Rate</th>
                <th className="px-3 py-2 text-right font-semibold">Bhav</th>
                <th className="px-3 py-2 text-right font-semibold">Amount</th>
                <th className="px-3 py-2 text-right font-semibold">P/L</th>
                <th className="px-3 py-2 text-left font-semibold">Date</th>
                <th className="px-3 py-2 text-left font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((b) => {
                const isBack = Number(b.betType) === 0;
                const stake = parseFloat(b.stake ?? "0");
                const price = parseFloat(b.price ?? "0");
                const run = b.run ?? null;
                const potentialReturn = parseFloat(b.potentialReturn ?? "0");
                return (
                  <tr
                    key={b.transactionId}
                    className={`border-b border-gray-100 ${isBack ? "bg-blue-50" : "bg-pink-50"}`}
                  >
                    <td className="px-3 py-2 text-gray-800 font-medium">
                      {b.runnerName || b.selectionName || "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800">{price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {run != null ? Number(run).toFixed(0) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(stake)}</td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${
                        potentialReturn > 0 ? "text-emerald-700" : potentialReturn < 0 ? "text-rose-700" : "text-gray-700"
                      }`}
                    >
                      {fmt(potentialReturn)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {formatLocalDateTime(b.addedDate, {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {b.log?.ipAddress || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Matka / Jambo shift drill-down: consolidated jantri grid ───────────────
const COLS = 10;
const ROWS = 10;

function buildMainGrid(): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(String(r * COLS + c + 1));
    }
    grid.push(row);
  }
  return grid;
}
const MAIN_GRID = buildMainGrid();
const B_LABELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const A_LABELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const bLabelToNum = (d: number) => (d === 0 ? null : String(d).repeat(3));
const aLabelToNum = (d: number) => (d === 0 ? null : String(d).repeat(4));

function ShiftJantri({ selection }: { selection: Extract<Selection, { kind: "shift" }> }) {
  const { data, isLoading, isError } = useExposureShiftDetail(selection.shiftId);

  const displayMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of data?.totals ?? []) {
      map[`${t.numberType}:${t.number}`] = Number(t.totalAmount);
    }
    return map;
  }, [data]);

  const rowTotals = useMemo(() => {
    const totals = new Array(ROWS).fill(0);
    for (const [key, val] of Object.entries(displayMap)) {
      const [type, num] = key.split(":");
      if (type === "1") totals[Math.floor((parseInt(num) - 1) / COLS)] += val;
    }
    return totals;
  }, [displayMap]);

  const colTotals = useMemo(() => {
    const totals = new Array(COLS).fill(0);
    for (const [key, val] of Object.entries(displayMap)) {
      const [type, num] = key.split(":");
      if (type === "1") totals[(parseInt(num) - 1) % COLS] += val;
    }
    return totals;
  }, [displayMap]);

  const grandTotal = useMemo(
    () => Object.values(displayMap).reduce((s, v) => s + v, 0),
    [displayMap]
  );

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <p className="text-gray-700 font-medium">Could not load jantri</p>
      </div>
    );
  }

  const shift = data.shift;
  const isJambo = shift?.sportType === 1004;

  return (
    <div className="p-2 sm:p-3 space-y-3">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] rounded-lg px-3 py-2 text-white">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-sm tracking-wide">{shift?.shiftName ?? "Shift"}</span>
          <span className="text-white/60 text-xs">{shift?.shiftDate}</span>
          <span className="ml-auto text-[11px] bg-white/15 rounded px-2 py-0.5">
            {isJambo ? "Jambo" : "Matka"}
          </span>
        </div>
        <div className="text-white/70 text-[11px] mt-0.5">
          Rate: {shift?.daraRate} / {shift?.akharRate}
          {isJambo && <> / Triple {shift?.tripleRate}</>}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 text-[13px] flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <span className="text-gray-500">Transactions:</span>{" "}
          <span className="font-semibold text-gray-800">{data.summary.transactionCount}</span>
        </div>
        <div>
          <span className="text-gray-500">Total Amount:</span>{" "}
          <span className="font-semibold text-gray-800">₹{fmt(data.summary.totalAmount)}</span>
        </div>
        <div>
          <span className="text-gray-500">Commission:</span>{" "}
          <span className="font-semibold text-gray-800">₹{fmt(data.summary.totalCommission)}</span>
        </div>
        <div>
          <span className="text-gray-500">Final Amount:</span>{" "}
          <span className="font-semibold text-gray-800">₹{fmt(data.summary.finalAmount)}</span>
        </div>
        <div>
          <span className="text-gray-500">Exposure:</span>{" "}
          <span className="font-bold text-rose-600">₹{fmt(selection.amount)}</span>
        </div>
      </div>

      {isJambo ? (
        <JamboBetList totals={data.totals} />
      ) : (
        <MatkaJantriGrid displayMap={displayMap} rowTotals={rowTotals} colTotals={colTotals} grandTotal={grandTotal} />
      )}
    </div>
  );
}

function JamboBetList({ totals }: { totals: { numberType: number; number: string; totalAmount: string }[] }) {
  const sorted = [...totals]
    .filter((t) => Number(t.totalAmount) > 0)
    .sort((a, b) => {
      // Sort: numeric first (ascending), then akhar B*, then A*
      const aIsNum = /^\d+$/.test(a.number);
      const bIsNum = /^\d+$/.test(b.number);
      if (aIsNum && bIsNum) return parseInt(a.number) - parseInt(b.number);
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.number.localeCompare(b.number);
    });

  if (sorted.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
        No bets placed in this shift.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="bg-[#142969] text-white text-[11px] uppercase">
            <th className="px-3 py-2 text-left font-semibold">Number</th>
            <th className="px-3 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => (
            <tr
              key={`${t.numberType}:${t.number}`}
              className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
            >
              <td className="px-3 py-2 font-bold text-gray-900">{t.number}</td>
              <td className="px-3 py-2 text-right font-semibold text-gray-800">
                ₹{fmt(t.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatkaJantriGrid({
  displayMap,
  rowTotals,
  colTotals,
  grandTotal,
}: {
  displayMap: Record<string, number>;
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
}) {
  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-300 bg-white">
        <table className="w-full border-collapse text-xs table-fixed min-w-[500px]">
          <thead>
            <tr>
              {Array.from({ length: COLS }, (_, i) => (
                <th
                  key={i}
                  className="bg-gradient-to-b from-[#142969] to-[#1a3578] text-white text-center py-1.5 px-1 font-bold border border-[#1e4088]"
                >
                  {i + 1}
                </th>
              ))}
              <th className="bg-gradient-to-b from-[#142969] to-[#1a3578] text-white text-center py-1.5 px-1 font-bold border border-[#1e4088]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {MAIN_GRID.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {row.map((num) => {
                  const key = `1:${num}`;
                  const val = displayMap[key] ?? 0;
                  return (
                    <td key={num} className="border border-gray-300 p-0 relative h-9">
                      <span className="absolute top-0.5 bg-yellow-200 p-1 left-0.5 text-black text-[9px] leading-none font-bold">
                        {num}
                      </span>
                      <div
                        className={`w-full h-full flex items-center justify-center pt-3 pb-1 text-xs font-bold ${
                          val > 0 ? "text-gray-900" : "text-gray-300"
                        }`}
                      >
                        {val > 0 ? val : ""}
                      </div>
                    </td>
                  );
                })}
                <td className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center text-xs font-bold px-1 py-1.5">
                  {rowTotals[rowIdx] || 0}
                </td>
              </tr>
            ))}

            <tr>
              {colTotals.map((t, i) => (
                <td
                  key={i}
                  className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center font-bold py-1 text-xs"
                >
                  {t}
                </td>
              ))}
              <td className="border border-gray-300 bg-[#142969] text-white text-center font-bold py-1 text-xs">
                {grandTotal}
              </td>
            </tr>

            {/* B row (Bahar Akhar) */}
            <tr className="bg-[#eef7ff]">
              {B_LABELS.map((d) => {
                const numStr = bLabelToNum(d);
                const key = numStr ? `2:${numStr}` : null;
                const val = key ? displayMap[key] ?? 0 : 0;
                return (
                  <td key={`B${d}`} className="border border-gray-300 p-0 relative h-9">
                    <span className="absolute top-0 left-0.5 text-black text-[9px] leading-none font-bold">
                      B{d}
                    </span>
                    {key ? (
                      <div
                        className={`w-full h-full flex items-center justify-center pt-3 pb-1 text-xs font-bold ${
                          val > 0 ? "text-gray-900" : "text-gray-300"
                        }`}
                      >
                        {val > 0 ? val : ""}
                      </div>
                    ) : (
                      <div className="pt-3 pb-1 text-center text-gray-300 text-xs">-</div>
                    )}
                  </td>
                );
              })}
              <td className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center text-xs font-bold px-1 py-1.5">
                {B_LABELS.reduce((s, d) => {
                  const n = bLabelToNum(d);
                  return s + (n ? displayMap[`2:${n}`] ?? 0 : 0);
                }, 0)}
              </td>
            </tr>

            {/* A row (Ander Akhar) */}
            <tr className="bg-[#f5eeff]">
              {A_LABELS.map((d) => {
                const numStr = aLabelToNum(d);
                const key = numStr ? `3:${numStr}` : null;
                const val = key ? displayMap[key] ?? 0 : 0;
                return (
                  <td key={`A${d}`} className="border border-gray-300 p-0 relative h-9">
                    <span className="absolute top-0 left-0.5 text-black text-[9px] leading-none font-bold">
                      A{d}
                    </span>
                    {key ? (
                      <div
                        className={`w-full h-full flex items-center justify-center pt-3 pb-1 text-xs font-bold ${
                          val > 0 ? "text-gray-900" : "text-gray-300"
                        }`}
                      >
                        {val > 0 ? val : ""}
                      </div>
                    ) : (
                      <div className="pt-3 pb-1 text-center text-gray-300 text-xs">-</div>
                    )}
                  </td>
                );
              })}
              <td className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center text-xs font-bold px-1 py-1.5">
                {A_LABELS.reduce((s, d) => {
                  const n = aLabelToNum(d);
                  return s + (n ? displayMap[`3:${n}`] ?? 0 : 0);
                }, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
