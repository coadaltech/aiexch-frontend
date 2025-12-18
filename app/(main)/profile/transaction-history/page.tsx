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

      const txDate = new Date(tx.createdAt);
      const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || txDate <= new Date(dateTo + "T23:59:59");

      return matchesFilter && matchesSearch && matchesDateFrom && matchesDateTo;
    })
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
        return "text-green-400 bg-green-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4  lg:p-0 lg:mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Transaction History
          </h1>
        </div>

        {/* Filters and Search */}
        <div className="lg:p-0 mt-4  lg:mb-6 space-y-4">
          <div className="flex gap-2 overflow-x-auto">
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
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1"
              placeholder="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1"
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
        <div className="space-y-3 mt-4 lg:p-0">
          {filteredTransactions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No transactions found
              </p>
            </Card>
          ) : (
            filteredTransactions.map((transaction: any) => {
              const amount = formatAmount(transaction.amount);
              return (
                <Card
                  key={transaction.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          ["deposit", "promocode"].includes(transaction.type)
                            ? "bg-green-400/10 text-green-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {["deposit", "promocode"].includes(transaction.type) ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-foreground font-medium capitalize">
                            {transaction.type}
                          </span>
                          <Badge
                            className={getStatusColor(transaction.status)}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {transaction.method || "N/A"} •{" "}
                          {formatDate(transaction.createdAt)}
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
                    <div className="text-right">
                      <div
                        className={`font-bold text-lg ${
                          transaction.type === "deposit"
                            ? "text-green-400"
                            : "text-red-400"
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
