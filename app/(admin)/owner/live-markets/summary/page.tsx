"use client";

import { useMemo } from "react";
import { useLiveMarketsSummary } from "@/hooks/useOwner";
import { Activity, TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: "Soccer",
  2: "Tennis",
  4: "Cricket",
};

function eventTypeLabel(id: number) {
  return EVENT_TYPE_LABELS[id] ?? `Sport ${id}`;
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
  runner_id: string | null;
  runner_name: string | null;
  pnl: number;
  event_type_id: number;
  match_id: number;
  market_name: string | null;
  market_type: number | null;
  competition_id: number | null;
  event_name: string | null;
  competition_name: string | null;
};

type RunnerEntry = {
  runner_id: string | null;
  runner_name: string | null;
  pnl: number;
};

type MarketEntry = {
  market_id: string;
  market_name: string | null;
  runners: RunnerEntry[];
};

type MatchGroup = {
  match_id: number;
  event_name: string;
  competition_name: string;
  normal: MarketEntry[];
  bookmaker: MarketEntry[];
  fancy: MarketEntry[];
  total_pnl: number;
};

type EventTypeGroup = {
  event_type_id: number;
  matches: MatchGroup[];
  total_pnl: number;
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
      <span className="text-xs font-extrabold uppercase tracking-widest text-gray-700">
        {label}
      </span>
    </div>
  );
}

