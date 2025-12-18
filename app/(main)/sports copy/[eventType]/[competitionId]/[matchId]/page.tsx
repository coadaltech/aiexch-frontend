"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useMarketsWithOdds,
  useBookmakersWithOdds,
  useSessions,
  usePremium,
  useMatches,
  useScore,
} from "@/hooks/useSportsApi";
import { MarketList } from "@/components/sports/market-list";
import { SessionsList } from "@/components/sports/sessions-list";
import { PremiumFancyList } from "@/components/sports/premium-fancy-list";
import { SportsMatchDetailSkeleton } from "@/components/skeletons/sports-skeletons";
import Link from "next/link";
import { format } from "date-fns";

export default function MatchPage({
  params,
}: {
  params: Promise<{
    eventType: string;
    competitionId: string;
    matchId: string;
  }>;
}) {
  const { eventType, competitionId, matchId } = use(params);
  const { data: markets, isLoading: marketsLoading } = useMarketsWithOdds(eventType, matchId);
  const { data: bookmakers, isLoading: bookmakersLoading } = useBookmakersWithOdds(eventType, matchId);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(eventType, matchId);
  const { data: premiumFancy, isLoading: premiumLoading } = usePremium(eventType, matchId);
  const { data: matchesResponse, isLoading: matchesLoading } = useMatches(eventType, competitionId);
  const { data: scoreResponse, isLoading: scoreLoading } = useScore(eventType, matchId);
  const marketsData = markets?.data?.data ?? [];
  const bookmakersData = bookmakers?.data?.data ?? [];
  const sessionsData = sessions?.data?.data ?? [];
  const premiumFancyData = premiumFancy?.data?.data ?? [];
  const scoreData = scoreResponse?.data?.data;

  console.log("markets", marketsData);
  console.log("bookmakers data", bookmakersData);

  // Get actual match name from matches data
  const matches = matchesResponse?.data || [];
  const currentMatch = matches.find(
    (match: any) => match.event?.id === matchId
  );
  const matchName =
    currentMatch?.event?.name || decodeURIComponent(matchId).replace(/-/g, " ");
  const matchTime = currentMatch?.event?.openDate;

  // Show loading state if any critical data is loading
  const isLoading = marketsLoading || bookmakersLoading || matchesLoading;
  
  if (isLoading) {
    return <SportsMatchDetailSkeleton />;
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-6">
      <Card>
        <div className="p-4 lg:p-6">
          <div className="flex flex-col gap-2 mb-6">
            <Link href={`/sports/${eventType}/${competitionId}`}>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-primary w-fit"
              >
                ← Back to Matches
              </Button>
            </Link>
          </div>

          {/* Match Info */}
          {marketsData.length > 0 && (
            <div className="mb-6 p-4 bg-muted rounded-md">
              <h1 className="text-foreground text-xl font-bold mb-2">
                {matchName}
              </h1>
              {matchTime && (
                <p className="text-muted-foreground text-sm">
                  Start Time:{" "}
                  {format(new Date(matchTime), "dd MMM yyyy, hh:mm a")}
                </p>
              )}

              {/* Live Score */}
              {scoreData && (
                <div className="mt-4 p-3 bg-background/50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-primary text-sm font-medium">
                      {scoreData.current_inning}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {scoreData.match_format}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {scoreData.teams?.map((team: any, idx: number) => (
                      <div key={idx} className="text-center">
                        <div className="text-foreground font-medium text-sm">
                          {team.team_short_name}
                        </div>
                        <div className="text-primary text-lg font-bold">
                          {team.score}
                        </div>
                      </div>
                    ))}
                  </div>

                  {scoreData.currentRunRate && (
                    <div className="mt-2 text-center">
                      <span className="text-muted-foreground text-xs">
                        CRR: {scoreData.currentRunRate}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <MarketList markets={marketsData} title="Match Odds" isLoading={marketsLoading} />

          <div className="mt-6 lg:mt-8">
            <MarketList markets={bookmakersData} title="Bookmaker" isLoading={bookmakersLoading} />
          </div>

          <div className="mt-6 lg:mt-8">
            <SessionsList sessions={sessionsData} title="Sessions" isLoading={sessionsLoading} />
          </div>

          <div className="mt-6 lg:mt-8">
            <PremiumFancyList
              premiumFancy={premiumFancyData}
              title="Premium Fancy"
              isLoading={premiumLoading}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
