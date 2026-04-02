"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyBets } from "@/hooks/useBetting";
import { BetHistorySkeleton } from "@/components/skeletons/profile-skeletons";

const STATUS_CONFIG = {
  won:     { label: "Won",     style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  lost:    { label: "Lost",    style: "bg-rose-50 text-rose-700 border-rose-200"          },
  pending: { label: "Pending", style: "bg-amber-50 text-amber-700 border-amber-200"       },
  matched: { label: "Matched", style: "bg-sky-50 text-sky-700 border-sky-200"             },
};

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

export default function BetHistoryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "win" | "loss" | "pending">("all");
  const { data: betsData, isLoading } = useMyBets("all");
  const betHistory = betsData?.data || [];

  if (isLoading) return <BetHistorySkeleton />;

  const filteredBets = betHistory
    .filter((bet: any) => {
      if (filter === "all") return true;
      if (filter === "win") return bet.status === "won";
      if (filter === "loss") return bet.status === "lost";
      if (filter === "pending") return bet.status === "pending" || bet.status === "matched";
      return true;
    })
    .sort((a: any, b: any) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());

  const totalBets     = betHistory.length;
  const totalWins     = betHistory.filter((b: any) => b.status === "won").length;
  const totalLosses   = betHistory.filter((b: any) => b.status === "lost").length;
  const totalWinnings = betHistory.filter((b: any) => b.status === "won").reduce((s: number, b: any) => s + Number(b.payout || 0), 0);
  const totalStaked   = betHistory.filter((b: any) => b.status === "lost").reduce((s: number, b: any) => s + Number(b.stake), 0);
  const netProfit     = totalWinnings - totalStaked;
  const winRate       = totalBets > 0 ? Math.round((totalWins / totalBets) * 100) : 0;

  const FILTERS = [
    { key: "all",     label: "All",     count: totalBets                                               },
    { key: "win",     label: "Won",     count: totalWins                                               },
    { key: "loss",    label: "Lost",    count: totalLosses                                             },
    { key: "pending", label: "Pending", count: betHistory.filter((b: any) => b.status === "pending" || b.status === "matched").length },
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
            <Trophy className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-foreground font-bold text-base sm:text-lg truncate">Bet History</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="p-2.5 sm:p-3 text-center">
            <div className="text-lg sm:text-xl font-bold text-foreground">{totalBets}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
          </Card>
          <Card className="p-2.5 sm:p-3 text-center">
            <div className="text-lg sm:text-xl font-bold text-emerald-600">{totalWins}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Won</div>
          </Card>
          <Card className="p-2.5 sm:p-3 text-center">
            <div className="text-lg sm:text-xl font-bold text-rose-500">{totalLosses}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Lost</div>
          </Card>
          <Card className="p-2.5 sm:p-3 text-center">
            <div className="text-lg sm:text-xl font-bold text-primary">{winRate}%</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Win %</div>
          </Card>
        </div>

        {/* P&L banner */}
        <Card className={`p-3 mb-4 flex items-center justify-between ${netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className="flex items-center gap-2">
            {netProfit >= 0
              ? <TrendingUp className="w-4 h-4 text-emerald-600" />
              : <TrendingDown className="w-4 h-4 text-rose-500" />}
            <span className="text-sm font-medium text-foreground">Net P&amp;L</span>
          </div>
          <span className={`font-bold text-base sm:text-lg ${netProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {netProfit >= 0 ? "+" : ""}₹{netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </Card>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              onClick={() => setFilter(f.key)}
              variant={filter === f.key ? "default" : "outline"}
              className="shrink-0 gap-1.5"
            >
              {f.label}
              <span className={`text-[10px] font-bold px-1 rounded ${filter === f.key ? "bg-white/20" : "bg-muted"}`}>
                {f.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Bet list */}
        <div className="space-y-2">
          {filteredBets.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-14 h-14 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-medium">No bets found</p>
              <p className="text-muted-foreground text-sm mt-1">No betting history matches your filter</p>
            </div>
          ) : (
            filteredBets.map((bet: any) => {
              const statusCfg = STATUS_CONFIG[bet.status as keyof typeof STATUS_CONFIG] ?? { label: bet.status, style: "bg-muted text-muted-foreground border-border" };
              const isBack   = bet.betType === 0 || bet.betType === "back";
              const profit   = Number(bet.payout || 0) - Number(bet.stake);
              const potential = Number(bet.payout || Number(bet.stake) * Number(bet.odds));

              return (
                <Card key={bet.id} className="overflow-hidden p-0">
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-3 sm:px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${bet.status === "won" ? "bg-emerald-500" : bet.status === "lost" ? "bg-rose-500" : "bg-amber-400"}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isBack ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700"}`}>
                            {isBack ? "BACK" : "LAY"}
                          </span>
                          {bet.marketName && (
                            <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">{bet.marketName}</span>
                          )}
                        </div>
                        {bet.runnerName && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{bet.runnerName}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 border ml-2 ${statusCfg.style}`}>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Info grid */}
                  <div className="border-t border-border/50 px-3 sm:px-4 py-2.5 grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Stake</p>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">₹{Number(bet.stake).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Odds</p>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">{Number(bet.odds)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{bet.status === "won" ? "Payout" : "Potential"}</p>
                      <p className={`text-xs sm:text-sm font-semibold ${bet.status === "won" ? "text-emerald-600" : "text-foreground"}`}>
                        ₹{potential.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Date</p>
                      <p className="text-[10px] sm:text-xs font-medium text-foreground leading-tight">{formatDate(bet.addedDate)}</p>
                    </div>
                  </div>

                  {/* P&L footer for settled bets */}
                  {(bet.status === "won" || bet.status === "lost") && (
                    <div className={`px-3 sm:px-4 py-2 flex items-center gap-2 ${bet.status === "won" ? "bg-emerald-50" : "bg-rose-50"}`}>
                      {bet.status === "won"
                        ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        : <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                      <span className={`text-xs font-semibold ${bet.status === "won" ? "text-emerald-700" : "text-rose-600"}`}>
                        {bet.status === "won"
                          ? `Profit: +₹${profit.toLocaleString()}`
                          : `Loss: -₹${Number(bet.stake).toLocaleString()}`}
                      </span>
                    </div>
                  )}

                  {(bet.status === "pending" || bet.status === "matched") && (
                    <div className="px-3 sm:px-4 py-2 flex items-center gap-2 bg-amber-50">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs font-medium text-amber-700">Awaiting result</span>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
