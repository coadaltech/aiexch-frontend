"use client";

import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMatches } from "@/hooks/useSportsApi";
import { MatchList } from "@/components/sports/match-list";
import { SportsMatchesSkeleton } from "@/components/skeletons/sports-skeletons";
import Link from "next/link";

export default function CompetitionPage({
  params,
}: {
  params: Promise<{ eventType: string; competitionId: string }>;
}) {
  const { eventType, competitionId } = use(params);
  const {
    data: matchesResponse,
    isLoading,
    error,
  } = useMatches(eventType, competitionId, true);
  const matches = matchesResponse?.data || [];

  console.log("matches", matches);

  if (isLoading) {
    return <SportsMatchesSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center py-8 text-red-400">
          Failed to load matches. Please try again.
        </div>
      </Card>
    );
  }

  const liveMatches = matches.filter((match: any) => {
    if (!match.event?.openDate) return false;
    const matchDate = new Date(match.event.openDate);
    const now = new Date();
    return matchDate <= now;
  });

  const upcomingMatches = matches.filter((match: any) => {
    if (!match.event?.openDate) return true;
    const matchDate = new Date(match.event.openDate);
    const now = new Date();
    return matchDate > now;
  });

  // Get competition name from first match
  const competitionName = matches[0]?.event?.name
    ? matches[0].event.name.split(" v ")[0].split(" vs ")[0]
    : decodeURIComponent(competitionId).replace(/-/g, " ");

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/sports/${eventType}`}>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
            >
              ← Back to Competitions
            </Button>
          </Link>
        </div>

        {/* Event Details */}
        {matches.length > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-md">
            <h1 className="text-primary text-xl font-bold mb-2">
              {competitionName}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>📊 Total Matches:</span>
                <Badge>{matches.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>🔴 Live:</span>
                <Badge className="bg-red-600 text-white">
                  {liveMatches.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>⏰ Upcoming:</span>
                <Badge className="bg-blue-600 text-white">
                  {upcomingMatches.length}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {liveMatches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-primary text-lg font-semibold mb-4 flex items-center gap-2">
              🔴 Live Matches
            </h3>
            <MatchList
              matches={liveMatches}
              eventType={eventType}
              competitionId={competitionId}
            />
          </div>
        )}

        {upcomingMatches.length > 0 && (
          <div>
            <h3 className="text-primary text-lg font-semibold mb-4 flex items-center gap-2">
              ⏰ Upcoming Matches
            </h3>
            <MatchList
              matches={upcomingMatches}
              eventType={eventType}
              competitionId={competitionId}
            />
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No matches available for this competition.
          </div>
        )}
      </div>
    </Card>
  );
}
