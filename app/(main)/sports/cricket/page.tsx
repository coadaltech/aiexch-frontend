"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import { PlayCircle, Trophy } from "lucide-react";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";
import { Button } from "@/components/ui/button";
import { EventTypeById } from "@/types";

// Types (keep as is)
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
  inPlay: boolean;
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
  // Fetch series data from API
  const { seriesData, loading, error, refetch } = UseSportsSeries("4");
  // localStorage.setItem("current_sports", "cricket")
  // localStorage.setItem("current_sports_id", EventTypeById.cricket.toString())

  // Format date to Indian Standard Time (IST)


  // Process series data to show only series with live matches
  const seriesWithLiveMatches = useMemo(() => {
    return seriesData
      .filter((series) => {
        // Only include series that have matches
        if (!series.matches || series.matches.length === 0) return false;

        // Check if this series has any live matches
        return series.matches.some((match) => match.inPlay === true);
      })
      .map((series) => {
        // Filter only live matches for this series
        const liveMatches = series.matches.filter(
          (match) => match.inPlay === true,
        );

        return {
          ...series,
          liveMatches,
        };
      })
      .sort((a, b) => b.liveMatches.length - a.liveMatches.length); // Sort by number of live matches
  }, [seriesData]);

  // Calculate totals
  const totalLiveMatches = useMemo(() => {
    return seriesWithLiveMatches.reduce(
      (total, series) => total + series.liveMatches.length,
      0,
    );
  }, [seriesWithLiveMatches]);

  // Show loader until data arrives
  if (loading) {
    return <SportsEventsSkeleton />;
  }

  // Show error if request failed
  if (error) {
    return (
      <Card className="p-8 text-center border border-destructive/20 bg-destructive/5">
        <div className="text-destructive mb-2">
          <p className="font-semibold">Error Loading Data</p>
          <p className="text-sm">{error}</p>
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

  // Show empty state if no live matches
  if (seriesWithLiveMatches.length === 0) {
    return (
      <Card className="p-8 text-center border bg-card">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-foreground mb-2 font-medium">
          No live cricket matches at the moment.
        </p>
        <p className="text-sm text-muted-foreground">
          Check back later for live action.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Live Matches Count Badge */}
      {totalLiveMatches > 0 && (
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-full shadow-md">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Live Now: {totalLiveMatches} matches</span>
          </div>
        </div>
      )}

      {/* Series List */}
      <div className="space-y-4">
        {seriesWithLiveMatches.map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
      </div>

      {/* View All Series Link */}
      {/* <div className="text-center pt-4">
        <Link
          href="/sports/cricket/all-series"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View all cricket series
          <PlayCircle className="h-4 w-4" />
        </Link>
      </div> */}
    </div>
  );
}

function SeriesCard({ series }: { series: Series & { liveMatches: Match[] } }) {

  const formatToIST = (dateString: string | null): string => {
    if (!dateString) return "TBD";

    try {
      const date = new Date(dateString);

      // Convert to IST (UTC+5:30)
      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);

      // Format options
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      };

      return istDate.toLocaleString("en-IN", options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };
  return (
    <Card className="bg-secondary/40 backdrop-blur-2xl border rounded-lg p-4 hover:bg-secondary/60 transition-all duration-300 cursor-pointer">
      <div className="flex flex-col gap-3">
        {/* Series Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">
              {series.name}
            </h3>
            <span className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              LIVE
            </span>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            ID: {series.id}
          </span>
        </div>

        {/* Series Info */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {series.liveMatches.length} live match
            {series.liveMatches.length !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Matches List */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          {series.liveMatches.map((match) => (
            <Link
              key={match.id}
              href={`/sports/cricket/${series.id}/${match.id}`}
              className="block"
            >
              <div className="flex items-center justify-between p-3 rounded-md bg-background/50 hover:bg-background/80 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">
                      {match.name}
                    </h4>
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                      LIVE
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Match ID: {match.id}</span>
                  </div>

                  {match.openDate && (
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {formatToIST(match.openDate)}
                    </p>
                  )}
                </div>
                <div className="text-xs bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-4">
                  View →
                </div>{" "}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}

