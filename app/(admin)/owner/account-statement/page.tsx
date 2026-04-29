"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/lib/api";
import { ArrowLeft, Receipt, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { formatLocalDate, formatLocalTime } from "@/lib/date-utils";

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

function formatDateShort(d: string | null | undefined) {
  if (!d) return "—";
  return formatLocalDate(d, { day: "2-digit", month: "short", year: "2-digit" });
}

function formatTime(d: string | null | undefined) {
  if (!d) return "";
  return formatLocalTime(d, { hour: "2-digit", minute: "2-digit", hour12: true });
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

/** A row from the backend is a balance row (Opening/Closing) when
 *  voucher_id, voucher_type, and added_date are all null. */
function isBalanceRow(row: any) {
  return row.voucher_id == null && row.voucher_type == null && row.added_date == null;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OwnerAccountStatement() {
  const router  = useRouter();
  const { user } = useAuth();
  const def = defaultDates();
  const [fromDate, setFromDate] = useState(def.from);
  const [toDate,   setToDate]   = useState(def.to);

  const { data: rows, isLoading, isError } = useQuery({
    queryKey: ["owner-account-statement", fromDate, toDate],
    queryFn: () => ownerApi.getAccountStatement({ fromDate, toDate }),
    select: (res) => (res.data?.data?.transactions ?? []) as any[],
    enabled: !!fromDate && !!toDate,
  });

  const isOwner = user?.role === "owner";

  const allRows    = rows ?? [];
  const openingRow = allRows.find(isBalanceRow);

  const openingBalance =
    parseFloat(openingRow?.credit ?? 0) - parseFloat(openingRow?.debit ?? 0);
  const { txWithClosing } = useMemo(() => {
    // Hide Limit vouchers (voucher_type === 2) — internal holds.
    const visible = allRows.filter(
      (r: any) => !isBalanceRow(r) && Number(r.voucher_type) !== 2,
    );

    // Force ASC by date so the running closing accumulates forward.
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

      <div className="sticky top-14 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-gray-900 font-bold text-base sm:text-base leading-tight">Account Statement</h1>
            {isOwner && (
              <p className="text-[12px] text-indigo-500 font-semibold leading-tight">Capital Account</p>
            )}
          </div>
        </div>

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

        {isLoading && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="h-9 bg-gray-100 animate-pulse border-b border-gray-200" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 border-b border-gray-100 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Failed to load statement</p>
          </div>
        )}

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
                <table className="w-full text-sm border-collapse min-w-[820px]">
                  <thead>
                    <tr className="bg-[var(--header-primary)] text-[var(--header-text)] text-[12px] font-bold uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Closing</th>
                      <th className="px-3 py-2 text-left">Whitelabel/User</th>
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
                        <td className="px-3 py-2 text-[12px] text-indigo-400">—</td>
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

                      const eventParts = [row.remarks2, row.remarks3].filter(Boolean);
                      const baseDesc = eventParts.length
                        ? eventParts.join(" · ")
                        : row.description || row.remarks1 || row.remarks || row.method || typeCfg.label;

                      // Append settled winner (or bhav for fancy) in square brackets.
                      const rowIsFancy = Number(row.result_market_type) === 4;
                      const winnerTag  = rowIsFancy
                        ? (row.winner_runs != null ? String(row.winner_runs) : null)
                        : (row.winner_name || null);
                      const descLabel  = winnerTag ? `${baseDesc} [${winnerTag}]` : baseDesc;

                      const partyLabel = isOwner
                        ? (row.whitelabel_name || "—")
                        : (row.opposite_username || "—");

                      return (
                        <tr key={`${row.voucher_id ?? idx}-${idx}`}>
                          <td className="px-3 py-2 align-top whitespace-nowrap">
                            <p className="text-[12px] font-semibold text-gray-700 leading-tight">
                              {formatDateShort(row.added_date || row.voucher_date)}
                            </p>
                            <p className="text-[11px] text-gray-400 leading-tight">
                              {formatTime(row.added_date || row.voucher_date)}
                            </p>
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
                          <td className="px-3 py-2 align-top">
                            <span className="text-[13px] font-medium text-gray-800 break-all">{partyLabel}</span>
                          </td>
                          <td className="px-3 py-2 align-top min-w-[220px]">
                            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                              <span className={`text-[11px] font-bold px-1 py-0.5 rounded shrink-0 ${typeCfg.cls}`}>
                                {typeCfg.label}
                              </span>
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
    </div>
  );
}
