"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSeries } from "@/hooks/useSportsApi";
import { sportsApi } from "@/lib/api";

const EVENT_TYPE_CRICKET = "4";

const formatToIST = (dateString: string | null): string => {
  if (!dateString) return "TBD";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
};

interface FlatMatch {
  id: string;
  name: string;
  openDate: string | null;
  status: string;
  inPlay: boolean;
  seriesId: string;
  seriesName: string;
  defaultMarketId: string | null;
}

function useBetCounts(matchIds: string[]) {
  return useQuery({
    queryKey: ["bet-counts", matchIds.join(",")],
    queryFn: async () => {
      if (matchIds.length === 0) return {} as Record<string, number>;
      const res = await sportsApi.getBetCounts(matchIds);
      return (res.data?.data ?? {}) as Record<string, number>;
    },
    enabled: matchIds.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/**
 * For each match call getMarketsWithOdds(eventTypeId, eventId) — the same
 * endpoint the match detail page uses, so we know it works.
 * We then pick the market whose marketId matches defaultMarketId (falling back
 * to the first market if no exact match), and store only that market's runners.
 */
function useMatchOdds(
  matches: Array<{ id: string; defaultMarketId: string }>,
  eventTypeId: string
) {
  return useQuery({
    queryKey: [
      "match-list-odds",
      eventTypeId,
      matches.map((m) => m.id).join(","),
    ],
    queryFn: async () => {
      if (matches.length === 0) return {} as Record<string, any>;

      const results = await Promise.allSettled(
        matches.map(async ({ id, defaultMarketId }) => {
          const res = await sportsApi.getMarketsWithOdds(eventTypeId, id);
          const markets: any[] = res.data?.data ?? res.data ?? [];

          // Pick the market whose marketId matches the stored defaultMarketId.
          // Fall back to the first market in the list if no exact match.
          const market =
            markets.find((m: any) => m.marketId === defaultMarketId) ??
            markets[0] ??
            null;

          return { id, market };
        })
      );

      const map: Record<string, any> = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.market) {
          map[result.value.id] = result.value.market;
        }
      }
      return map;
    },
    enabled: matches.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    placeholderData: (prev: Record<string, any> | undefined) => prev,
  });
}

function OddsCell({ back, lay }: { back: number | null; lay: number | null }) {
  return (
    <div className="flex shrink-0">
      <div className="w-24 bg-gradient-to-b from-back to-back-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
        {back ?? "-"}
      </div>
      <div className="w-24 bg-gradient-to-b from-lay to-lay-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
        {lay ?? "-"}
      </div>
    </div>
  );
}

function MatchRow({
  match,
  sport,
  market,
  betCount,
}: {
  match: FlatMatch;
  sport: string;
  market: any | null; // one market object from getMarketsWithOdds
  betCount?: number;
}) {
  // getMarketsWithOdds runners have back[]/lay[] arrays same as match detail page
  const runners: any[] = market?.runners ?? [];

  const getRunnerPrice = (index: number) => {
    const runner = runners[index];
    if (!runner) return { back: null, lay: null };
    return {
      back: runner.back?.[0]?.price ?? null,
      lay: runner.lay?.[0]?.price ?? null,
    };
  };

  const team1 = getRunnerPrice(0);
  const draw =
    runners.length >= 3 ? getRunnerPrice(1) : { back: null, lay: null };
  const team2 = getRunnerPrice(runners.length >= 3 ? 2 : 1);

  return (
    <Link
      href={`/sports/${sport}/${match.seriesId}/${match.id}`}
      className="block bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center">
        <div className="flex-1 min-w-0 py-1.5 px-3 flex items-center">
          <span className="text-[16px] font-bold text-black whitespace-nowrap shrink-0">
            {formatToIST(match.openDate)}
          </span>
          <span className="text-gray-300 shrink-0">·</span>
          
          <span className="text-gray-300 shrink-0 hidden sm:inline">·</span>
          <h4 className="text-[16px] mr-2 font-bold text-black truncate min-w-0">
            {match.name}
          </h4>
          <span className="text-[12px] mr-1 bg-[#4090e0]/80 text-white px-1 py-0.5 rounded font-medium shrink-0">
            O
          </span>
          {match.inPlay ? (
            <span className="flex items-center gap-0.5 shrink-0">
              <span className="w-2.5 h-2.5 bg-[#84c2f1] rounded-full animate-pulse" />
              <span className="text-[18px] text-[#142969] font-bold">LIVE</span>
            </span>
          ) : (
            <span />
          )}
          {betCount != null && betCount > 0 && (
            <span className="relative ml-56 shrink-0 group">
              <span className="text-[14px] text-black bg-yellow-500 p-1 font-medium whitespace-nowrap cursor-default">
                {betCount}
              </span>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                {betCount} matched bets
              </span>
            </span>
          )}
        </div>

        <OddsCell back={team1.back} lay={team1.lay} />

        <div className="hidden sm:flex shrink-0">
          <div className="w-24 bg-gradient-to-b from-back to-back-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
            {draw.back ?? "-"}
          </div>
          <div className="w-24 bg-gradient-to-b from-lay to-lay-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
            {draw.lay ?? "-"}
          </div>
        </div>

        <OddsCell back={team2.back} lay={team2.lay} />
      </div>
    </Link>
  );
}

export function CricketMatchesList({
  sport = "cricket",
  eventTypeId = EVENT_TYPE_CRICKET,
  maxMatches,
  emptyText,
  showHeader = true,
}: {
  sport?: string;
  eventTypeId?: string;
  maxMatches?: number;
  emptyText?: string;
  showHeader?: boolean;
}) {
  const { data: seriesData = [], isLoading: seriesLoading } =
    useSeries(eventTypeId);

  // Start of today in IST (Asia/Kolkata = UTC+5:30).
  // Events on today's date are included even if their time has already passed.
  // Recomputed once per mount — fine, changes at most once per day.
  const startOfTodayIST = useMemo(() => {
    // "en-CA" gives YYYY-MM-DD format
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    // Parse as midnight IST
    return new Date(`${todayStr}T00:00:00+05:30`).getTime();
  }, []);

  // Politics events often have old/fixed openDates — show them all.
  const isPolitics = eventTypeId === "500";

  const allMatches: FlatMatch[] = useMemo(() => {
    const matches: FlatMatch[] = [];

    for (const series of seriesData) {
      if (!series.matches) continue;

      for (const match of series.matches) {
        // Only include events that have a defaultMarketId registered in the DB
        const defaultMarketId: string | null =
          match.defaultMarketId ?? match.event?.defaultMarketId ?? null;
        if (!defaultMarketId) continue;

        const openDate: string | null =
          match.openDate ?? match.event?.openDate ?? null;
        const inPlay: boolean = match.inPlay ?? false;

        // For non-politics sports: skip any event whose openDate is before
        // the start of today in IST — no exceptions, even for inPlay events,
        // because stale DB records can have inPlay=true on old matches.
        if (!isPolitics && openDate) {
          const t = new Date(openDate).getTime();
          if (!isNaN(t) && t < startOfTodayIST) continue;
        }

        matches.push({
          id: match.id ?? match.event?.id,
          name: match.name ?? match.event?.name ?? "Unknown",
          openDate,
          status: match.status ?? "UNKNOWN",
          inPlay,
          seriesId: series.id,
          seriesName: series.name,
          defaultMarketId,
        });
      }
    }

    // Sort: live first → upcoming soonest
    return matches.sort((a, b) => {
      if (a.inPlay && !b.inPlay) return -1;
      if (!a.inPlay && b.inPlay) return 1;
      const dateA = a.openDate ? new Date(a.openDate).getTime() : Infinity;
      const dateB = b.openDate ? new Date(b.openDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [seriesData, startOfTodayIST, isPolitics]);

  // Fetch odds for ALL date-filtered candidates — never pre-slice by maxMatches.
  // This ensures home page sections don't miss events with active prices
  // that happen to sit beyond the first N in the sorted list.
  const oddsInput = useMemo(
    () =>
      allMatches.map((m) => ({
        id: m.id,
        defaultMarketId: m.defaultMarketId!,
      })),
    [allMatches]
  );

  const matchIds = useMemo(() => allMatches.map((m) => m.id), [allMatches]);

  const { data: marketMap = {}, isLoading: oddsLoading } = useMatchOdds(
    oddsInput,
    eventTypeId
  );
  const { data: betCountMap = {} } = useBetCounts(matchIds);

  if (seriesLoading || (oddsLoading && Object.keys(marketMap).length === 0)) {
    return (
      <div className="space-y-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Keep only events that have at least one real price, then apply maxMatches.
  // Filtering first means home page always fills up to maxMatches from the
  // full pool rather than only checking the first N events.
  const visibleMatches = allMatches
    .filter((m) => {
      const market = marketMap[m.id];
      if (!market) return false;
      const runners: any[] = market.runners ?? [];
      return runners.some(
        (r: any) => r.back?.[0]?.price != null || r.lay?.[0]?.price != null
      );
    })
    .slice(0, maxMatches ?? undefined);

  if (visibleMatches.length === 0) {
    if (emptyText) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500 text-sm">{emptyText}</p>
          <p className="text-gray-400 text-xs mt-1">
            Check back later for live action.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-sm">
      {showHeader && (
        <div className="flex items-center bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-[10px] sm:text-xs font-bold font-condensed tracking-wider">
          <div className="flex-1 py-2.5 px-3" />
          <div className="w-48 text-center py-2.5">1</div>
          <div className="w-48 text-center py-2.5 hidden sm:block">X</div>
          <div className="w-48 text-center py-2.5">2</div>
        </div>
      )}

      <div className="divide-y divide-gray-100 border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
        {visibleMatches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            sport={sport}
            market={marketMap[match.id] ?? null}
            betCount={betCountMap[match.id]}
          />
        ))}
      </div>
    </div>
  );
}
