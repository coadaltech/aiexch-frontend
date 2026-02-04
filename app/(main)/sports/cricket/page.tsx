"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import { ChevronRight } from "lucide-react";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";

// Types
export interface Series {
  id: string;
  name: string;
  eventTypeId: string;
  matches: Match[];
}

export interface Match {
  id: string;
  name: string;
  openDate: string | null;
  status: string;
  odds: Odds[];
}

export interface Odds {
  marketId: string;
  marketTime: string;
  marketType: string;
  bettingType: string;
  marketName: string;
  provider: string;
  status: string;
  inPlay: boolean;
  marketCondition: MarketCondition;
  runners: Runner[];
  odds: MarketOdds | null;
}

export interface MarketCondition {
  marketId: string;
  betLock: boolean;
  minBet: number;
  maxBet: number;
  maxProfit: number;
  betDelay: number;
  mtp: number;
  allowUnmatchBet: boolean;
  potLimit: number;
  volume: number;
}

export interface Runner {
  id: number;
  name: string;
  sortPriority: number;
  metadata: any;
}

export interface MarketOdds {
  marketId: string;
  betDelay: number;
  status: string;
  inPlay: boolean;
  lastMatchTime: string | null;
  updateTime: number;
  sportingEvent: boolean;
  runners: OddsRunner[];
}

export interface OddsRunner {
  selectionId: number;
  status: string;
  back: PriceSize[];
  lay: PriceSize[];
  pnl: number;
}

export interface PriceSize {
  price: number;
  size: number;
}

export default function CricketPage() {
  const { seriesData, loading, error, refetch } = UseSportsSeries("4");

  // Filter series with live or upcoming matches
  const filteredSeries = useMemo(() => {
    return seriesData.filter((series) => {
      if (!series.matches || series.matches.length === 0) return false;

      const hasLiveMatches = series.matches.some((match) =>
        match.odds?.some((odd) => odd.inPlay === true),
      );

      const hasUpcomingMatches = series.matches.some((match) => {
        const isLive = match.odds?.some((odd) => odd.inPlay === true);
        if (isLive) return false;

        if (!match.openDate) return true;

        try {
          return new Date(match.openDate) > new Date();
        } catch {
          return false;
        }
      });

      return hasLiveMatches || hasUpcomingMatches;
    });
  }, [seriesData]);

  // Separate live and upcoming series
  const liveSeries = useMemo(
    () =>
      filteredSeries.filter((series) =>
        series.matches?.some((match) =>
          match.odds?.some((odd) => odd.inPlay === true),
        ),
      ),
    [filteredSeries],
  );

  const upcomingSeries = useMemo(
    () =>
      filteredSeries.filter((series) =>
        series.matches?.some((match) => {
          const isLive = match.odds?.some((odd) => odd.inPlay === true);
          if (isLive) return false;

          if (match.openDate) {
            try {
              return new Date(match.openDate) > new Date();
            } catch {
              return false;
            }
          }
          return true;
        }),
      ),
    [filteredSeries],
  );

  // Show loader until data arrives
  if (loading) {
    return <SportsEventsSkeleton />;
  }

  // Show error if request failed
  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">
          <p className="font-semibold">Error Loading Data</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          Retry
        </button>
      </Card>
    );
  }

  // Show empty state if no series found
  if (filteredSeries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-2">
          No live or upcoming cricket series available at the moment.
        </p>
        <p className="text-sm text-muted-foreground">
          Please check back later.
        </p>
      </Card>
    );
  }

  // Display the series
  return (
    <div className="space-y-4">
      {liveSeries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground px-2">
            Live Series ({liveSeries.length})
          </h2>
          {liveSeries.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}

      {upcomingSeries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground px-2">
            Upcoming Series ({upcomingSeries.length})
          </h2>
          {upcomingSeries.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}
    </div>
  );
}

function SeriesCard({ series }: { series: Series }) {
  const hasLiveMatches = series.matches?.some((match) =>
    match.odds?.some((odd) => odd.inPlay === true),
  );

  const matchCount = series.matches?.length || 0;

  const liveMatchCount =
    series.matches?.filter((match) =>
      match.odds?.some((odd) => odd.inPlay === true),
    ).length || 0;

  return (
    <Link href={`/sports/cricket/${series.id}`}>
      <Card className="bg-secondary/40 backdrop-blur-2xl border rounded-md p-4 hover:bg-secondary/60 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">{series.name}</h3>
              {hasLiveMatches && (
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {liveMatchCount > 0 && `${liveMatchCount} live`}
              {liveMatchCount > 0 && matchCount > liveMatchCount && " • "}
              {matchCount > liveMatchCount &&
                `${matchCount - liveMatchCount} upcoming`}
              {matchCount === 0 && "No matches"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
