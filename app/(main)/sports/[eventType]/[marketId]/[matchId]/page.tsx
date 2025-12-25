"use client";
import { use, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketList } from "@/components/sports/market-list";
import { SessionsList } from "@/components/sports/sessions-list";
import { PremiumFancyList } from "@/components/sports/premium-fancy-list";
import { SportsMatchDetailSkeleton } from "@/components/skeletons/sports-skeletons";
import Link from "next/link";
import { format } from "date-fns";
import type { Market } from "@/components/sports/types";
import {
  useSportsOdds,
  useSportsBookmakers,
  useSportsSessions,
  useSportsScore,
  useSportsPremium,
  useSportsMatchDetails,
} from "@/contexts/SportsContext";

export default function MatchPage({
  params,
}: {
  params: Promise<{
    eventType: string;
    marketId: string;
    matchId: string;
  }>;
}) {
  const { eventType, matchId, marketId } = use(params);

  // Use WebSocket for match details instead of API
  const matchDetailsData = useSportsMatchDetails(eventType, matchId, true);
  const matchData = matchDetailsData;

  // Memoize data from WebSocket match details
  const initialMarketsData = useMemo(
    () => (matchData?.matchOdds ?? []) as Market[],
    [matchData?.matchOdds]
  );
  const initialBookmakersData = useMemo(
    () => (matchData?.bookmakers ?? []) as Market[],
    [matchData?.bookmakers]
  );
  const initialSessionsData = useMemo(
    () => matchData?.sessions ?? [],
    [matchData?.sessions]
  );
  const initialPremiumFancyData = useMemo(
    () => matchData?.premium ?? [],
    [matchData?.premium]
  );
  const initialScoreData = useMemo(() => matchData?.score, [matchData?.score]);

  // Get market IDs for WebSocket subscriptions (from match details)
  const marketIdsForStream = useMemo(
    () => initialMarketsData.map((market) => market.marketId).filter(Boolean),
    [initialMarketsData]
  );

  const bookmakerMarketIds = useMemo(
    () =>
      initialBookmakersData.map((market) => market.marketId).filter(Boolean),
    [initialBookmakersData]
  );

  // WebSocket subscriptions for real-time updates (individual data streams)
  const wsOdds = useSportsOdds(
    eventType,
    marketIdsForStream,
    marketIdsForStream.length > 0
  );
  const wsBookmakers = useSportsBookmakers(
    eventType,
    bookmakerMarketIds,
    bookmakerMarketIds.length > 0
  );
  const wsSessions = useSportsSessions(eventType, matchId, true);
  const wsScore = useSportsScore(eventType, matchId, true);
  const wsPremium = useSportsPremium(eventType, matchId, true);

  // Merge initial data with WebSocket updates - use a single effect per data type
  const [liveMarkets, setLiveMarkets] = useState<Market[]>(initialMarketsData);
  const [liveBookmakers, setLiveBookmakers] = useState<Market[]>(
    initialBookmakersData
  );
  const [liveSessions, setLiveSessions] = useState(initialSessionsData);
  const [liveScore, setLiveScore] = useState(initialScoreData);
  const [livePremium, setLivePremium] = useState(initialPremiumFancyData);

  // Initialize with API data first, then update with WebSocket data
  useEffect(() => {
    if (initialMarketsData.length > 0) {
      setLiveMarkets(initialMarketsData);
    }
  }, [initialMarketsData]);

  useEffect(() => {
    if (initialBookmakersData.length > 0) {
      setLiveBookmakers(initialBookmakersData);
    }
  }, [initialBookmakersData]);

  useEffect(() => {
    if (initialSessionsData.length > 0) {
      setLiveSessions(initialSessionsData);
    }
  }, [initialSessionsData]);

  useEffect(() => {
    if (initialScoreData) {
      setLiveScore(initialScoreData);
    }
  }, [initialScoreData]);

  useEffect(() => {
    if (initialPremiumFancyData.length > 0) {
      setLivePremium(initialPremiumFancyData);
    }
  }, [initialPremiumFancyData]);

  // Update with WebSocket data when available (these run after initial data is set)
  useEffect(() => {
    if (wsOdds.length > 0) {
      setLiveMarkets((prev) => {
        // Only update if we have markets to update
        if (prev.length === 0) return prev;
        return prev.map((market) => {
          const wsUpdate = wsOdds.find(
            (odd: any) => odd?.marketId === market.marketId
          );
          return wsUpdate ? { ...market, odds: wsUpdate } : market;
        });
      });
    }
  }, [wsOdds]); // Only depend on wsOdds, not liveMarkets

  useEffect(() => {
    if (wsBookmakers.length > 0) {
      setLiveBookmakers((prev) => {
        // Only update if we have markets to update
        if (prev.length === 0) return prev;
        return prev.map((market) => {
          const wsUpdate = wsBookmakers.find(
            (odd: any) => odd?.marketId === market.marketId
          );
          return wsUpdate ? { ...market, odds: wsUpdate } : market;
        });
      });
    }
  }, [wsBookmakers]);

  useEffect(() => {
    if (wsSessions.length > 0) {
      setLiveSessions(wsSessions);
    }
  }, [wsSessions]);

  useEffect(() => {
    if (wsScore) {
      setLiveScore(wsScore);
    }
  }, [wsScore]);

  useEffect(() => {
    if (wsPremium.length > 0) {
      setLivePremium(wsPremium);
    }
  }, [wsPremium]);

  const matchName =
    matchData?.matchName || decodeURIComponent(matchId).replace(/-/g, " ");
  const matchTime = matchData?.matchTime;
  const orderedMarkets = useMemo<Market[]>(() => {
    if (!liveMarkets?.length || !marketId) return liveMarkets;
    const primary = liveMarkets.find((market) => market.marketId === marketId);
    if (!primary) return liveMarkets;
    return [primary, ...liveMarkets.filter((mkt) => mkt.marketId !== marketId)];
  }, [marketId, liveMarkets]);
  const shouldShowDraw = eventType !== "1";
  // Loading state - check if match details data is available
  const isLoading = !matchData && initialMarketsData.length === 0;

  // Check if we have market IDs for streaming
  const hasMarketIds =
    marketIdsForStream.length > 0 || bookmakerMarketIds.length > 0;
  const hasNoData = !matchData && !isLoading;

  if (isLoading) {
    return <SportsMatchDetailSkeleton />;
  }

  // Fallback message when no data is available
  if (
    hasNoData ||
    (!hasMarketIds && !liveMarkets.length && !liveBookmakers.length)
  ) {
    return (
      <div className="min-h-screen pb-20 lg:pb-6">
        <div className="p-3">
          <div className="flex flex-col gap-1 mb-3">
            <Link href={`/sports/${eventType}`}>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-primary w-fit h-8"
              >
                ← Back to Matches
              </Button>
            </Link>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-2">
              {!hasMarketIds
                ? "No market data available for this match."
                : "Match data is not available at the moment."}
            </p>
            <p className="text-sm text-muted-foreground">
              Please try again later or check back soon.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-6">
      <div className="p-3">
        <div className="flex flex-col gap-1 mb-3">
          <Link href={`/sports/${eventType}`}>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-primary w-fit h-8"
            >
              ← Back to Matches
            </Button>
          </Link>
        </div>

        {/* Match Info */}
        {liveMarkets.length > 0 && (
          <div className="mb-3 p-3 bg-muted rounded-md">
            <h1 className="text-foreground text-base font-bold mb-1">
              {matchName}
            </h1>
            {matchTime && (
              <p className="text-muted-foreground text-xs">
                {format(new Date(matchTime), "dd MMM yyyy, hh:mm a")}
              </p>
            )}

            {/* Live Score */}
            {liveScore && (
              <div className="mt-2 p-2 bg-background/50 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-primary text-xs font-medium">
                    {liveScore.current_inning}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {liveScore.match_format}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {liveScore.teams?.map((team: any, idx: number) => (
                    <div key={idx} className="text-center">
                      <div className="text-foreground font-medium text-xs">
                        {team.team_short_name}
                      </div>
                      <div className="text-primary text-sm font-bold">
                        {team.score}
                      </div>
                    </div>
                  ))}
                </div>

                {liveScore.currentRunRate && (
                  <div className="mt-1 text-center">
                    <span className="text-muted-foreground text-xs">
                      CRR: {liveScore.currentRunRate}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {liveMarkets.length > 0 ? (
          <MarketList
            markets={liveMarkets}
            title="Match Odds"
            isLoading={isLoading}
            showLay={matchData?.showLay}
            showDraw={shouldShowDraw}
            collapsible={false}
          />
        ) : marketIdsForStream.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-muted-foreground text-sm">
              No match odds available. Market data is still loading...
            </p>
          </Card>
        ) : null}

        {liveBookmakers.length > 0 ? (
          <div className="mt-3">
            <MarketList
              markets={liveBookmakers}
              title="Bookmaker"
              isLoading={isLoading}
              collapsible={false}
            />
          </div>
        ) : bookmakerMarketIds.length === 0 &&
          initialBookmakersData.length === 0 ? null : (
          <div className="mt-3">
            <Card className="p-4 text-center">
              <p className="text-muted-foreground text-sm">
                Bookmaker data is loading...
              </p>
            </Card>
          </div>
        )}

        {liveSessions.length > 0 ? (
          <div className="mt-3">
            <SessionsList
              sessions={liveSessions}
              title="Sessions"
              isLoading={isLoading}
              collapsible={false}
            />
          </div>
        ) : (
          <div className="mt-3">
            <Card className="p-4 text-center">
              <p className="text-muted-foreground text-sm">
                No session data available for this match.
              </p>
            </Card>
          </div>
        )}

        {livePremium.length > 0 ? (
          <div className="mt-3">
            <PremiumFancyList
              premiumFancy={livePremium}
              title="Premium Fancy"
              isLoading={isLoading}
              collapsible={false}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
