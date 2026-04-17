"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Receipt, CalendarDays, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccountStatement, useBetDetails } from "@/hooks/useUserQueries";

// VoucherType: 0=Credit,1=Debit,2=Limit,3=Deposit,4=Withdraw,5=Bonus,6=Settlement
function getTypeLabel(type: number | null) {
  if (type === 3) return { label: "Deposit",    cls: "bg-emerald-100 text-emerald-700" };
  if (type === 4) return { label: "Withdraw",   cls: "bg-rose-100 text-rose-700"       };
  if (type === 5) return { label: "Bonus",      cls: "bg-amber-100 text-amber-700"     };
  if (type === 6) return { label: "Settlement", cls: "bg-violet-100 text-violet-700"   };
  if (type === 2) return { label: "Limit",      cls: "bg-indigo-100 text-indigo-700"   };
  if (type === 0) return { label: "Credit",     cls: "bg-sky-100 text-sky-700"         };
  if (type === 1) return { label: "Debit",      cls: "bg-orange-100 text-orange-700"   };
  return { label: "Other", cls: "bg-gray-100 text-gray-600" };
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatDateShort(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

function formatTime(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmt(n: any) {
  const v = parseFloat(n ?? 0);
  return isNaN(v) ? "0.00" : v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function defaultDates() {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
}

// ── Bet Details Modal ─────────────────────────────────────────────────────────
// Uses get_user_account_ledger_statement_transaction_detail(user_id, market_id, voucher_id)
function BetDetailsModal({ row, onClose }: { row: any; onClose: () => void }) {
  const marketId  = row.market_id  ? String(row.market_id)  : null;
  const voucherId = row.voucher_id ? String(row.voucher_id) : null;
  const { data, isLoading, isError } = useBetDetails(marketId, voucherId);
  const [filter, setFilter] = useState<"all" | "back" | "lay">("all");

  // Market path (like "Cricket » IPL » RR v MI » Over by Over")
  const marketPath = [row.remarks1, row.remarks2, row.remarks3]
    .filter(Boolean)
    .join(" » ")
    || row.description
    || "Settlement Details";

  const allBets: any[]     = data?.bets      ?? [];
  const marketPnl: number  = data?.marketPnl ?? 0;

  // Dedupe by transaction_id — the SQL function may return multiple rows per bet
  // due to the market_results join lacking a market_id filter.
  const uniqueBets: any[] = Object.values(
    allBets.reduce((acc: Record<string, any>, b: any) => {
      const key = b.transaction_id ?? b.id ?? Math.random().toString();
      if (!acc[key]) acc[key] = b;
      return acc;
    }, {}),
  );

  // A bet "won" when the user's selected runner is the declared winner.
  const betResult = (b: any): "won" | "lost" | "pending" => {
    if (b.winner_id == null) return "pending";
    return Number(b.runner_id) === Number(b.winner_id) ? "won" : "lost";
  };

  const backCount = uniqueBets.filter((b) => Number(b.bet_type) === 0).length;
  const layCount  = uniqueBets.filter((b) => Number(b.bet_type) === 1).length;
  const winCount  = uniqueBets.filter((b) => betResult(b) === "won").length;

  const filtered = filter === "all" ? uniqueBets
    : uniqueBets.filter((b) => (filter === "back" ? Number(b.bet_type) === 0 : Number(b.bet_type) === 1));

  // Game time — prefer declared_at / settled_at
  const gameTime = row.settled_at || uniqueBets[0]?.settled_at || uniqueBets[0]?.declared_at || row.voucher_date;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header — dark blue bar with "Details" */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#142969] rounded-t-lg shrink-0">
          <p className="text-white font-semibold text-base">Details</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/20 text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info bar — market path left, game time right */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white border-b border-gray-200 shrink-0">
          <p className="text-[13px] text-gray-800 font-medium truncate">{marketPath}</p>
          <p className="text-[12px] text-gray-500 whitespace-nowrap">
            <span className="font-semibold text-gray-700">Game Time:</span> {formatDate(gameTime)}
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 flex-wrap px-4 py-1.5 bg-gray-50 border-b border-gray-200 shrink-0 text-[13px]">
          <span><span className="text-gray-500">Total Bets:</span> <span className="font-bold text-gray-800">{uniqueBets.length}</span></span>
          <span><span className="text-gray-500">Total Back:</span> <span className="font-bold text-sky-700">{backCount}</span></span>
          <span><span className="text-gray-500">Total Lay:</span> <span className="font-bold text-pink-700">{layCount}</span></span>
          <span><span className="text-gray-500">Total Win:</span> <span className="font-bold text-emerald-700">{winCount}</span></span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          {(["all", "back", "lay"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[13px] font-bold px-3 py-1 rounded capitalize transition-colors ${
                filter === f
                  ? f === "back" ? "bg-sky-600 text-white"
                  : f === "lay"  ? "bg-pink-600 text-white"
                  :                "bg-[#142969] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {f === "all" ? "All" : f === "back" ? "Back" : "Lay"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1">

          {isLoading && (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && (isError || uniqueBets.length === 0) && (
            <div className="py-12 text-center">
              <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-base">No bet details found.</p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-[12px] uppercase border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-semibold">Nation</th>
                  <th className="px-3 py-2 text-right font-semibold">Rate</th>
                  <th className="px-3 py-2 text-right font-semibold">Bhav</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2 text-right font-semibold">Win</th>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((bet: any, idx: number) => {
                  const isBack = Number(bet.bet_type) === 0;
                  const stake  = parseFloat(bet.stake ?? 0);
                  const price  = parseFloat(bet.price ?? 0);
                  const run    = parseFloat(bet.run   ?? 0);
                  const result = betResult(bet);

                  return (
                    <tr key={bet.transaction_id ?? idx} className={isBack ? "bg-sky-50/40" : "bg-pink-50/40"}>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded w-fit ${
                            isBack ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700"
                          }`}>
                            {isBack ? "BACK" : "LAY"}
                          </span>
                          <span className="text-[12px] text-gray-700 font-medium truncate max-w-[160px]">
                            {bet.runner_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                        {price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {run || run === 0 ? run.toFixed(0) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                        {fmt(stake)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={`inline-block text-[12px] font-bold px-2 py-0.5 rounded ${
                          result === "won"  ? "bg-emerald-100 text-emerald-700" :
                          result === "lost" ? "bg-rose-100 text-rose-700"       :
                                              "bg-gray-100 text-gray-500"
                        }`}>
                          {result === "won" ? "WON" : result === "lost" ? "LOST" : "PENDING"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-[12px] whitespace-nowrap">
                        {formatDate(bet.added_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer — market-level net P&L from voucher_details */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                  <td className="px-3 py-2 text-gray-600" colSpan={3}>
                    {filtered.length} bet{filtered.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-800">
                    {fmt(filtered.reduce((s: number, b: any) => s + parseFloat(b.stake ?? 0), 0))}
                  </td>
                  <td className={`px-3 py-2 text-right ${
                    marketPnl > 0 ? "text-emerald-700" : marketPnl < 0 ? "text-rose-700" : "text-gray-500"
                  }`}>
                    {marketPnl > 0 ? `+₹${fmt(marketPnl)}` : marketPnl < 0 ? `-₹${fmt(Math.abs(marketPnl))}` : "—"}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/** A row from get_user_account_ledger_statement is a balance row (Opening/Closing)
 *  when voucher_id, voucher_type, and added_date are all null. */
function isBalanceRow(row: any) {
  return row.voucher_id == null && row.voucher_type == null && row.added_date == null;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AccountStatement() {
  const router = useRouter();
  const def = defaultDates();
  const [fromDate, setFromDate] = useState(def.from);
  const [toDate,   setToDate]   = useState(def.to);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const { data: rows, isLoading, isError } = useAccountStatement({ fromDate, toDate });

  const allRows    = rows ?? [];
  const openingRow = allRows.find(isBalanceRow);

  const openingBalance = parseFloat(openingRow?.credit ?? 0);
  const { txWithClosing } = useMemo(() => {
    // Hide Limit vouchers (voucher_type === 2) — they are internal holds.
    const visible = allRows.filter(
      (r: any) => !isBalanceRow(r) && Number(r.voucher_type) !== 2,
    );

    // Force ASC by date so the running closing balance accumulates forward.
    const sorted = [...visible].sort((a: any, b: any) => {
      const ta = new Date(a.added_date ?? a.voucher_date ?? 0).getTime();
      const tb = new Date(b.added_date ?? b.voucher_date ?? 0).getTime();
      return ta - tb;
    });

    let running = openingBalance;
    const out = sorted.map((r: any) => {
      const credit = parseFloat(r.credit ?? 0);
      const debit  = parseFloat(r.debit  ?? 0);
      running = running + credit - debit;
      return { row: r, closing: running };
    });
    return { txWithClosing: out };
  }, [allRows, openingBalance]);

  return (
    <div className="min-h-screen w-full bg-gray-50">

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
          <h1 className="text-gray-900 font-bold text-base sm:text-base">Account Statement</h1>
        </div>

        {/* Date range */}
        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          {(["from", "to"] as const).map((key) => (
            <div key={key}>
              <label className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">
                {key === "from" ? "From" : "To"}
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={key === "from" ? fromDate : toDate}
                  onChange={(e) => key === "from" ? setFromDate(e.target.value) : setToDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 pb-8 space-y-3">

        {/* Loading */}
        {isLoading && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="h-9 bg-gray-100 animate-pulse border-b border-gray-200" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 border-b border-gray-100 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Failed to load statement</p>
          </div>
        )}

        {/* Ledger table */}
        {!isLoading && !isError && (
          allRows.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">No transactions found</p>
              <p className="text-gray-400 text-base mt-1">No activity in this date range</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-[#142969] text-white text-[12px] font-bold uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Closing</th>
                      <th className="px-3 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Opening balance row */}
                    {openingRow && (
                      <tr className="bg-indigo-50">
                        <td className="px-3 py-2 text-[12px] text-indigo-400">—</td>
                        <td className="px-3 py-2 text-right text-gray-200 text-[12px]">—</td>
                        <td className="px-3 py-2 text-right text-gray-200 text-[12px]">—</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`text-sm font-bold ${openingBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {openingBalance >= 0 ? "" : "-"}₹{fmt(Math.abs(openingBalance))}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[12px] font-bold text-indigo-700 uppercase tracking-wide">Opening Balance</span>
                        </td>
                      </tr>
                    )}

                    {/* Transaction rows */}
                    {txWithClosing.map(({ row, closing }, idx: number) => {
                      const credit  = parseFloat(row.credit ?? 0);
                      const debit   = parseFloat(row.debit  ?? 0);
                      const typeCfg = getTypeLabel(row.voucher_type != null ? Number(row.voucher_type) : null);

                      // Clickable only for Settlement rows with a market_id
                      const clickable = Number(row.voucher_type) === 6 && !!row.market_id;

                      // Description: for settlement use event/market names, else description/method/ref
                      const eventParts = [row.remarks2, row.remarks3].filter(Boolean);
                      const descLabel  = eventParts.length
                        ? eventParts.join(" · ")
                        : row.description || row.remarks1 || row.remarks || row.method || typeCfg.label;

                      return (
                        <tr
                          key={`${row.voucher_id ?? idx}-${idx}`}
                          {...(clickable ? { onClick: () => setSelectedRow(row) } : {})}
                          className={clickable ? "hover:bg-violet-50 active:bg-violet-100 cursor-pointer" : ""}
                        >
                          <td className="px-3 py-2 align-top whitespace-nowrap">
                            <p className="text-[12px] font-semibold text-gray-700 leading-tight">{formatDateShort(row.added_date || row.voucher_date)}</p>
                            <p className="text-[11px] text-gray-400 leading-tight">{formatTime(row.added_date || row.voucher_date)}</p>
                          </td>
                          <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                            {credit > 0
                              ? <span className="text-sm font-bold text-emerald-600">+₹{fmt(credit)}</span>
                              : <span className="text-[12px] text-gray-200">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                            {debit > 0
                              ? <span className="text-sm font-bold text-rose-600">-₹{fmt(debit)}</span>
                              : <span className="text-[12px] text-gray-200">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                            <span className={`text-sm font-bold ${closing >= 0 ? "text-gray-800" : "text-rose-600"}`}>
                              {closing >= 0 ? "" : "-"}₹{fmt(Math.abs(closing))}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top min-w-[220px]">
                            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                              <span className={`text-[11px] font-bold px-1 py-0.5 rounded shrink-0 ${typeCfg.cls}`}>
                                {typeCfg.label}
                              </span>
                              {clickable && (
                                <span className="text-[11px] text-violet-500 font-medium shrink-0">view bets</span>
                              )}
                            </div>
                            <p className="text-[13px] text-gray-800 leading-tight capitalize line-clamp-2">{descLabel}</p>
                            {row.reference && (
                              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Ref: {row.reference}</p>
                            )}
                            {row.status !== null && row.status !== undefined && Number(row.voucher_type) !== 6 && (
                              <span className={`inline-block mt-0.5 text-[11px] font-semibold px-1 py-0.5 rounded ${
                                Number(row.status) === 1 ? "bg-emerald-100 text-emerald-700" :
                                Number(row.status) === 0 ? "bg-amber-100 text-amber-700"    :
                                                           "bg-rose-100 text-rose-700"
                              }`}>
                                {Number(row.status) === 1 ? "Approved" : Number(row.status) === 0 ? "Pending" : "Rejected"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Bet details modal — only for settlement rows */}
      {selectedRow && (
        <BetDetailsModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
}
