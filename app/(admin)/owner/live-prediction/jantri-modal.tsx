"use client";

import { useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { useMatkaLivePredictionJantri } from "@/hooks/useOwner";

interface Props {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
  whitelabelId: string | null;
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

  const byNumType = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows as JantriCell[]) {
      m.set(`${r.num_type}:${r.nums}`, Number(r.sale) || 0);
    }
    return m;
  }, [rows]);

  if (!open) return null;

  const getSale = (numType: 1 | 2 | 3, n: number) =>
    byNumType.get(`${numType}:${n}`) ?? 0;

  // Dara grid 10x10
  const daraRows: { n: number; sale: number }[][] = [];
  const daraColTotals = new Array(10).fill(0);

  for (let r = 0; r < 10; r++) {
    const cells: { n: number; sale: number }[] = [];
    for (let c = 0; c < 10; c++) {
      const n = r * 10 + c + 1;
      const sale = getSale(1, n);
      cells.push({ n, sale });
      daraColTotals[c] += sale;
    }
    daraRows.push(cells);
  }
  const daraTotal = daraColTotals.reduce((a, b) => a + b, 0);

  // Bahar B1..B9, B0 — mapped to 111..999, col 10 empty
  const baharLabels = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B0"];
  const baharData = baharLabels.map((label, i) => {
    if (i < 9) {
      const n = (i + 1) * 111;
      return { label, n, sale: getSale(2, n) };
    }
    return { label, n: 0, sale: 0 }; // B0 — no data
  });
  const baharTotal = baharData.reduce((s, c) => s + c.sale, 0);

  // Ander A1..A9, A0 — mapped to 1111..9999, col 10 empty
  const anderLabels = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A0"];
  const anderData = anderLabels.map((label, i) => {
    if (i < 9) {
      const n = (i + 1) * 1111;
      return { label, n, sale: getSale(3, n) };
    }
    return { label, n: 0, sale: 0 }; // A0 — no data
  });
  const anderTotal = anderData.reduce((s, c) => s + c.sale, 0);

  const grandTotal = daraTotal + baharTotal + anderTotal;

  const renderDaraCell = (n: number, sale: number) => {
    const hasSale = sale > 0;
    return (
      <td
        key={n}
        className={`border border-gray-300 h-[40px] relative ${
          hasSale ? "bg-amber-400/80" : "bg-white"
        }`}
      >
        {/* Position number — top-left with yellow badge */}
        <span className="absolute top-[2px] left-[3px] text-[12px] font-semibold bg-amber-400 text-amber-900 rounded px-[3px] leading-[14px]">
          {n}
        </span>
        {/* Sale amount — centered */}
        {hasSale && (
          <div className="flex items-center justify-center h-full pt-2">
            <span className="text-[13px] font-bold text-gray-900">
              {sale.toFixed(0)}
            </span>
          </div>
        )}
      </td>
    );
  };

  const renderLabelCell = (label: string, sale: number) => {
    const hasSale = sale > 0;
    return (
      <td
        key={label}
        className={`border border-gray-300 h-[40px] relative ${
          hasSale ? "bg-amber-400/80" : "bg-white"
        }`}
      >
        <span className="absolute top-[2px] left-[3px] text-[12px] font-semibold bg-amber-400 text-amber-900 rounded px-[3px] leading-[14px]">
          {label}
        </span>
        {hasSale && (
          <div className="flex items-center justify-center h-full pt-2">
            <span className="text-[13px] font-bold text-gray-900">
              {sale.toFixed(0)}
            </span>
          </div>
        )}
      </td>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[96vw] max-w-[1300px] max-h-[96vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-teal-700 text-white rounded-t-lg sticky top-0 z-10">
          <h2 className="text-sm font-bold truncate">
            {whitelabelName ?? "All"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white ml-3"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading
              jantri…
            </div>
          ) : (
            <table className="w-full border-collapse table-fixed">
              {/* Column headers */}
              <thead>
                <tr>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th
                      key={i}
                      className="py-2 font-bold text-center bg-teal-700 text-white border border-teal-800 text-sm"
                    >
                      {i + 1}
                    </th>
                  ))}
                  <th className="py-2 font-bold text-center bg-teal-700 text-white border border-teal-800 text-sm">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Dara 1-100 */}
                {daraRows.map((cells, rIdx) => {
                  const rowTotal = cells.reduce((s, c) => s + c.sale, 0);
                  return (
                    <tr key={rIdx}>
                      {cells.map((c) => renderDaraCell(c.n, c.sale))}
                      <td className="px-1 py-2 text-center text-sm font-bold border border-gray-300 bg-gray-50 text-gray-800">
                        {rowTotal > 0 ? rowTotal.toFixed(0) : ""}
                      </td>
                    </tr>
                  );
                })}

                {/* Dara column totals — right after 91-100 */}
                <tr>
                  {daraColTotals.map((ct, i) => (
                    <td
                      key={i}
                      className="px-1 py-2 text-center text-sm font-bold border border-gray-300 bg-gray-100 text-gray-800"
                    >
                      {ct > 0 ? ct.toFixed(0) : ""}
                    </td>
                  ))}
                  <td className="px-1 py-2 text-center text-sm font-bold border border-gray-300 bg-gray-100 text-gray-800">
                    {daraTotal > 0 ? daraTotal.toFixed(0) : ""}
                  </td>
                </tr>

                {/* Bahar: B1 B2 ... B9 B0 */}
                <tr>
                  {baharData.map((c) => renderLabelCell(c.label, c.sale))}
                  <td className="px-1 py-2 text-center text-sm font-bold border border-gray-300 bg-gray-50 text-gray-800">
                    {baharTotal > 0 ? baharTotal.toFixed(0) : ""}
                  </td>
                </tr>

                {/* Ander: A1 A2 ... A9 A0 */}
                <tr>
                  {anderData.map((c) => renderLabelCell(c.label, c.sale))}
                  <td className="px-1 py-2 text-center text-sm font-bold border border-gray-300 bg-gray-50 text-gray-800">
                    {anderTotal > 0 ? anderTotal.toFixed(0) : ""}
                  </td>
                </tr>

                {/* Grand Total */}
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-3 text-right font-bold bg-teal-700 text-white border border-teal-800 text-base"
                  >
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-center font-bold bg-teal-700 text-white border border-teal-800 text-base">
                    {grandTotal > 0 ? grandTotal.toFixed(0) : "0"}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
