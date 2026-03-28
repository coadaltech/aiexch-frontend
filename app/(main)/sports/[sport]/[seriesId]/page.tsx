"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Series } from "@/components/sports/types";
import { formatToIST } from "@/lib/date-utils";
import { useSeries } from "@/hooks/useSportsApi";
import { getSportConfig, isValidSportSlug } from "@/lib/sports-config";

function SportPoster({
  config,
  sport,
  children,
}: {
  config: { poster: string; title: string };
  sport: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full h-36 sm:h-48 overflow-hidden rounded-b-xl">
      <img
        src={config.poster}
        alt={config.title}
        className="w-full h-full object-fit bg-top"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <Link href={`/sports/${sport}`}>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 w-fit h-7 px-2 mb-1 text-xs"
          >
            ← Back to Series
          </Button>
        </Link>
        {children}
      </div>
    </div>
  );
}

export default function SeriesMatchesPage({
  params,
}: {
  params: Promise<{ sport: string; seriesId: string }>;
}) {
  const router = useRouter();
  const { sport, seriesId } = use(params);
  const config = getSportConfig(sport);

  if (!config || !isValidSportSlug(sport)) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive font-semibold">Sport not found</p>
        <Link href="/sports">
          <Button variant="outline" className="mt-4">
            Back to Sports
          </Button>
        </Link>
      </Card>
    );
  }

  const { data: seriesData = [], isLoading: loading, error, refetch } = useSeries(config.eventTypeId);

  const series = useMemo(() => {
    return seriesData.find((s: Series) => String(s.id) === String(seriesId));
  }, [seriesData, seriesId]);

  if (loading) {
    return (
      <div className="h-full w-full pb-10">
        <SportPoster config={config} sport={sport}>
          <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse mt-2" />
        </SportPoster>
        <div className="px-4 mt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full pb-10">
        <SportPoster config={config} sport={sport}>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Error</h1>
        </SportPoster>
        <div className="px-4 mt-6">
          <Card className="p-8 text-center">
            <div className="text-red-500 mb-2">
              <p className="font-semibold">Error Loading Data</p>
              <p className="text-sm">{error?.message || "Failed to fetch data"}</p>
            </div>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="h-full w-full pb-10">
        <SportPoster config={config} sport={sport}>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Series Not Found</h1>
        </SportPoster>
        <div className="px-4 mt-6 text-center">
          <p className="text-muted-foreground text-lg">
            No matches available for this series.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Check back later for live action.
          </p>
        </div>
      </div>
    );
  }

  const matches = series.matches || [];
  const liveMatches = matches.filter((m) => m.inPlay === true);
  const nonLiveMatches = matches.filter((m) => m.inPlay !== true);

  const handleMatchClick = (matchId: string) => {
    router.push(`/sports/${sport}/${seriesId}/${matchId}`);
  };

  return (
    <div className="h-full w-full pb-10">
      {/* Sport Poster Banner */}
      <SportPoster config={config} sport={sport}>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{series.name}</h1>
        <p className="text-sm text-white/70 mt-0.5">
          {matches.length} matches • {liveMatches.length} live
        </p>
      </SportPoster>

      <div className="px-4 mt-4 space-y-4">
        {liveMatches.length > 0 && (
          <div className="space-y-3 w-full">
            <h2 className="text-foreground font-semibold">Live matches</h2>
            {liveMatches.map((match: any) => {
              if (new Date(match.openDate).getDate() < new Date().getDate()) {
                return null;
              }
              return (
                <div key={match.id} onClick={() => handleMatchClick(match.id)}>
                  <MatchCard match={match} showLive={true} />
                </div>
              );
            })}
          </div>
        )}

        {nonLiveMatches.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-foreground font-semibold">Upcoming matches</h2>
            {liveMatches.length > 0 && <div className="border-t my-4"></div>}
            {nonLiveMatches.map((match: any) => (
              <div key={match.id} onClick={() => handleMatchClick(match.id)}>
                <MatchCard match={match} showLive={false} />
              </div>
            ))}
          </div>
        )}

        {matches.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              No matches available for this series.
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Check back later for live action.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, showLive }: { match: any; showLive: boolean }) {
  const matchName = match.name || "Match";
  const matchDate = match.openDate;

  return (
    <Card className="bg-secondary/40 backdrop-blur-2xl border rounded-md p-4 hover:bg-secondary/60 transition-colors cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{matchName}</h3>
            {showLive && (
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
          {matchDate && (
            <p className="text-xs font-medium text-muted-foreground">
              {formatToIST(matchDate)}
            </p>
          )}
        </div>
        <Button size="sm" variant="ghost" className="text-xs">
          View →
        </Button>
      </div>
    </Card>
  );
}
