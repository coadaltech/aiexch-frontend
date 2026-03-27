"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSeries } from "@/hooks/useSportsApi";
import { sportsApi } from "@/lib/api";
import { getSportConfig, isValidSportSlug } from "@/lib/sports-config";

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

export default function SportPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = use(params);
  const config = getSportConfig(sport);

  if (!config || !isValidSportSlug(sport)) {
    return (
      <Card className="p-8 text-center border border-destructive/20 bg-destructive/5">
        <p className="text-destructive font-semibold">Sport not found</p>
        <p className="text-muted-foreground text-sm mt-1">
          The sport &quot;{sport}&quot; is not available.
        </p>
        <Link href="/sports" className="mt-4 inline-block text-primary hover:underline">
          ← Back to Sports
        </Link>
      </Card>
    );
  }

  const { data: seriesData = [], isLoading: loading, error, refetch } = useSeries(config.eventTypeId);

  // Flatten all matches, sorted: live first then by date
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

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full mt-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading sports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center border border-destructive/20 bg-destructive/5">
        <div className="text-destructive mb-2">
          <p className="font-semibold">Error Loading Data</p>
          <p className="text-sm">{error?.message || "Failed to fetch data"}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (allMatches.length === 0) {
    return (
      <Card className="p-8 mx-4 text-center border bg-card">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-foreground mb-2 font-medium">{config.emptyText}</p>
        <p className="text-sm text-muted-foreground">{config.checkBackText}</p>
      </Card>
    );
  }

  return (
    <div className="w-full h-full px-2 sm:px-4 py-1">
      {/* Header row */}
      <div className="flex items-center bg-[#2AABA4] text-white text-[10px] sm:text-xs font-bold rounded-t-lg overflow-hidden">
        <div className="flex-1 py-2 px-3" />
        <div className="w-[88px] sm:w-[120px] text-center py-2">1</div>
        <div className="w-[88px] sm:w-[120px] text-center py-2 hidden sm:block">x</div>
        <div className="w-[88px] sm:w-[120px] text-center py-2">2</div>
      </div>

      {/* Match rows */}
      <div className="border border-border/30 rounded-b-lg overflow-hidden divide-y divide-border/20">
        {allMatches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            sport={sport}
            eventTypeId={config.eventTypeId}
          />
        ))}
      </div>
    </div>
  );
}

/** Each match row fetches its own odds */
function MatchRow({
  match,
  sport,
  eventTypeId,
}: {
  match: FlatMatch;
  sport: string;
  eventTypeId: string;
}) {
  // Fetch odds for this match
  const { data: marketsData } = useQuery({
    queryKey: ["match-odds-list", match.id],
    queryFn: async () => {
      const res = await sportsApi.getMarketsWithOdds(eventTypeId, match.id);
      return (res.data?.data ?? res.data ?? []) as any[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Find the Match Odds market
  const matchOddsMarket = marketsData?.find(
    (m: any) => m.marketName === "Match Odds" || m.marketType === "MATCH_ODDS"
  );

  // Hide row if no market data or no Match Odds with actual prices
  const hasAnyPrice = matchOddsMarket?.runners?.some(
    (r: any) => (r.back?.[0]?.price != null) || (r.lay?.[0]?.price != null)
  );
  if (!marketsData || marketsData.length === 0 || !hasAnyPrice) return null;

  const hasBookmaker = marketsData?.some(
    (m: any) =>
      m.marketType === "BOOKMAKER" ||
      m.marketName?.toLowerCase().includes("bookmaker")
  );
  const hasFancy = marketsData?.some(
    (m: any) =>
      m.bettingType === "LINE" ||
      m.marketName?.toLowerCase().includes("fancy") ||
      m.marketName?.toLowerCase().includes("session")
  );

  const runners = matchOddsMarket?.runners || [];

  // Build price data: positions 0=team1, 1=draw, 2=team2
  // For 2-runner markets (cricket), draw column stays empty
  const getRunnerPrice = (index: number) => {
    const runner = runners[index];
    if (!runner) return { back: null, lay: null };
    return {
      back: runner.back?.[0]?.price ?? null,
      lay: runner.lay?.[0]?.price ?? null,
    };
  };

  const team1 = getRunnerPrice(0);
  const draw = runners.length >= 3 ? getRunnerPrice(1) : { back: null, lay: null };
  const team2 = getRunnerPrice(runners.length >= 3 ? 2 : 1);

  return (
    <Link
      href={`/sports/${sport}/${match.seriesId}/${match.id}`}
      className="block bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
    >
      <div className="flex items-center">
        {/* Match info */}
        <div className="flex-1 min-w-0 py-2 px-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
              {formatToIST(match.openDate)}
            </span>
            <span className="text-muted-foreground text-[10px]">|</span>
            {match.inPlay && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-green-400 font-semibold hidden sm:inline">
                  {match.seriesName}
                </span>
              </span>
            )}
            {!match.inPlay && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {match.seriesName}
              </span>
            )}
            {match.inPlay && (
              <span className="text-[10px] text-red-500 font-bold ml-1">Live Now</span>
            )}
          </div>
          <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate mt-0.5">
            {match.name}
          </h4>
          {/* Market badges */}
          <div className="flex gap-1 mt-0.5">
            {matchOddsMarket && (
              <span className="text-[8px] sm:text-[9px] bg-sky-600/80 text-white px-1 py-0.5 rounded font-medium">O</span>
            )}
            {hasBookmaker && (
              <span className="text-[8px] sm:text-[9px] bg-emerald-600/80 text-white px-1 py-0.5 rounded font-medium">BM</span>
            )}
            {hasFancy && (
              <span className="text-[8px] sm:text-[9px] bg-orange-500/80 text-white px-1 py-0.5 rounded font-medium">F</span>
            )}
          </div>
        </div>

        {/* Runner 1 (team 1) */}
        <OddsCell back={team1.back} lay={team1.lay} />

        {/* Draw (hidden on small screens) */}
        <div className="hidden sm:flex w-[120px] shrink-0">
          <div className="flex-1 bg-[#72BBEF] text-center py-3 text-xs font-bold text-black border-l border-white/30">
            {draw.back ?? "-"}
          </div>
          <div className="flex-1 bg-[#FAA9BA] text-center py-3 text-xs font-bold text-black border-l border-white/30">
            {draw.lay ?? "-"}
          </div>
        </div>

        {/* Runner 2 (team 2) */}
        <OddsCell back={team2.back} lay={team2.lay} />
      </div>
    </Link>
  );
}

function OddsCell({ back, lay }: { back: number | null; lay: number | null }) {
  return (
    <div className="flex w-[88px] sm:w-[120px] shrink-0">
      <div className="flex-1 bg-[#72BBEF] text-center py-3 text-[11px] sm:text-xs font-bold text-black border-l border-white/30">
        {back ?? "-"}
      </div>
      <div className="flex-1 bg-[#FAA9BA] text-center py-3 text-[11px] sm:text-xs font-bold text-black border-l border-white/30">
        {lay ?? "-"}
      </div>
    </div>
  );
}
