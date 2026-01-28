"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSportsSeries } from "@/contexts/SportsContext";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import { Series } from "@/components/sports/types";
import { ChevronRight } from "lucide-react";

export default function CricketPage() {
  const seriesList = useSportsSeries("4", true) as Series[];
  const [hasWaited, setHasWaited] = useState(false);
  console.log("ss", seriesList);

  useEffect(() => {
    if (seriesList.length > 0) {
      setHasWaited(true);
    }
  }, [seriesList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Filter series that have live or upcoming matches
  const filteredSeries = useMemo(() => {
    return seriesList.filter((series) => {
      if (!series.matches || series.matches.length === 0) return false;

      // Check if series has live matches
      const hasLiveMatches = series.matches.some(
        (match) => match.odds?.[0]?.odds?.inplay === true,
      );

      // Check if series has upcoming matches (not live but has future date)
      const hasUpcomingMatches = series.matches.some((match) => {
        if (match.odds?.[0]?.odds?.inplay === true) return false;
        if (!match.event?.openDate) return false;
        const matchDate = new Date(match.event.openDate);
        const now = new Date();
        return matchDate > now;
      });

      return hasLiveMatches || hasUpcomingMatches;
    });
  }, [seriesList]);

  const isLoading = filteredSeries.length === 0 && !hasWaited;

  if (isLoading) return <SportsEventsSkeleton />;

  if (!filteredSeries.length && hasWaited)
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

  // Separate live and upcoming series
  const liveSeries = filteredSeries.filter((series) =>
    series.matches?.some((match) => match.odds?.[0]?.odds?.inplay === true),
  );

  const upcomingSeries = filteredSeries.filter(
    (series) =>
      !series.matches?.some((match) => match.odds?.[0]?.odds?.inplay === true),
  );

  return (
    <div className="space-y-4">
      {liveSeries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground px-2">
            Live Series
          </h2>
          {liveSeries.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}

      {upcomingSeries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground px-2">
            Upcoming Series
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
  const hasLiveMatches = series.matches?.some(
    (match) => match.odds?.[0]?.odds?.inplay === true,
  );
  const matchCount = series.matches?.length || 0;
  const liveMatchCount =
    series.matches?.filter((match) => match.odds?.[0]?.odds?.inplay === true)
      .length || 0;

  return (
    <Link href={`/sports/cricket/${series.id}`}>
      <Card className="bg-secondary/40 backdrop-blur-2xl border rounded-md p-4 hover:bg-secondary/60 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">{series.name}</h3>
              {hasLiveMatches && (
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
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
