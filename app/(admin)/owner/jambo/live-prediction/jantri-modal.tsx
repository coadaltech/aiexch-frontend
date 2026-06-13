"use client";

import { useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { useJamboLivePredictionJantri } from "@/hooks/useOwner";

interface Props {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
  partyId: string | null;
  partyName?: string;
}

type JantriCell = { nums: number; sale: string };

const COLS = 10;
const ROWS = 100; // 1..1000 laid out in 10 columns

export function JamboJantriGridModal({
  open,
  onClose,
  shiftId,
  partyId,
  partyName,
}: Props) {
  const { data: rows = [], isLoading } = useJamboLivePredictionJantri(
    shiftId,
    partyId,
    open
  );

  const saleByNum = useMemo(() => {
    const m = new Map<number, number>();
    for (const r of rows as JantriCell[]) {
      m.set(Number(r.nums), Number(r.sale) || 0);
    }
    return m;
  }, [rows]);

  // Only render rows (groups of 10) that actually carry a sale, so the modal
  // stays usable instead of scrolling through ~100 empty rows. Always keep at
  // least the first chunk so an empty jantri still shows something.
  const grid = useMemo(() => {
    const out: { rowStart: number; cells: { n: number; sale: number }[]; rowTotal: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      const cells: { n: number; sale: number }[] = [];
      let rowTotal = 0;
      for (let c = 0; c < COLS; c++) {
        const n = r * COLS + c + 1;
        const sale = saleByNum.get(n) ?? 0;
        cells.push({ n, sale });
        rowTotal += sale;
      }
      out.push({ rowStart: r * COLS + 1, cells, rowTotal });
    }
    return out;
  }, [saleByNum]);

  const visibleRows = useMemo(() => {
    const withSale = grid.filter((g) => g.rowTotal > 0);
    return withSale.length > 0 ? withSale : grid.slice(0, 10);
  }, [grid]);

  const grandTotal = useMemo(
    () => grid.reduce((s, g) => s + g.rowTotal, 0),
    [grid]
  );

  if (!open) return null;

  const renderCell = (n: number, sale: number) => {
    const hasSale = sale > 0;
    return (
      <td
        key={n}
        className={`border border-gray-300 h-[40px] relative ${
          hasSale ? "bg-amber-400/80" : "bg-white"
        }`}
      >
        <span className="absolute top-[2px] left-[3px] text-[11px] font-semibold bg-amber-400 text-amber-900 rounded px-[3px] leading-[14px]">
          {n}
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
            {partyName ?? "All"} — Jantri (1-1000)
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white ml-3">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading jantri…
            </div>
          ) : (
            <table className="w-full min-w-[680px] border-collapse table-fixed">
              <thead>
                <tr>
                  {Array.from({ length: COLS }, (_, i) => (
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
                {visibleRows.map((g) => (
                  <tr key={g.rowStart}>
                    {g.cells.map((c) => renderCell(c.n, c.sale))}
                    <td className="px-1 py-2 text-center text-sm font-bold border border-gray-300 bg-gray-50 text-gray-800">
                      {g.rowTotal > 0 ? g.rowTotal.toFixed(0) : ""}
                    </td>
                  </tr>
                ))}

                {/* Grand Total */}
                <tr>
                  <td
                    colSpan={COLS}
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
