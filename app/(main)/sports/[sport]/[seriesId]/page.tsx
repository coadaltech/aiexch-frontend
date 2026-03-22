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
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">
          <p className="font-semibold">Error Loading Data</p>
          <p className="text-sm">{error?.message || "Failed to fetch data"}</p>
        </div>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  if (!series) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-2">
          Series not found or no matches available.
        </p>
        <Link href={`/sports/${sport}`}>
          <Button variant="outline" className="mt-4">
            Back to Series
          </Button>
        </Link>
      </Card>
    );
  }

  const matches = series.matches || [];
  const liveMatches = matches.filter((m) => m.inPlay === true);
  const nonLiveMatches = matches.filter((m) => m.inPlay !== true);

  const handleMatchClick = (matchId: string) => {
    router.push(`/sports/${sport}/${seriesId}/${matchId}`);
  };

  return (
    <div className="space-y-4 h-full w-full px-4 py-1 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/sports/${sport}`}>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-primary w-fit h-8"
          >
            ← Back to Series
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">{series.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {matches.length} matches • {liveMatches.length} live
        </p>
      </div>

      {liveMatches.length > 0 && (
        <div className="space-y-3 w-full">
          <h2>Live matches</h2>
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
          <h2>Upcoming matches</h2>
          {liveMatches.length > 0 && <div className="border-t my-4"></div>}
          {nonLiveMatches.map((match: any) => (
            <div key={match.id} onClick={() => handleMatchClick(match.id)}>
              <MatchCard match={match} showLive={false} />
            </div>
          ))}
        </div>
      )}

      {matches.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No matches available for this series.
          </p>
        </Card>
      )}
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
