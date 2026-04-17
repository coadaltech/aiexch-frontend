"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Receipt, CalendarDays, X, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccountStatement, useBetDetails, useLedger } from "@/hooks/useUserQueries";

// ── Bet Log Details Modal ────────────────────────────────────────────────────
function BetLogModal({ bet, onClose }: { bet: any; onClose: () => void }) {
  const rows = [
    { label: "IP Address",      value: bet.ip_address },
    { label: "Browser",         value: [bet.browser, bet.browser_version].filter(Boolean).join(" ") },
    { label: "OS",              value: [bet.os, bet.os_version].filter(Boolean).join(" ") },
    { label: "Device Type",     value: bet.device_type },
    { label: "Device",          value: [bet.device_brand, bet.device_model].filter(Boolean).join(" ") },
    { label: "Country",         value: bet.country },
    { label: "City",            value: bet.city },
    { label: "User Agent",      value: bet.user_agent },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 bg-[#142969] rounded-t-lg">
          <p className="text-white font-semibold text-sm">Transaction Log Details</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/20 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-auto">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-2 text-[13px]">
              <span className="text-gray-500 font-semibold min-w-[100px] shrink-0">{r.label}:</span>
              <span className="text-gray-800 break-all">{r.value || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [filter, setFilter] = useState<"all" | "back" | "lay" | "deleted">("all");
  const [logBet, setLogBet] = useState<any | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Market path (like "Cricket » IPL » RR v MI » Over by Over")
  const marketPath = [row.remarks1, row.remarks2, row.remarks3]
    .filter(Boolean)
    .join(" » ")
    || row.description
    || "Settlement Details";

  const allBets: any[] = data?.bets ?? [];

  // Dedupe by transaction_id — the SQL function may return multiple rows per bet
  // due to the market_results join lacking a market_id filter.
  const uniqueBets: any[] = Object.values(
    allBets.reduce((acc: Record<string, any>, b: any) => {
      const key = b.transaction_id ?? b.id ?? Math.random().toString();
      if (!acc[key]) acc[key] = b;
      return acc;
    }, {}),
  );

  // Per-bet P&L using potential_return from the DB (pre-calculated at placement).
  // For user's selected runner:
  //   Back: potential_return = +stake*price (profit if runner wins)
  //   Lay:  potential_return = -(stake*price) (liability if runner wins)
  // If runner wins → P&L = potential_return
  // If runner loses → Back loses stake, Lay wins stake
  const betPnl = (b: any): number | null => {
    if (b.winner_id == null) return null; // pending
    const stake = parseFloat(b.stake ?? 0);
    const potentialReturn = parseFloat(b.potential_return ?? 0);
    const runnerWon = Number(b.runner_id) === Number(b.winner_id);
    if (runnerWon) return potentialReturn; // back: +profit, lay: -liability
    return Number(b.bet_type) === 0 ? -stake : stake; // back loses stake, lay wins stake
  };

  // Active bets (not deleted)
  const activeBets = uniqueBets.filter((b) => Number(b.record_status) !== 1);
  const deletedBets = uniqueBets.filter((b) => Number(b.record_status) === 1);

  const filtered =
    filter === "deleted" ? deletedBets :
    filter === "all"     ? activeBets  :
    activeBets.filter((b) => (filter === "back" ? Number(b.bet_type) === 0 : Number(b.bet_type) === 1));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedBets = filtered.filter((b: any) => selected.has(b.transaction_id));
  const statsBets    = selectedBets.length > 0 ? selectedBets : filtered;
  const statsPnl     = statsBets.reduce((s: number, b: any) => s + (betPnl(b) ?? 0), 0);

  // Game time — prefer declared_at / settled_at
  const gameTime = row.settled_at || uniqueBets[0]?.settled_at || uniqueBets[0]?.declared_at || row.voucher_date;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

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

        {/* Stats + Filter row */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
          {/* Filter tabs — All, Back, Lay, Deleted */}
          <div className="flex items-center gap-1.5">
            {(["all", "back", "lay"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[13px] font-bold px-3 py-1 rounded capitalize transition-colors ${
                  filter === f
                    ? f === "back" ? "bg-blue-300 text-gray-800"
                    : f === "lay"  ? "bg-pink-300 text-gray-800"
                    :                "bg-[#142969] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {f === "all" ? "All" : f === "back" ? "Back" : "Lay"}
              </button>
            ))}
            <button
              onClick={() => setFilter("deleted")}
              className={`text-[13px] font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                filter === "deleted"
                  ? "bg-rose-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Deleted
            </button>
          </div>

          {/* Stats — reflect selected checkboxes when any are checked */}
          <div className="flex items-center gap-4 text-[13px]">
            <span><span className="text-gray-500">Total Bets:</span> <span className="font-bold text-gray-800">{statsBets.length}</span></span>
            <span><span className="text-gray-500">P&L:</span> <span className={`font-bold ${statsPnl > 0 ? "text-emerald-700" : statsPnl < 0 ? "text-rose-700" : "text-gray-500"}`}>{statsPnl > 0 ? `+${fmt(statsPnl)}` : statsPnl < 0 ? `-${fmt(Math.abs(statsPnl))}` : "0.00"}</span></span>
          </div>
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

          {!isLoading && !isError && uniqueBets.length > 0 && filtered.length === 0 && (
            <div className="py-12 text-center">
              <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-base">
                {filter === "deleted" ? "No deleted bets found." : `No ${filter} bets found.`}
              </p>
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
                  <th className="px-3 py-2 text-left font-semibold">IP</th>
                  <th className="px-3 py-2 text-center font-semibold">Details</th>
                  <th className="px-3 py-2 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bet: any, idx: number) => {
                  const isBack = Number(bet.bet_type) === 0;
                  const stake  = parseFloat(bet.stake ?? 0);
                  const price  = parseFloat(bet.price ?? 0);
                  const run    = parseFloat(bet.run   ?? 0);

                  return (
                    <tr
                      key={bet.transaction_id ?? idx}
                      className={`border-b border-gray-200 ${isBack ? "bg-blue-200" : "bg-pink-200"}`}
                    >
                      <td className="px-3 py-2 text-gray-800 font-medium text-[12px]">
                        {bet.runner_name || "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                        {price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800">
                        {run || run === 0 ? run.toFixed(0) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                        {fmt(stake)}
                      </td>
                      {(() => {
                        const pnl = betPnl(bet);
                        return (
                          <td className={`px-3 py-2 text-right font-semibold ${pnl == null ? "text-gray-500" : pnl > 0 ? "text-emerald-700" : pnl < 0 ? "text-rose-700" : "text-gray-800"}`}>
                            {pnl == null ? "Pending" : fmt(pnl)}
                          </td>
                        );
                      })()}
                      <td className="px-3 py-2 text-gray-700 text-[12px] whitespace-nowrap">
                        {formatDate(bet.added_date)}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-[12px] whitespace-nowrap">
                        {bet.ip_address || "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => setLogBet(bet)}
                          className="p-1 rounded hover:bg-white/50 text-blue-700 transition-colors"
                          title="View log details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(bet.transaction_id)}
                          onChange={() => toggleSelect(bet.transaction_id)}
                          className="w-4 h-4 accent-[#142969] cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Log details sub-modal */}
        {logBet && <BetLogModal bet={logBet} onClose={() => setLogBet(null)} />}
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
  const { data: ledger } = useLedger();

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

        {/* Date range + Limits info */}
        <div className="px-4 pb-3 flex items-end gap-3 flex-wrap">
          {(["from", "to"] as const).map((key) => (
            <div key={key} className="w-[140px]">
              <label className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">
                {key === "from" ? "From" : "To"}
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={key === "from" ? fromDate : toDate}
                  onChange={(e) => key === "from" ? setFromDate(e.target.value) : setToDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          ))}
          {/* Limits & balance */}
          {([
            { label: "Final Limit", value: fmt(ledger?.finalLimit), cls: "text-gray-900" },
            { label: "Fix Limit",   value: fmt(ledger?.fixLimit),   cls: "text-gray-900" },
            { label: "Consumed",    value: fmt(ledger?.limitConsumed), cls: "text-gray-900" },
            { label: "Balance",     value: fmt(ledger?.userBalance), cls: parseFloat(ledger?.userBalance ?? "0") >= 0 ? "text-emerald-700" : "text-rose-700" },
          ] as const).map((item) => (
            <div key={item.label}>
              <label className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">
                {item.label}
              </label>
              <div className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg min-w-[100px]">
                <span className={`font-bold ${item.cls}`}>{item.value}</span>
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
