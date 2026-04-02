"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  deposit:   { label: "Deposit",    icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
  withdraw:  { label: "Withdrawal", icon: ArrowUpRight,  color: "text-rose-500",    bg: "bg-rose-50 text-rose-500"       },
  bonus:     { label: "Bonus",      icon: Gift,          color: "text-violet-500",  bg: "bg-violet-50 text-violet-500"   },
  promocode: { label: "Promo",      icon: Gift,          color: "text-violet-500",  bg: "bg-violet-50 text-violet-500"   },
  credit:    { label: "Credit",     icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
  debit:     { label: "Debit",      icon: ArrowUpRight,  color: "text-rose-500",    bg: "bg-rose-50 text-rose-500"       },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type?.toLowerCase()] ?? { label: type, icon: Receipt, color: "text-muted-foreground", bg: "bg-muted text-muted-foreground" };
}

function isIncoming(tx: any): boolean {
  if (tx.isCredit === true) return true;
  if (tx.isCredit === false) return false;
  const t = (tx.type ?? "").toLowerCase();
  return t === "deposit" || t === "bonus" || t === "promocode" || t === "credit";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
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

  return (
    <div className="min-h-screen w-full min-w-0 bg-background p-4">
      <div className="pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 lg:mb-4">
          <Button onClick={() => router.back()} variant="ghost" size="sm" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Wallet className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-foreground font-bold text-base sm:text-lg truncate">Transaction History</h1>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <Card className="p-3 text-center">
            <div className="flex justify-center mb-1">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-600">
              +₹{formatAmount(summary.totalIn)}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Total In</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="flex justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-sm sm:text-base font-bold text-rose-500">
              -₹{formatAmount(summary.totalOut)}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Total Out</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="flex justify-center mb-1">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className={`text-sm sm:text-base font-bold ${summary.net >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {summary.net >= 0 ? "+" : "-"}₹{formatAmount(Math.abs(summary.net))}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Net Balance</div>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              onClick={() => setFilter(tab.key as any)}
              variant={filter === tab.key ? "default" : "outline"}
              className="shrink-0"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Date range + search */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-9 text-foreground text-xs sm:text-sm"
              />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-9 text-foreground text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by method, reference, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-foreground"
            />
          </div>
        </div>

        {/* Transaction list */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <Card className="p-10 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No transactions found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters</p>
            </Card>
          ) : (
            filteredTransactions.map((tx: any) => {
              const cfg = getTypeConfig(tx.type);
              const Icon = cfg.icon;
              const incoming = isIncoming(tx);
              const amt = parseFloat(tx.amount ?? 0) || 0;
              const statusStyle = STATUS_STYLE[tx.status?.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";

              return (
                <Card key={tx.id} className="p-0 overflow-hidden">
                  {/* Top row: icon + title + amount */}
                  <div className="flex items-center gap-3 px-3 sm:px-4 pt-3 pb-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm capitalize">{cfg.label}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${statusStyle}`}>
                          {tx.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.addedDate)}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`font-bold text-base sm:text-lg ${incoming ? "text-emerald-600" : "text-rose-500"}`}>
                        {incoming ? "+" : "-"}₹{formatAmount(amt)}
                      </div>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="px-3 sm:px-4 pb-3 border-t border-border/50 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                    {tx.method && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Method</span>
                        <p className="text-xs font-medium text-foreground capitalize">{tx.method}</p>
                      </div>
                    )}
                    {tx.reference && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Reference</span>
                        <p className="text-xs font-medium text-foreground break-all">{tx.reference}</p>
                      </div>
                    )}
                    {tx.approvedDate && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Approved</span>
                        <p className="text-xs font-medium text-foreground">{new Date(tx.approvedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      </div>
                    )}
                    {tx.remarks && (
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Remarks</span>
                        <p className="text-xs font-medium text-foreground">{tx.remarks}</p>
                      </div>
                    )}
                    {tx.remarks1 && (
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Note</span>
                        <p className="text-xs font-medium text-foreground">{tx.remarks1}</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
