"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyBets } from "@/hooks/useBetting";
import { BetHistorySkeleton } from "@/components/skeletons/profile-skeletons";

export default function BetHistoryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "win" | "loss" | "pending">(
    "all"
  );
  const { data: betsData, isLoading } = useMyBets("all");
  const betHistory = betsData?.data || [];

  if (isLoading) {
    return <BetHistorySkeleton />;
  }

  const filteredBets = betHistory
    .filter((bet: any) => {
      const matchesResult =
        filter === "all" ||
        (filter === "win" && bet.status === "won") ||
        (filter === "loss" && bet.status === "lost") ||
        (filter === "pending" &&
          (bet.status === "pending" || bet.status === "matched"));
      return matchesResult;
    })
    .sort(
      (a: any, b: any) =>
        new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
    );

  const totalBets = betHistory.length;
  const totalWins = betHistory.filter((b: any) => b.status === "won").length;
  const totalWinnings = betHistory
    .filter((b: any) => b.status === "won")
    .reduce((sum: number, b: any) => sum + Number(b.payout || 0), 0);
  const totalLosses = betHistory
    .filter((b: any) => b.status === "lost")
    .reduce((sum: number, b: any) => sum + Number(b.stake), 0);
  const netProfit = totalWinnings - totalLosses;

  const getResultBadge = (status: string) => {
    switch (status) {
      case "won":
        return (
          <Badge className="bg-live/20 text-live-text border-live/30">
            Won
          </Badge>
        );
      case "lost":
        return (
          <Badge className="bg-danger/20 text-danger border-danger/30">
            Lost
          </Badge>
        );
      case "pending":
      case "matched":
        return (
          <Badge className="bg-status-yellow-dark/20 text-status-yellow border-status-yellow-dark/30">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            <h1 className="text-foreground font-bold text-base sm:text-lg lg:text-2xl truncate">
              Bet History
            </h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 lg:mb-6">
          <Card className="p-3 sm:p-4 text-center min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-primary">{totalBets}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Bets</div>
          </Card>
          <Card className="p-3 sm:p-4 text-center min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-live-text">{totalWins}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Wins</div>
          </Card>
          <Card className="p-3 sm:p-4 text-center min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-primary truncate" title={`₹${totalWinnings.toLocaleString()}`}>
              ₹{totalWinnings.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Winnings</div>
          </Card>
          <Card className="p-3 sm:p-4 text-center min-w-0">
            <div
              className={`text-lg sm:text-2xl font-bold truncate ${
                netProfit >= 0 ? "text-live-text" : "text-danger"
              }`}
              title={`${netProfit >= 0 ? "+" : ""}₹${netProfit.toLocaleString()}`}
            >
              {netProfit >= 0 ? "+" : ""}₹{netProfit.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Net P&L</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mt-4 lg:mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
              {["all", "win", "loss", "pending"].map((filterStatus) => (
                <Button
                  key={filterStatus}
                  size="sm"
                  onClick={() => setFilter(filterStatus as any)}
                  variant={filter === filterStatus ? "default" : "outline"}
                  className="shrink-0"
                >
                  {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </Button>
              ))}
        </div>

        {/* Bet History List */}
        <div className="space-y-4 mt-4">
          {filteredBets.map((bet: any) => (
            <Card key={bet.id} className="p-3 sm:p-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">
                      {bet.betType === 0 || bet.betType === "back" ? "Back" : "Lay"} Bet
                    </h3>
                    <Badge variant="outline" className="text-xs shrink-0">
                      #{bet.id}
                    </Badge>
                  </div>
                  {bet.marketName && (
                    <p className="text-xs sm:text-sm font-medium text-foreground mb-1 break-words">
                      {bet.marketName}
                    </p>
                  )}
                  {bet.runnerName && (
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      {bet.runnerName}
                    </p>
                  )}
                  {/* {!bet.marketName && !bet.runnerName && (
                    <p className="text-sm text-muted-foreground">
                      {bet.marketId
                        ?.replace(/_/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                        "Match Winner"}
                    </p>
                  )} */}
                </div>
                <div className="shrink-0">{getResultBadge(bet.status)}</div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <div className="text-muted-foreground">Stake</div>
                  <div className="font-semibold text-foreground">
                    ₹{Number(bet.stake).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Odds</div>
                  <div className="font-semibold text-foreground">
                    {Number(bet.odds)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {bet.status === "won" ? "Payout" : "Potential Win"}
                  </div>
                  <div
                    className={`font-semibold ${
                      bet.status === "won"
                        ? "text-live-text"
                        : "text-foreground"
                    }`}
                  >
                    ₹
                    {Number(
                      bet.payout || Number(bet.stake) * Number(bet.odds)
                    ).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div className="font-semibold text-foreground">
                    {formatDate(bet.addedDate)}
                  </div>
                </div>
              </div>

              {bet.status === "won" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-live-text">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      Profit: +₹
                      {(
                        Number(bet.payout || 0) - Number(bet.stake)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {bet.status === "lost" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-danger">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      Loss: -₹{Number(bet.stake).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {filteredBets.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No bets found
              </h3>
              <p className="text-muted-foreground">
                No betting history matches your current filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  
    </div>
  );
}