function NormalSection({ markets }: { markets: MarketEntry[] }) {
  if (!markets.length) return null;
  return (
    <div className="flex-1 min-w-0 border-r border-gray-200 last:border-r-0">
      <SectionHeader label="Normal" />
      <div className="divide-y divide-gray-100">
        {markets.map((m) => (
          <div key={m.market_id}>
            {/* Market name as sub-header when multiple runners */}
            {m.runners.length > 1 && (
              <div className="px-3 pt-2 pb-0.5">
                <span className="text-xs font-semibold text-gray-500 truncate block">
                  {m.market_name ?? `Market ${m.market_id}`}
                </span>
              </div>
            )}
            {m.runners.map((r, i) => (
              <div key={`${m.market_id}-${r.runner_id ?? i}`} className="flex items-center justify-between px-3 py-2 gap-2">
                <span className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
                  {m.runners.length === 1
                    ? (m.market_name ?? `Market ${m.market_id}`)
                    : (r.runner_name ?? `Runner ${r.runner_id}`)}
                </span>
                <span className={cn("text-sm font-bold tabular-nums shrink-0", pnlClass(r.pnl))}>
                  {fmt(r.pnl)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookmakerSection({ markets }: { markets: MarketEntry[] }) {
  if (!markets.length) return null;
  return (
    <div className="flex-1 min-w-0 border-r border-gray-200 last:border-r-0">
      <SectionHeader label="Bookmaker" />
      <div className="divide-y divide-gray-100">
        {markets.map((m) =>
          m.runners.map((r, i) => (
            <div key={`${m.market_id}-${r.runner_id ?? i}`} className="flex items-center justify-between px-3 py-2 gap-2">
              <span className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
                {r.runner_name ?? `Runner ${r.runner_id}`}
              </span>
              <span className={cn("text-sm font-bold tabular-nums shrink-0", pnlClass(r.pnl))}>
                {fmt(r.pnl)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FancySection({ markets }: { markets: MarketEntry[] }) {
  if (!markets.length) return null;
  return (
    <div className="flex-1 min-w-0 border-r border-gray-200 last:border-r-0">
      <SectionHeader label="Fancy" />
      <div className="divide-y divide-gray-100">
        {markets.map((m) => (
          <div key={m.market_id} className="flex items-center justify-between px-3 py-2 gap-2">
            <span className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
              {m.market_name ?? `Market ${m.market_id}`}
            </span>
            <span className={cn("text-sm font-bold tabular-nums shrink-0", pnlClass(m.runners[0]?.pnl ?? 0))}>
              {fmt(m.runners[0]?.pnl ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ group }: { group: MatchGroup }) {
  const hasNormal = group.normal.length > 0;
  const hasBookmaker = group.bookmaker.length > 0;
  const hasFancy = group.fancy.length > 0;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      {/* Match header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#174b73]">
        <div className="min-w-0 flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{group.competition_name} / </p>
          <p className="text-sm font-semibold text-white truncate"> {group.event_name}</p>
        </div>
        <div className={cn(
          "text-sm font-bold shrink-0 ml-4",
          group.total_pnl >= 0 ? "text-green-300" : "text-red-300"
        )}>
          {/* {fmt(group.total_pnl)} */}
        </div>
      </div>

      {/* Sections row */}
      <div className="flex divide-x divide-gray-200">
        {hasNormal && <NormalSection markets={group.normal} />}
        {hasFancy && <FancySection markets={group.fancy} />}
        {hasBookmaker && <BookmakerSection markets={group.bookmaker} />}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LiveMarketsSummaryPage() {
  const { data, isLoading, isError, refetch, isFetching } = useLiveMarketsSummary();

  const { eventGroups, totalPnl } = useMemo(() => {
    if (!data?.length) return { eventGroups: [], totalPnl: 0 };

    // event_type_id → match_id → MatchGroup
    const eventMap = new Map<number, Map<number, MatchGroup>>();
    // market_id → MarketEntry (within its match group section)
    const marketEntryMap = new Map<string, MarketEntry>();

    for (const raw of data as any[]) {
      const row: SummaryRow = {
        ...raw,
        pnl: parseFloat(raw.pnl ?? "0"),
      };

      const etId = row.event_type_id ?? 0;
      if (!eventMap.has(etId)) eventMap.set(etId, new Map());

      const matchMap = eventMap.get(etId)!;
      const matchKey = row.match_id ?? 0;

      if (!matchMap.has(matchKey)) {
        matchMap.set(matchKey, {
          match_id: matchKey,
          event_name: row.event_name || `Match ${matchKey}`,
          competition_name: row.competition_name ?? "—",
          normal: [],
          bookmaker: [],
          fancy: [],
          total_pnl: 0,
        });
      }
      const g = matchMap.get(matchKey)!;

      // Find or create MarketEntry
      const mKey = row.market_id;
      if (!marketEntryMap.has(mKey)) {
        const entry: MarketEntry = {
          market_id: mKey,
          market_name: row.market_name,
          runners: [],
        };
        marketEntryMap.set(mKey, entry);

        // Place in the right section
        if (row.market_type === 3) {
          g.bookmaker.push(entry);
        } else if (row.market_type === 4) {
          g.fancy.push(entry);
        } else {
          g.normal.push(entry);
        }
      }

      marketEntryMap.get(mKey)!.runners.push({
        runner_id: row.runner_id,
        runner_name: row.runner_name,
        pnl: row.pnl,
      });
    }

    // Recalculate match total_pnl using worst-case (min runner) per market
    let total = 0;
    for (const [, matchMap] of eventMap) {
      for (const [, g] of matchMap) {
        g.total_pnl = 0;
        for (const m of [...g.normal, ...g.bookmaker]) {
          if (m.runners.length > 0) {
            g.total_pnl += Math.min(...m.runners.map((r) => r.pnl));
          }
        }
        for (const m of g.fancy) g.total_pnl += m.runners[0]?.pnl ?? 0;
        total += g.total_pnl;
      }
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

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-center py-16 text-red-500">
          Failed to load P&L data.{" "}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {!isLoading && !isError && !hasData && (
        <div className="text-center py-16 text-gray-400">
          No P&amp;L data found. Data appears once bets are placed.
        </div>
      )}

      {hasData && (
        <>
          {/* Total P&L card */}
          {/* <div className={cn(
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
            </div>
          </div> */}

          {/* Per event-type breakdown */}
          <div className="space-y-5">
            {eventGroups.map((et) => (
              <div key={et.event_type_id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {eventTypeLabel(et.event_type_id)}
                  </span>
                  {/* <span className={cn("text-xs font-bold", pnlClass(et.total_pnl))}>
                    {fmt(et.total_pnl)}
                  </span> */}
                </div>

                <div className="space-y-3">
                  {et.matches.map((g) => (
                    <MatchCard key={g.match_id} group={g} />
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
