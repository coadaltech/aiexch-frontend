"use client";

import { useMemo } from "react";
import { useLiveMarketsSummary } from "@/hooks/useOwner";
import { Activity, TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

const MARKET_TYPE_LABELS: Record<number, string> = {
  0: "Match Odds",
  1: "Tied Match",
  2: "Complete Match",
  3: "Bookmaker",
  4: "Fancy",
};

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: "Soccer",
  2: "Tennis",
  4: "Cricket",
};

function eventTypeLabel(id: number) {
  return EVENT_TYPE_LABELS[id] ?? `Sport ${id}`;
}

function marketTypeLabel(type: number | null) {
  if (type == null) return "—";
  return MARKET_TYPE_LABELS[type] ?? `Type ${type}`;
}

function marketTypeBadgeClass(type: number | null) {
  switch (type) {
    case 0: return "bg-blue-100 text-blue-700";
    case 3: return "bg-purple-100 text-purple-700";
    case 4: return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function pnlClass(v: number) {
  return v >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold";
}

function fmt(v: number) {
  const abs = Math.abs(v).toFixed(2);
  return v >= 0 ? `+${abs}` : `-${abs}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type SummaryRow = {
  market_id: string;
  pnl: number;
  event_type_id: number;
  match_id: number;
  market_name: string | null;
  market_type: number | null;
  competition_id: number | null;
  event_name: string | null;
  competition_name: string | null;
};

type MatchGroup = {
  match_id: number;
  event_name: string;
  competition_name: string;
  markets: SummaryRow[];
  total_pnl: number;
};

type EventTypeGroup = {
  event_type_id: number;
  matches: MatchGroup[];
  total_pnl: number;
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LiveMarketsSummaryPage() {
  const { data, isLoading, isError, refetch, isFetching } = useLiveMarketsSummary();

  const { eventGroups, totalPnl } = useMemo(() => {
    if (!data?.length) return { eventGroups: [], totalPnl: 0 };

    // event_type_id → match_id → MatchGroup
    const eventMap = new Map<number, Map<number, MatchGroup>>();
    let total = 0;

    for (const raw of data as any[]) {
      const row: SummaryRow = {
        ...raw,
        pnl: parseFloat(raw.pnl ?? "0"),
      };

      total += row.pnl;

      const etId = row.event_type_id ?? 0;
      if (!eventMap.has(etId)) eventMap.set(etId, new Map());

      const matchMap = eventMap.get(etId)!;
      const matchKey = row.match_id ?? 0;

      if (!matchMap.has(matchKey)) {
        matchMap.set(matchKey, {
          match_id: matchKey,
          event_name: row.event_name || `Match ${matchKey}`,
          competition_name: row.competition_name ?? "—",
          markets: [],
          total_pnl: 0,
        });
      }
      const g = matchMap.get(matchKey)!;
      g.markets.push(row);
      g.total_pnl += row.pnl;
    }

    const eventGroups: EventTypeGroup[] = Array.from(eventMap.entries()).map(
      ([event_type_id, matchMap]) => {
        const matches = Array.from(matchMap.values());
        return {
          event_type_id,
          matches,
          total_pnl: matches.reduce((s, m) => s + m.total_pnl, 0),
        };
      }
    );

    // Sort: Cricket (4) first, then Soccer (1), Tennis (2), others
    const ORDER: Record<number, number> = { 4: 0, 1: 1, 2: 2 };
    eventGroups.sort((a, b) => (ORDER[a.event_type_id] ?? 99) - (ORDER[b.event_type_id] ?? 99));

    return { eventGroups, totalPnl: total };
  }, [data]);

  const hasData = eventGroups.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Live Markets — P&amp;L Summary</h1>
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-16 text-red-500">
          Failed to load P&L data.{" "}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && !hasData && (
        <div className="text-center py-16 text-gray-400">
          No P&amp;L data found. Data appears once bets are placed.
        </div>
      )}

      {/* Total P&L card */}
      {hasData && (
        <>
          <div className={cn(
            "rounded-xl border p-4 flex items-center gap-4",
            totalPnl >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}>
            {totalPnl >= 0
              ? <TrendingUp className="h-8 w-8 text-green-600 shrink-0" />
              : <TrendingDown className="h-8 w-8 text-red-600 shrink-0" />}
            <div>
              <p className="text-sm text-gray-500">Your Total P&amp;L (all markets)</p>
              <p className={cn("text-2xl font-bold", pnlClass(totalPnl))}>
                {fmt(totalPnl)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Worst-case scenario across all open positions
              </p>
            </div>
          </div>

          {/* Per event-type breakdown */}
          <div className="space-y-5">
            {eventGroups.map((et) => (
              <div key={et.event_type_id}>
                {/* Event type header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {eventTypeLabel(et.event_type_id)}
                  </span>
                  <span className={cn("text-xs font-bold", pnlClass(et.total_pnl))}>
                    {fmt(et.total_pnl)}
                  </span>
                </div>

                {/* Matches under this event type */}
                <div className="space-y-3">
                  {et.matches.map((g) => (
                    <div key={g.match_id} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                      {/* Match header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#174b73]">
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/60 truncate">{g.competition_name}</p>
                          <p className="text-sm font-semibold text-white truncate">{g.event_name}</p>
                        </div>
                        <div className={cn(
                          "text-sm font-bold shrink-0 ml-4",
                          g.total_pnl >= 0 ? "text-green-300" : "text-red-300"
                        )}>
                          {fmt(g.total_pnl)}
                        </div>
                      </div>

                      {/* Markets table */}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Market</th>
                            <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Type</th>
                            <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Your P&amp;L</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {g.markets.map((m) => (
                            <tr key={m.market_id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 text-gray-800 truncate max-w-[160px]">
                                {m.market_name ?? `Market ${m.market_id}`}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={cn(
                                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                  marketTypeBadgeClass(m.market_type)
                                )}>
                                  {marketTypeLabel(m.market_type)}
                                </span>
                              </td>
                              <td className={cn("px-4 py-2.5 text-right tabular-nums", pnlClass(m.pnl))}>
                                {fmt(m.pnl)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
