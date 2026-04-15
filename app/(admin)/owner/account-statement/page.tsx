"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/lib/api";
import { ArrowLeft, Receipt, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
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

/** A row from the backend is a balance row (Opening/Closing) when
 *  voucher_id, voucher_type, and added_date are all null. */
function isBalanceRow(row: any) {
  return row.voucher_id == null && row.voucher_type == null && row.added_date == null;
}

function BalanceRow({ label, amount }: { label: string; amount: any }) {
  const val = parseFloat(amount ?? 0);
  return (
    <div className="grid grid-cols-[76px_1fr_200px_200px] items-center px-3 py-2 bg-indigo-50 border-b border-indigo-100">
      <div className="text-[12px] font-semibold text-indigo-400">—</div>
      <div className="px-2">
        <span className="text-[12px] font-bold text-indigo-700 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-bold ${val >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {val >= 0 ? "+" : ""}₹{fmt(val)}
        </span>
      </div>
      <div className="text-right text-[12px] text-gray-200">—</div>
    </div>
  );
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

  const allRows      = rows ?? [];
  const openingRow   = allRows.find(isBalanceRow);
  const closingRow   = [...allRows].reverse().find(isBalanceRow);
  const transactions = allRows.filter((r: any) => !isBalanceRow(r));

  const currentBalance = closingRow?.credit ?? openingRow?.credit ?? "0";
  const totalCredit    = transactions.reduce((s: number, r: any) => s + Math.max(0, parseFloat(r.credit ?? 0)), 0);
  const totalDebit     = transactions.reduce((s: number, r: any) => s + Math.max(0, parseFloat(r.debit  ?? 0)), 0);

  const isOwner = user?.role === "owner";

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

        {!isLoading && !isError && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <p className="text-[12px] text-gray-400 uppercase mb-0.5">Balance</p>
              <p className="text-base font-bold text-blue-600">₹{fmt(currentBalance)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 shadow-sm">
              <p className="text-[12px] text-emerald-600 font-semibold uppercase mb-0.5">Credit</p>
              <p className="text-base font-bold text-emerald-700">+₹{fmt(totalCredit)}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 shadow-sm">
              <p className="text-[12px] text-rose-600 font-semibold uppercase mb-0.5">Debit</p>
              <p className="text-base font-bold text-rose-700">-₹{fmt(totalDebit)}</p>
            </div>
          </div>
        )}

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

              <div className="grid grid-cols-[76px_1fr_200px_200px] px-3 py-2 bg-[#142969] text-white text-[12px] font-bold uppercase tracking-wide">
                <span>Date</span>
                <span>Description</span>
                <span className="text-right">Credit</span>
                <span className="text-right">Debit</span>
              </div>

              {openingRow && <BalanceRow label="Opening Balance" amount={openingRow.credit} />}

              <div className="divide-y divide-gray-100">
                {transactions.map((row: any, idx: number) => {
                  const credit  = parseFloat(row.credit ?? 0);
                  const debit   = parseFloat(row.debit  ?? 0);
                  const typeCfg = getTypeLabel(row.voucher_type != null ? Number(row.voucher_type) : null);

                  const eventParts = [row.remarks2, row.remarks3].filter(Boolean);
                  const descLabel  = eventParts.length
                    ? eventParts.join(" · ")
                    : row.description || row.remarks1 || row.remarks || row.method || typeCfg.label;

                  return (
                    <div
                      key={`${row.voucher_id ?? idx}-${idx}`}
                      className="grid grid-cols-[76px_1fr_200px_200px] items-start px-3 py-2"
                    >
                      <div className="pt-0.5">
                        <p className="text-[12px] font-semibold text-gray-700 leading-tight">
                          {formatDateShort(row.added_date || row.voucher_date)}
                        </p>
                        <p className="text-[11px] text-gray-400 leading-tight">
                          {formatTime(row.added_date || row.voucher_date)}
                        </p>
                      </div>

                      <div className="min-w-0 px-2">
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
                      </div>

                      <div className="text-right pt-0.5">
                        {credit > 0
                          ? <span className="text-sm font-bold text-emerald-600">+₹{fmt(credit)}</span>
                          : <span className="text-[12px] text-gray-200">—</span>}
                      </div>

                      <div className="text-right pt-0.5">
                        {debit > 0
                          ? <span className="text-sm font-bold text-rose-600">-₹{fmt(debit)}</span>
                          : <span className="text-[12px] text-gray-200">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {closingRow && closingRow !== openingRow && (
                <BalanceRow label="Closing Balance" amount={closingRow.credit} />
              )}

              <div className="grid grid-cols-[76px_1fr_200px_200px] px-3 py-2 bg-gray-50 border-t border-gray-200 text-sm font-bold">
                <span className="text-gray-400 text-[12px]">{transactions.length} rows</span>
                <span />
                <span className="text-right text-emerald-700">+₹{fmt(totalCredit)}</span>
                <span className="text-right text-rose-700">-₹{fmt(totalDebit)}</span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
