"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLiveMarketsBets } from "@/hooks/useOwner";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKET_TYPE_LABELS: Record<number, string> = {
  0: "Match Odds",
  1: "Tied Match",
  2: "Complete Match",
  3: "Bookmaker",
  4: "Fancy",
};

function fmtNum(v: string | number | null | undefined) {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? "0.00" : n.toFixed(2);
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function AllBetsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AllBetsContent />
    </Suspense>
  );
}

function AllBetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");

  const { data: bets, isLoading, isError, isFetching, refetch } =
    useLiveMarketsBets(matchId);

  const betList: any[] = Array.isArray(bets) ? bets : [];

  const columns = [
    { key: "user", label: "Username", width: "min-w-[110px]" },
    { key: "whitelabel", label: "Whitelabel", width: "min-w-[110px]" },
    { key: "market", label: "Market", width: "min-w-[140px]" },
    { key: "market_type", label: "Market Type", width: "min-w-[100px]" },
    { key: "selection", label: "Selection", width: "min-w-[120px]" },
    { key: "type", label: "Type", width: "min-w-[60px]" },
    { key: "stake", label: "Stake", width: "min-w-[80px]" },
    { key: "odds", label: "Odds", width: "min-w-[70px]" },
    { key: "pot_return", label: "Pot. Return", width: "min-w-[100px]" },
    { key: "pot_profit", label: "Pot. Profit", width: "min-w-[100px]" },
    { key: "settled", label: "Settled", width: "min-w-[90px]" },
    { key: "status", label: "Status", width: "min-w-[80px]" },
    { key: "ip", label: "IP", width: "min-w-[110px]" },
    { key: "placed", label: "Placed At", width: "min-w-[150px]" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-xl font-bold">All Bets</h1>
          {betList.length > 0 && (
            <span className="text-xs bg-[#174b73] text-white px-2 py-0.5 rounded-full">
              {betList.length}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {!matchId && (
        <div className="text-center py-16 text-gray-400">
          No match specified.
        </div>
      )}

      {matchId && isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {matchId && isError && !isLoading && (
        <div className="text-center py-16 text-red-500">
          Failed to load bets.{" "}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {matchId && !isLoading && !isError && betList.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No bets placed on this match yet.
        </div>
      )}

      {matchId && betList.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#174b73] text-white">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "px-3 py-2.5 text-left font-semibold whitespace-nowrap",
                        c.width
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {betList.map((bet) => {
                  const isBack = bet.bet_type === 0;
                  const stake = parseFloat(bet.stake ?? 0);
                  const odds = parseFloat(bet.odds ?? 0);
                  const potReturn = parseFloat(bet.potential_return ?? 0);
                  const potProfit = potReturn - stake;
                  return (
                    <tr
                      key={bet.id}
                      className={cn(
                        "border-t border-gray-100 hover:bg-gray-50 transition-colors",
                        isBack ? "bg-[#eaf4fc]" : "bg-[#fdecf0]"
                      )}
                    >
                      <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                        {bet.user_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {bet.whitelabel_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {bet.market_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {MARKET_TYPE_LABELS[bet.market_type] ?? bet.market_type ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {bet.selection_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-block text-[11px] font-bold px-2 py-0.5 rounded",
                            isBack ? "bg-[#72bbef] text-black" : "bg-[#faa9ba] text-black"
                          )}
                        >
                          {isBack ? "BACK" : "LAY"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                        ₹{fmtNum(stake)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                        {odds.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        ₹{fmtNum(potReturn)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 font-semibold whitespace-nowrap",
                          potProfit >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        ₹{fmtNum(potProfit)}
                      </td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {bet.settled_amount != null ? `₹${fmtNum(bet.settled_amount)}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {bet.status ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {bet.ip_address ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {fmtDate(bet.matched_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
