"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyBets } from "@/hooks/useBetting";
import { useMatkaMyBets } from "@/hooks/useMatkaApi";
import { BetHistorySkeleton } from "@/components/skeletons/profile-skeletons";
import { formatLocalDate, formatLocalDateTime, formatLocalTime } from "@/lib/date-utils";

const STATUS_CONFIG = {
  won:     { label: "Won",     style: "text-emerald-700 bg-emerald-100 border-emerald-300" },
  lost:    { label: "Lost",    style: "text-rose-700 bg-rose-100 border-rose-300"          },
  pending: { label: "Pending", style: "text-amber-700 bg-amber-100 border-amber-300"       },
  matched: { label: "Matched", style: "text-sky-700 bg-sky-100 border-sky-300"             },
};

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

function capDecimals(num: number) {
  const str = String(num);
  const decimals = str.includes(".") ? str.split(".")[1].length : 0;
  return decimals > 4 ? num.toFixed(4) : str;
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
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-2">
      <div className="pb-8">

        {/* Header */}
        <div className="flex items-center gap-3  lg:mb-4">
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
        <div className="flex gap-2 mb-1 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f.key
                  ? "bg-[var(--header-primary)] text-[var(--header-text)] border-[var(--header-primary)]"
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

          {filteredSports.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[var(--header-primary)] text-[var(--header-text)] text-[13px] font-bold uppercase tracking-wide">
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Date</th>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Sport</th>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Team</th>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Market</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Odds</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Stake</th>
                    <th className="px-3 py-2.5 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSports.map((bet: any) => {
                    const statusCfg = STATUS_CONFIG[bet.status as keyof typeof STATUS_CONFIG]
                      ?? { label: bet.status, style: "text-gray-700 bg-white/70 border-gray-300" };
                    const isBack = bet.betType === 0 || bet.betType === "back";
                    const teamLabel =  bet.selectionName || bet.eventName || "—";
                    const rowBg = isBack ? "bg-blue-300" : "bg-pink-300";
                    const isFancy = bet.marketType === "fancy";
                    const userDetail = isFancy
                      ? (bet.details || []).find((d: any) => d.isUserSelection) || (bet.details || [])[0]
                      : null;
                    const marketLabel = isFancy
                      ? `${bet.marketName || "—"} / ${capDecimals(Number(bet.odds) * 100)}`
                      : (bet.marketName || "—");
                    const oddsLabel = isFancy
                      ? (userDetail?.run != null ? capDecimals(Number(userDetail.run)) : "-")
                      : `@ ${Number(bet.odds)}`;

                    return (
                      <tr key={bet.id} className={`${rowBg} text-gray-800 border-t border-white/40`}>
                        <td className="px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap">
                          {formatDate(bet.addedDate)}
                        </td>
                        <td className="px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap">
                          {bet.sportName || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[14px] font-bold whitespace-nowrap">
                          {teamLabel}
                        </td>
                        <td className="px-3 py-2.5 text-[14px] font-medium whitespace-nowrap">
                          {marketLabel}
                        </td>
                        <td className="px-3 py-2.5 text-[14px] font-bold whitespace-nowrap text-right">
                          {oddsLabel}
                        </td>
                        <td className="px-3 py-2.5 text-[14px] font-bold whitespace-nowrap text-right">
                          ₹{Number(bet.stake).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className={`text-[11px] px-2 py-0.5 border ${statusCfg.style}`}>
                            {statusCfg.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Matka transactions — shown only on "All" tab */}
        {showMatka && matkaHistory.length > 0 && (
          <div className="mt-1">
            {/* <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded">
                MATKA
              </span>
              <span className="text-xs text-gray-500">{matkaHistory.length} transaction{matkaHistory.length !== 1 ? "s" : ""}</span>
            </div> */}

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[var(--header-primary)] text-[var(--header-text)] text-[13px] font-bold uppercase ">
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Matka ({matkaHistory.length} records)</th>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">Shift Date</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Added Date Time</th>
                  </tr>
                </thead>
                <tbody>
                  {matkaHistory
                    .slice()
                    .sort((a: any, b: any) => new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime())
                    .map((txn: any) => {
                      const shiftDateStr = formatLocalDate(txn.shiftDate, { day: "2-digit", month: "short", year: "numeric" });
                      const txnTimeStr = formatLocalDate(txn.addedDate, { day: "2-digit", month: "short" }) + " " + formatLocalTime(txn.addedDate, { hour: "2-digit", minute: "2-digit", hour12: true });

                      return (
                        <tr key={txn.id} className="bg-orange-100 text-gray-800 border-t border-white/40">
                          <td className="px-3 py-2.5 text-[14px] font-bold whitespace-nowrap ">{txn.shiftName || "—"}</td>
                          <td className="px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap">{shiftDateStr}</td>
                          <td className="px-3 py-2.5 text-[14px] font-bold whitespace-nowrap text-right">₹{Number(txn.totalAmount).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap text-right">{txnTimeStr}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
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
