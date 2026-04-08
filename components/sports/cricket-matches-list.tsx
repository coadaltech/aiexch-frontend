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
}

interface MatchWithOdds extends FlatMatch {
  markets: any[] | null;
}

function useAllMatchOdds(matchIds: string[], eventTypeId: string) {
  return useQuery({
    queryKey: ["all-match-odds", eventTypeId, matchIds.join(",")],
    queryFn: async () => {
      if (matchIds.length === 0) return {};

      const results = await Promise.allSettled(
        matchIds.map(async (id) => {
          const res = await sportsApi.getMarketsWithOdds(eventTypeId, id);
          return { id, data: (res.data?.data ?? res.data ?? []) as any[] };
        })
      );

      const map: Record<string, any[]> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          map[result.value.id] = result.value.data;
        }
      }
      return map;
    },
    enabled: matchIds.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

function OddsCell({ back, lay }: { back: number | null; lay: number | null }) {
  return (
    <div className="flex w-[88px] sm:w-[120px] shrink-0">
      <div className="flex-1 bg-back text-center py-3 text-[11px] sm:text-xs font-bold text-black border-l border-white/30">
        {back ?? "-"}
      </div>
      <div className="flex-1 bg-lay text-center py-3 text-[11px] sm:text-xs font-bold text-black border-l border-white/30">
        {lay ?? "-"}
      </div>
    </div>
  );
}

function MatchRow({
  match,
  sport,
  markets,
}: {
  match: FlatMatch;
  sport: string;
  markets: any[] | null;
}) {
  const matchOddsMarket = markets?.find(
    (m: any) => m.marketName === "Match Odds" || m.marketType === "MATCH_ODDS"
  );

  const hasAnyPrice = matchOddsMarket?.runners?.some(
    (r: any) => r.back?.[0]?.price != null || r.lay?.[0]?.price != null
  );
  if (!markets || markets.length === 0 || !hasAnyPrice) return null;

  const hasBookmaker = markets.some(
    (m: any) =>
      m.marketType === "BOOKMAKER" ||
      m.marketName?.toLowerCase().includes("bookmaker")
  );
  const hasFancy = markets.some(
    (m: any) =>
      m.bettingType === "LINE" ||
      m.marketName?.toLowerCase().includes("fancy") ||
      m.marketName?.toLowerCase().includes("session")
  );

  const runners = matchOddsMarket?.runners || [];

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
        {/* Match info — all in one line */}
        <div className="flex-1 min-w-0 py-1.5 px-3 flex items-center gap-1.5">
          <span className="text-[10px] text-black whitespace-nowrap shrink-0">
            {formatToIST(match.openDate)}
          </span>
          <span className="text-gray-300 shrink-0">·</span>
          {match.inPlay ? (
            <span className="flex items-center gap-0.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-[#84c2f1] rounded-full animate-pulse" />
              <span className="text-[10px] text-[#142969] font-bold">LIVE</span>
            </span>
          ) : (
            <span className="text-[10px] text-black truncate hidden sm:block shrink-0 max-w-[120px]">
              {match.seriesName}
            </span>
          )}
          <span className="text-gray-300 shrink-0 hidden sm:inline">·</span>
          <h4 className="font-semibold text-xs text-gray-900 truncate min-w-0">
            {match.name}
          </h4>
          {matchOddsMarket && (
            <span className="text-[8px] bg-[#4090e0]/80 text-white px-1 py-0.5 rounded font-medium shrink-0">O</span>
          )}
          {hasBookmaker && (
            <span className="text-[8px] bg-[#20b888]/80 text-white px-1 py-0.5 rounded font-medium shrink-0">BM</span>
          )}
          {hasFancy && (
            <span className="text-[8px] bg-[#e88030]/80 text-white px-1 py-0.5 rounded font-medium shrink-0">F</span>
          )}
        </div>

        {/* Runner 1 (team 1) */}
        <OddsCell back={team1.back} lay={team1.lay} />

        {/* Draw (hidden on small screens) */}
        <div className="hidden sm:flex w-[120px] shrink-0">
          <div className="flex-1 bg-back text-center py-3 text-xs font-bold text-black border-l border-white/30">
            {draw.back ?? "-"}
          </div>
          <div className="flex-1 bg-lay text-center py-3 text-xs font-bold text-black border-l border-white/30">
            {draw.lay ?? "-"}
          </div>
        </div>

        {/* Runner 2 (team 2) */}
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
}: {
  sport?: string;
  eventTypeId?: string;
  maxMatches?: number;
  emptyText?: string;
}) {
  const {
    data: seriesData = [],
    isLoading: seriesLoading,
  } = useSeries(eventTypeId);

  const allMatches: FlatMatch[] = useMemo(() => {
    const matches: FlatMatch[] = [];
    for (const series of seriesData) {
      if (!series.matches) continue;
      for (const match of series.matches) {
        matches.push({
          id: match.id || match.event?.id,
          name: match.name || match.event?.name || "Unknown",
          openDate: match.openDate || match.event?.openDate || null,
          status: match.status || "UNKNOWN",
          inPlay: match.inPlay ?? false,
          seriesId: series.id,
          seriesName: series.name,
        });
      }
    }
    return matches.sort((a, b) => {
      if (a.inPlay && !b.inPlay) return -1;
      if (!a.inPlay && b.inPlay) return 1;
      const dateA = a.openDate ? new Date(a.openDate).getTime() : 0;
      const dateB = b.openDate ? new Date(b.openDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [seriesData]);

  // Fetch odds for a wider pool so maxMatches is applied after filtering
  const oddsPoolSize = maxMatches ? maxMatches * 4 : allMatches.length;
  const oddsPool = useMemo(
    () => allMatches.slice(0, oddsPoolSize),
    [allMatches, oddsPoolSize]
  );

  const matchIds = useMemo(
    () => oddsPool.map((m) => m.id),
    [oddsPool]
  );

  const { data: oddsMap = {}, isLoading: oddsLoading } = useAllMatchOdds(
    matchIds,
    eventTypeId
  );

  const isLoading = seriesLoading;

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Filter to only matches that have odds data (or odds still loading), then apply maxMatches
  const matchesWithOdds = oddsPool
    .filter((m) => {
      if (oddsLoading) return true; // show all while loading
      const markets = oddsMap[m.id];
      if (!markets || markets.length === 0) return false;
      const mo = markets.find(
        (mk: any) => mk.marketName === "Match Odds" || mk.marketType === "MATCH_ODDS"
      );
      return mo?.runners?.some(
        (r: any) => r.back?.[0]?.price != null || r.lay?.[0]?.price != null
      );
    })
    .slice(0, maxMatches ?? undefined);

  if (matchesWithOdds.length === 0) {
    if (emptyText) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500 text-sm">{emptyText}</p>
          <p className="text-gray-400 text-xs mt-1">Check back later for live action.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="flex items-center bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-[10px] sm:text-xs font-bold font-condensed tracking-wider">
        <div className="flex-1 py-2.5 px-3" />
        <div className="w-[88px] sm:w-[120px] text-center py-2.5">1</div>
        <div className="w-[88px] sm:w-[120px] text-center py-2.5 hidden sm:block">X</div>
        <div className="w-[88px] sm:w-[120px] text-center py-2.5">2</div>
      </div>

      {/* Match rows */}
      <div className="divide-y divide-gray-100 border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
        {matchesWithOdds.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            sport={sport}
            markets={oddsMap[match.id] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
