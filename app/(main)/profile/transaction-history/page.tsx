"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTransactions } from "@/hooks/useUserQueries";
import { TransactionHistorySkeleton } from "@/components/skeletons/profile-skeletons";

export default function TransactionHistory() {
  const [filter, setFilter] = useState<"all" | "deposit" | "withdraw">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const router = useRouter();

  const { data: transactions = [], isLoading } = useTransactions({
    type: filter,
    search: searchTerm,
  });

  if (isLoading) {
    return <TransactionHistorySkeleton />;
  }

  const filteredTransactions = transactions
    .filter((tx: any) => {
      const matchesFilter = filter === "all" || tx.type === filter;
      const matchesSearch =
        tx.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.currency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase());

      const txDate = new Date(tx.addedDate);
      const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || txDate <= new Date(dateTo + "T23:59:59");

      return matchesFilter && matchesSearch && matchesDateFrom && matchesDateTo;
    })
    .sort(
      (a: any, b: any) =>
        new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
    );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: string) => {
    const inrAmount = parseFloat(amount);
    return {
      usd: inrAmount.toFixed(2),
      inr: inrAmount.toFixed(2),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-live-text bg-live-text/10";
      case "pending":
        return "text-status-yellow bg-status-yellow/10";
      case "failed":
        return "text-danger bg-danger/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0">
      <div className="pb-6 sm:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 py-4 sm:py-0 lg:mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
            Transaction History
          </h1>
        </div>

        {/* Filters and Search */}
        <div className="mt-4 lg:mb-6 space-y-3 sm:space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              onClick={() => setFilter("all")}
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
            >
              All
            </Button>
            <Button
              onClick={() => setFilter("deposit")}
              size="sm"
              variant={filter === "deposit" ? "default" : "outline"}
            >
              Deposits
            </Button>
            <Button
              onClick={() => setFilter("withdraw")}
              size="sm"
              variant={filter === "withdraw" ? "default" : "outline"}
            >
              Withdrawals
            </Button>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0"
              placeholder="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0"
              placeholder="To date"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by method, reference or currency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3 mt-4">
          {filteredTransactions.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <p className="text-muted-foreground text-sm sm:text-base">
                No transactions found
              </p>
            </Card>
          ) : (
            filteredTransactions.map((transaction: any) => {
              const amount = formatAmount(transaction.amount);
              return (
                <Card
                  key={transaction.id}
                  className="p-3 sm:p-4 hover:bg-muted/50 transition-colors min-w-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2 rounded-full ${
                          ["deposit", "promocode"].includes(transaction.type)
                            ? "bg-live-text/10 text-live-text"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {["deposit", "promocode"].includes(transaction.type) ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-foreground font-medium capitalize text-sm sm:text-base">
                            {transaction.type}
                          </span>
                          <Badge
                            className={`${getStatusColor(transaction.status)} text-xs`}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
                          {transaction.method || "N/A"} •{" "}
                          {formatDate(transaction.addedDate)}
                        </div>
                        {/* {transaction.reference && (
                          <div className="text-xs text-casino-secondary-text mb-1">
                            Ref: {transaction.reference}
                          </div>
                        )} */}
                        {transaction.txnHash && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Hash: {transaction.txnHash.substring(0, 20)}...
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div
                        className={`font-bold text-base sm:text-lg ${
                          transaction.type === "deposit"
                            ? "text-live-text"
                            : "text-danger"
                        }`}
                      >
                        {transaction.type === "deposit" ? "+" : "-"}₹
                        {amount.inr}
                      </div>
                    </div>
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
