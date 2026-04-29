"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useMatkaTransaction, useConsolidatedJantri } from "@/hooks/useMatkaApi";

interface Props {
  open: boolean;
  onClose: () => void;
  transactionId: string | null;
}

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

export function TransactionViewModal({ open, onClose, transactionId }: Props) {
  const [consolidate, setConsolidate] = useState(false);
  const [cutConsolidate, setCutConsolidate] = useState(false);

  const { data: transaction, isLoading } = useMatkaTransaction(transactionId);

  const shiftId = transaction?.shiftId ?? null;
  const date = transaction?.transactionDate ?? null;

  const { data: consolidatedTotals = [] } = useConsolidatedJantri(
    shiftId,
    date,
    consolidate
  );

  // Build amounts map from this transaction's details: "numberType:number" → amount
  const txnAmountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!transaction?.details) return map;
    for (const d of transaction.details) {
      map[`${d.numberType}:${d.number}`] = Number(d.amount);
    }
    return map;
  }, [transaction]);

  // Build consolidated amounts map
  const consolidatedMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of consolidatedTotals) {
      map[`${t.numberType}:${t.number}`] = Number(t.totalAmount);
    }
    return map;
  }, [consolidatedTotals]);

  // The display map based on toggle state
  const displayMap = useMemo(() => {
    if (!consolidate) return txnAmountsMap;
    if (!cutConsolidate) return consolidatedMap;
    // Cut: consolidated minus this transaction
    const cut: Record<string, number> = { ...consolidatedMap };
    for (const [key, amt] of Object.entries(txnAmountsMap)) {
      const existing = cut[key] ?? 0;
      const result = existing - amt;
      if (result <= 0) delete cut[key];
      else cut[key] = result;
    }
    return cut;
  }, [consolidate, cutConsolidate, txnAmountsMap, consolidatedMap]);

  // Row totals (dara only)
  const rowTotals = useMemo(() => {
    const totals = new Array(ROWS).fill(0);
    for (const [key, val] of Object.entries(displayMap)) {
      const [type, num] = key.split(":");
      if (type === "1") totals[Math.floor((parseInt(num) - 1) / COLS)] += val;
    }
    return totals;
  }, [displayMap]);

  // Column totals (dara only)
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-2 sm:p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--header-primary)] via-[var(--header-primary)] to-[var(--header-secondary)] rounded-t-2xl px-4 py-3 flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <div className="text-white font-bold text-sm font-condensed tracking-wide">
              {transaction?.shiftName ?? "Loading..."}{" "}
              <span className="text-white/60 font-normal text-xs">
                {transaction?.transactionDate}
              </span>
            </div>
            {transaction && (
              <div className="text-white/50 text-[11px] mt-0.5">
                Rate: {transaction.daraRate} / {transaction.akharRate}
              </div>
            )}
          </div>

          {/* Toggle switches */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <div
                onClick={() => {
                  setConsolidate((v) => {
                    if (v) setCutConsolidate(false);
                    return !v;
                  });
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  consolidate ? "bg-green-500" : "bg-white/30"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    consolidate ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-white text-[11px] font-medium whitespace-nowrap">
                Consolidate Jantri
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <div
                onClick={() => {
                  if (!consolidate) return;
                  setCutConsolidate((v) => !v);
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  cutConsolidate && consolidate
                    ? "bg-green-500"
                    : "bg-white/30"
                } ${!consolidate ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    cutConsolidate && consolidate
                      ? "translate-x-4"
                      : "translate-x-0.5"
                  }`}
                />
              </div>
              <span
                className={`text-white text-[11px] font-medium whitespace-nowrap ${
                  !consolidate ? "opacity-40" : ""
                }`}
              >
                Cut Consolidate Jantri
              </span>
            </label>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--header-secondary)]" />
            </div>
          ) : !transaction ? (
            <div className="text-center py-20 text-gray-400">
              Transaction not found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-300">
              <table className="w-full border-collapse text-xs table-fixed min-w-[500px]">
                <thead>
                  <tr>
                    {Array.from({ length: COLS }, (_, i) => (
                      <th
                        key={i}
                        className="bg-gradient-to-b from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] text-center py-1.5 px-1 font-bold border border-[#1e4088]"
                      >
                        {i + 1}
                      </th>
                    ))}
                    <th className="bg-gradient-to-b from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] text-center py-1.5 px-1 font-bold border border-[#1e4088]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Main 10×10 grid */}
                  {MAIN_GRID.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {row.map((num) => {
                        const key = `1:${num}`;
                        const val = displayMap[key] ?? 0;
                        return (
                          <td
                            key={num}
                            className="border border-gray-300 p-0 relative h-9"
                          >
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
                      <td className="border border-gray-300 bg-[#e8edf5] text-[var(--header-primary)] text-center text-xs font-bold px-1 py-1.5">
                        {rowTotals[rowIdx] || 0}
                      </td>
                    </tr>
                  ))}

                  {/* Column totals row */}
                  <tr>
                    {colTotals.map((t, i) => (
                      <td
                        key={i}
                        className="border border-gray-300 bg-[#e8edf5] text-[var(--header-primary)] text-center font-bold py-1 text-xs"
                      >
                        {t}
                      </td>
                    ))}
                    <td className="border border-gray-300 bg-[var(--header-primary)] text-[var(--header-text)] text-center font-bold py-1 text-xs">
                      {grandTotal}
                    </td>
                  </tr>

                  {/* B row (Bahar Akhar) */}
                  <tr className="bg-[#eef7ff]">
                    {B_LABELS.map((d) => {
                      const numStr = bLabelToNum(d);
                      const key = numStr ? `2:${numStr}` : null;
                      const val = key ? (displayMap[key] ?? 0) : 0;
                      return (
                        <td
                          key={`B${d}`}
                          className="border border-gray-300 p-0 relative h-9"
                        >
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
                            <div className="pt-3 pb-1 text-center text-gray-300 text-xs">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 bg-[#e8edf5] text-[var(--header-primary)] text-center text-xs font-bold px-1 py-1.5">
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
                      const val = key ? (displayMap[key] ?? 0) : 0;
                      return (
                        <td
                          key={`A${d}`}
                          className="border border-gray-300 p-0 relative h-9"
                        >
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
                            <div className="pt-3 pb-1 text-center text-gray-300 text-xs">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 bg-[#e8edf5] text-[var(--header-primary)] text-center text-xs font-bold px-1 py-1.5">
                      {A_LABELS.reduce((s, d) => {
                        const n = aLabelToNum(d);
                        return s + (n ? displayMap[`3:${n}`] ?? 0 : 0);
                      }, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
