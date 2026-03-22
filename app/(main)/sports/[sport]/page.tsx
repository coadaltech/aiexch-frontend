"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useSeries } from "@/hooks/useSportsApi";
import { getSportConfig, isValidSportSlug } from "@/lib/sports-config";

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

  const seriesWithMatches = useMemo(() => {
    return seriesData
      .filter((series) => series.matches && series.matches.length > 0)
      .map((series) => {
        const liveMatches = series.matches.filter((match: Match) => match.inPlay === true);
        const upcomingMatches = series.matches.filter((match: Match) => !match.inPlay);
        return { ...series, liveMatches, upcomingMatches };
      })
      .sort((a, b) => b.liveMatches.length - a.liveMatches.length);
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

  if (seriesWithMatches.length === 0) {
    return (
      <Card className="p-8  mx-4 text-center border bg-card">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-foreground mb-2 font-medium">{config.emptyText}</p>
        <p className="text-sm text-muted-foreground">{config.checkBackText}</p>
      </Card>
    );
  }

  return (
    <div className="w-full h-full px-4 py-1">
      <div className="">
        {seriesWithMatches.map((series) => (
          <SeriesCard key={series.id} series={series} sport={sport} />
        ))}
      </div>
    </div>
  );
}

function SeriesCard({
  series,
  sport,
}: {
  series: Series & { liveMatches: Match[]; upcomingMatches: Match[] };
  sport: string;
}) {
  const formatToIST = (dateString: string | null): string => {
    if (!dateString) return "TBD";
    try {
      const date = new Date(dateString);
      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      };
      return istDate.toLocaleString("en-IN", options);
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <Card className="bg-secondary/40 backdrop-blur-2xl border rounded-lg p-4 hover:bg-secondary/60 transition-all duration-300 cursor-pointer">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">{series.name}</h3>
            {/* <span className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full"> */}
            {/*   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> */}
            {/*   LIVE */}
            {/* </span> */}
          </div>
          {/* <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"> */}
          {/*   ID: {series.id} */}
          {/* </span> */}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {series.matches.length} match{series.matches.length !== 1 ? "es" : ""}
            {series.liveMatches.length > 0 && (
              <> · {series.liveMatches.length} live</>
            )}
          </span>
        </div>
        <div className="space-y-3 pt-2 border-t border-border/50 ">
          {series.liveMatches.map((match) => (
            <Link
              key={match.id}
              href={`/sports/${sport}/${series.id}/${match.id}`}
              className="block"
            >
              <div className="flex items-center justify-between p-2 rounded-md border-b-2 hover:bg-secondary transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">
                      {match.name}
                    </h4>
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                      LIVE
                    </span>
                  </div>
                  {match.openDate && (
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {formatToIST(match.openDate)}
                    </p>
                  )}
                </div>
                <div className="text-xs bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-4">
                  View →
                </div>
              </div>
            </Link>
          ))}
          {series.upcomingMatches.map((match) => (
            <Link
              key={match.id}
              href={`/sports/${sport}/${series.id}/${match.id}`}
              className="block"
            >
              <div className="flex items-center justify-between p-2 rounded-md border-b-2 hover:bg-secondary transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">
                      {match.name}
                    </h4>
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">
                      UPCOMING
                    </span>
                  </div>
                  {match.openDate && (
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {formatToIST(match.openDate)}
                    </p>
                  )}
                </div>
                <div className="text-xs bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-4">
                  View →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
