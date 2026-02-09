"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import { Series } from "@/components/sports/types";
import { formatToIST } from "@/lib/date-utils";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";

export default function SeriesMatchesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const router = useRouter();
  const { seriesId } = use(params);
  const { seriesData, loading, error, refetch } = UseSportsSeries("2");

  // Find the specific series
  const series = useMemo(() => {
    return seriesData.find((s: Series) => s.id === seriesId);
  }, [seriesData, seriesId]);

  const isLoading = loading || (seriesData.length === 0 && !error);

  if (isLoading) return <SportsEventsSkeleton />;

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">
          <p className="font-semibold">Error Loading Data</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={refetch} className="mt-4">
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
        <Link href="/sports/cricket">
          <Button variant="outline" className="mt-4">
            Back to Series
          </Button>
        </Link>
      </Card>
    );
  }

  const matches = series.matches || [];

  const handleMatchClick = (matchId: string) => {
    router.push(`/sports/tennis/${seriesId}/${matchId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/sports/cricket">
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
          {matches.length} matches
        </p>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-2">
          {matches.map((match: any, idx: number) => (
            <div
              key={match.id || `${match.name}-${idx}`}
              onClick={() => handleMatchClick(match.id)}
            >
              <MatchCard match={match} seriesName={series.name} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No matches available for this series.
          </p>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------- SIMPLIFIED MATCH CARD ---------------------------- */

function MatchCard({ match, seriesName }: { match: any; seriesName?: string }) {
  const matchName = match.name || "Match";
  const matchDate = match.openDate;
  const matchId = match.id || "N/A";

  return (
    <Card className="bg-secondary/40 backdrop-blur-2xl border rounded-md p-4 hover:bg-secondary/60 transition-colors cursor-pointer">
      <div className="flex flex-col">
        {seriesName && (
          <p className="text-xs text-muted-foreground mb-1">{seriesName}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <h3 className="font-semibold text-sm">{matchName}</h3>
            </div>

            {matchDate ? (
              <p className="text-xs font-medium text-muted-foreground">
                {formatToIST(matchDate)}
              </p>
            ) : (
              <p className="text-xs font-medium text-muted-foreground">
                Date: TBD
              </p>
            )}

            <p className="text-[10px] text-muted-foreground mt-1">
              Match ID: {matchId}
            </p>
          </div>

          <div className="flex items-center">
            <Button size="sm" variant="ghost" className="text-xs">
              View →
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
