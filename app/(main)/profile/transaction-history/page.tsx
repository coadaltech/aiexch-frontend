"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Gift,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  CalendarDays,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useUserQueries";
import { TransactionHistorySkeleton } from "@/components/skeletons/profile-skeletons";
import { formatLocalDate, formatLocalDateTime } from "@/lib/date-utils";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  deposit:   { label: "Deposit",    icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
  withdraw:  { label: "Withdrawal", icon: ArrowUpRight,  color: "text-rose-500",    bg: "bg-rose-50 text-rose-500"       },
  bonus:     { label: "Bonus",      icon: Gift,          color: "text-violet-500",  bg: "bg-violet-50 text-violet-500"   },
  promocode: { label: "Promo",      icon: Gift,          color: "text-violet-500",  bg: "bg-violet-50 text-violet-500"   },
  credit:    { label: "Credit",     icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
  debit:     { label: "Debit",      icon: ArrowUpRight,  color: "text-rose-500",    bg: "bg-rose-50 text-rose-500"       },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type?.toLowerCase()] ?? { label: type, icon: Receipt, color: "text-gray-500", bg: "bg-gray-100 text-gray-500" };
}

function isIncoming(tx: any): boolean {
  if (tx.isCredit === true) return true;
  if (tx.isCredit === false) return false;
  const t = (tx.type ?? "").toLowerCase();
  return t === "deposit" || t === "bonus" || t === "promocode" || t === "credit";
}

function formatDate(dateString: string) {
  return formatLocalDateTime(dateString, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAmount(amount: string | number) {
  const n = parseFloat(String(amount ?? 0));
  return isNaN(n) ? "0.00" : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50  text-amber-700  border-amber-200",
  rejected:  "bg-rose-50   text-rose-700   border-rose-200",
  failed:    "bg-rose-50   text-rose-700   border-rose-200",
};

export default function TransactionHistory() {
  const [filter, setFilter] = useState<"all" | "deposit" | "withdraw" | "bonus">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const router = useRouter();

  const { data: transactions = [], isLoading } = useTransactions({ type: filter });

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        const matchesSearch =
          !searchTerm ||
          tx.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
        const txDate = new Date(tx.addedDate);
        const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || txDate <= new Date(dateTo + "T23:59:59");
        return matchesSearch && matchesDateFrom && matchesDateTo;
      })
      .sort((a: any, b: any) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
  }, [transactions, searchTerm, dateFrom, dateTo]);

  const summary = useMemo(() => {
    let totalIn = 0, totalOut = 0;
    for (const tx of filteredTransactions) {
      const amt = parseFloat(tx.amount ?? 0) || 0;
      if (isIncoming(tx)) totalIn += amt;
      else totalOut += amt;
    }
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filteredTransactions]);

  if (isLoading) return <TransactionHistorySkeleton />;

  const FILTER_TABS = [
    { key: "all",      label: "All" },
    { key: "deposit",  label: "Deposits" },
    { key: "withdraw", label: "Withdrawals" },
    { key: "bonus",    label: "Bonuses" },
  ] as const;

  const cardCls = "rounded-2xl border border-gray-200 bg-white shadow-sm";

  return (
    <div className="w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="shrink-0 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900 sm:h-10 sm:w-10">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">
            Transaction History
          </h1>
          <p className="hidden truncate text-xs text-gray-500 sm:block">
            All your deposits, withdrawals &amp; bonuses
          </p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className={`${cardCls} p-3 text-center`}>
          <div className="mb-1 flex justify-center">
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-emerald-600 sm:text-base">
            +₹{formatAmount(summary.totalIn)}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">Total In</div>
        </div>
        <div className={`${cardCls} p-3 text-center`}>
          <div className="mb-1 flex justify-center">
            <TrendingUp className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-sm font-bold text-rose-500 sm:text-base">
            -₹{formatAmount(summary.totalOut)}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">Total Out</div>
        </div>
        <div className={`${cardCls} p-3 text-center`}>
          <div className="mb-1 flex justify-center">
            <Wallet className="h-4 w-4 text-gray-700" />
          </div>
          <div className={`text-sm font-bold sm:text-base ${summary.net >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {summary.net >= 0 ? "+" : "-"}₹{formatAmount(Math.abs(summary.net))}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">Net Balance</div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            onClick={() => setFilter(tab.key as any)}
            variant={filter === tab.key ? "default" : "outline"}
            className={`shrink-0 bg-white ${filter === tab.key ? "bg-[var(--header-primary)] text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ── Date range + search ── */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-9 text-xs bg-white sm:text-sm"
            />
          </div>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pl-9 text-xs bg-white sm:text-sm"
            />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by method, reference, remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-gray-900 bg-white placeholder:text-gray-500 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* ── Transaction list ── */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className={`${cardCls} p-10 text-center`}>
            <Receipt className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="font-medium text-gray-900">No transactions found</p>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          filteredTransactions.map((tx: any) => {
            const cfg = getTypeConfig(tx.type);
            const Icon = cfg.icon;
            const incoming = isIncoming(tx);
            const amt = parseFloat(tx.amount ?? 0) || 0;
            const statusStyle = STATUS_STYLE[tx.status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";

            return (
              <div key={tx.id} className={`${cardCls} overflow-hidden`}>
                {/* Top row: icon + title + amount */}
                <div className="flex items-center gap-3 px-3 pt-3 pb-2 sm:px-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold capitalize text-gray-900">{cfg.label}</span>
                      <Badge variant="outline" className={`border px-1.5 py-0 text-[10px] ${statusStyle}`}>
                        {tx.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDate(tx.addedDate)}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className={`text-base font-bold sm:text-lg ${incoming ? "text-emerald-600" : "text-rose-500"}`}>
                      {incoming ? "+" : "-"}₹{formatAmount(amt)}
                    </div>
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-gray-100 px-3 pb-3 pt-2 sm:grid-cols-3 sm:px-4">
                  {tx.method && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">Method</span>
                      <p className="text-xs font-medium capitalize text-gray-900">{tx.method}</p>
                    </div>
                  )}
                  {tx.reference && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">Reference</span>
                      <p className="break-all text-xs font-medium text-gray-900">{tx.reference}</p>
                    </div>
                  )}
                  {tx.approvedDate && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">Approved</span>
                      <p className="text-xs font-medium text-gray-900">{formatLocalDate(tx.approvedDate, { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                  )}
                  {tx.remarks && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">Remarks</span>
                      <p className="text-xs font-medium text-gray-900">{tx.remarks}</p>
                    </div>
                  )}
                  {tx.remarks1 && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">Note</span>
                      <p className="text-xs font-medium text-gray-900">{tx.remarks1}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
