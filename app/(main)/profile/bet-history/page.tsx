"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyBets } from "@/hooks/useBetting";
import { useMatkaMyBets } from "@/hooks/useMatkaApi";
import { BetHistorySkeleton } from "@/components/skeletons/profile-skeletons";

const STATUS_CONFIG = {
  won:     { label: "Won",     style: "text-emerald-700 bg-emerald-100 border-emerald-300" },
  lost:    { label: "Lost",    style: "text-rose-700 bg-rose-100 border-rose-300"          },
  pending: { label: "Pending", style: "text-amber-700 bg-amber-100 border-amber-300"       },
  matched: { label: "Matched", style: "text-sky-700 bg-sky-100 border-sky-300"             },
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

  const { data: betsData, isLoading: sportsLoading } = useMyBets("all");
  const { data: matkaData, isLoading: matkaLoading } = useMatkaMyBets();

  const betHistory: any[]  = betsData?.data || [];
  const matkaHistory: any[] = matkaData || [];

  if (sportsLoading || matkaLoading) return <BetHistorySkeleton />;

  const totalBets = betHistory.length;
  const totalWins = betHistory.filter((b) => b.status === "won").length;
  const totalLosses = betHistory.filter((b) => b.status === "lost").length;
  const pendingCount = betHistory.filter((b) => b.status === "pending" || b.status === "matched").length;

  const filteredSports = betHistory
    .filter((bet) => {
      if (filter === "all") return true;
      if (filter === "win") return bet.status === "won";
      if (filter === "loss") return bet.status === "lost";
      if (filter === "pending") return bet.status === "pending" || bet.status === "matched";
      return true;
    })
    .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());

  const FILTERS = [
    { key: "all",     label: "All",     count: totalBets },
    { key: "win",     label: "Won",     count: totalWins },
    { key: "loss",    label: "Lost",    count: totalLosses },
    { key: "pending", label: "Pending", count: pendingCount },
  ] as const;

  const showMatka = filter === "all";

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-4">
      <div className="pb-8">

        {/* Header */}
        <div className="flex items-center gap-3 py-4 lg:mb-4">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <h1 className="text-gray-900 font-bold text-base sm:text-lg truncate">Bet History</h1>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f.key
                  ? "bg-[#142969] text-white border-[#142969]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${filter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sports bets */}
        <div className="space-y-1.5">
          {filteredSports.length === 0 && !showMatka && (
            <div className="py-12 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">No bets found</p>
              <p className="text-gray-400 text-sm mt-1">No betting history matches your filter</p>
            </div>
          )}

          {filteredSports.map((bet: any) => {
            const statusCfg = STATUS_CONFIG[bet.status as keyof typeof STATUS_CONFIG]
              ?? { label: bet.status, style: "text-gray-600 bg-gray-100 border-gray-300" };
            const isBack    = bet.betType === 0 || bet.betType === "back";
            const profit    = Number(bet.payout || 0) - Number(bet.stake);
            const potential = Number(bet.payout || Number(bet.stake) * Number(bet.odds));
            const isPending = bet.status === "pending" || bet.status === "matched";

            return (
              <div
                key={bet.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                style={{ borderLeft: `3px solid ${isBack ? "#5ba0d0" : "#e87a94"}` }}
              >
                {/* Main row */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${isBack ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700"}`}>
                    {isBack ? "BACK" : "LAY"}
                  </span>

                  <div className="flex-1 min-w-0">
                    {(bet.sportName || bet.competitionName || bet.eventName) && (
                      <p className="text-[10px] text-gray-400 truncate leading-tight mb-0.5">
                        {[bet.sportName, bet.competitionName, bet.eventName].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                      {bet.marketName || "—"}
                    </p>
                    {bet.runnerName && (
                      <p className="text-xs text-gray-500 truncate leading-tight">{bet.runnerName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none">Odds</p>
                      <p className="text-sm font-bold text-gray-900">{Number(bet.odds)}</p>
                    </div>
                    <div className="w-px h-6 bg-gray-200" />
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none">Stake</p>
                      <p className="text-sm font-bold text-gray-900">₹{Number(bet.stake).toLocaleString()}</p>
                    </div>
                    <div className="w-px h-6 bg-gray-200" />
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none">{bet.status === "won" ? "Won" : "Pot."}</p>
                      <p className={`text-sm font-bold ${bet.status === "won" ? "text-emerald-600" : bet.status === "lost" ? "text-rose-500" : "text-gray-900"}`}>
                        ₹{potential.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 border ml-1 ${statusCfg.style}`}>
                    {statusCfg.label}
                  </Badge>
                </div>

                {/* Footer row: date + result */}
                <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">{formatDate(bet.addedDate)}</span>
                  {bet.status === "won" && (
                    <span className="text-[11px] font-semibold text-emerald-600">Profit: +₹{profit.toLocaleString()}</span>
                  )}
                  {bet.status === "lost" && (
                    <span className="text-[11px] font-semibold text-rose-600">Loss: -₹{Number(bet.stake).toLocaleString()}</span>
                  )}
                  {isPending && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600">
                      <Clock className="w-3 h-3 shrink-0" /> Awaiting result
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Matka transactions — shown only on "All" tab */}
        {showMatka && matkaHistory.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded">
                MATKA
              </span>
              <span className="text-xs text-gray-500">{matkaHistory.length} transaction{matkaHistory.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-1.5">
              {matkaHistory
                .slice()
                .sort((a: any, b: any) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
                .map((txn: any) => (
                  <div
                    key={txn.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                    style={{ borderLeft: "3px solid #e88030" }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-orange-100 text-orange-700">
                        MATKA
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                          {txn.shiftName || "—"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <p className="text-[10px] text-gray-400 leading-none">Amount</p>
                          <p className="text-sm font-bold text-gray-900">₹{Number(txn.totalAmount).toLocaleString()}</p>
                        </div>
                        {Number(txn.totalCommission) > 0 && (
                          <>
                            <div className="w-px h-6 bg-gray-200" />
                            <div>
                              <p className="text-[10px] text-gray-400 leading-none">Comm.</p>
                              <p className="text-sm font-bold text-gray-600">₹{Number(txn.totalCommission).toLocaleString()}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">{formatDate(txn.addedDate)}</span>
                      <span className="text-[10px] text-gray-500">
                        {txn.details?.length ? `${txn.details.length} number${txn.details.length !== 1 ? "s" : ""}` : txn.shiftDate || ""}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty state when all tabs show nothing */}
        {showMatka && filteredSports.length === 0 && matkaHistory.length === 0 && (
          <div className="py-12 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No bets found</p>
            <p className="text-gray-400 text-sm mt-1">Your bet history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
