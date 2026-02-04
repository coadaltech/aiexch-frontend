"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import { Series, Match } from "@/components/sports/types";
import { formatToIST } from "@/lib/date-utils";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { formatSize } from "@/lib/format-utils";
import { Lock } from "lucide-react";
import axios from "axios";

interface ApiResponse {
  success: boolean;
  eventTypeId: string;
  data: Series[];
}

export default function SeriesMatchesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = use(params);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToBetSlip } = useBetSlip();

  // Fetch cricket data from API
  useEffect(() => {
    const fetchCricketData = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/sports/series/eventTypeId=4`,
        );
        console.log("Series Matches API Response:", response.data);

        if (response.data.success && response.data.data) {
          setSeriesList(response.data.data);
        } else {
          setSeriesList([]);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch cricket data");
        setLoading(false);
      }
    };

    fetchCricketData();

    // Refresh every 30 seconds
    const intervalId = setInterval(fetchCricketData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Store seriesId in sessionStorage for back navigation
  useEffect(() => {
    if (seriesId && typeof window !== "undefined") {
      sessionStorage.setItem("lastCricketSeriesId", seriesId);
    }
  }, [seriesId]);


  // Find the specific series
  const series = useMemo(() => {
    return seriesList.find((s) => s.id === seriesId);
  }, [seriesList, seriesId]);

  const isLoading = loading || (seriesList.length === 0 );

  if (isLoading) return <SportsEventsSkeleton />;

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">
          <p className="font-semibold">Error Loading Data</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!series )
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

  if (!series) return null;

  // Process matches with proper filtering
  const allMatches = (series.matches || []).filter((match: any) => {
    if (!match) return false;

    // Check if match has at least one market with MATCH_ODDS type
    const hasMatchOddsMarket = match.odds?.some(
      (market: any) => market.marketType === "MATCH_ODDS",
    );

    if (!hasMatchOddsMarket) return false;

    // Get the first MATCH_ODDS market
    const matchOddsMarket = match.odds.find(
      (market: any) => market.marketType === "MATCH_ODDS",
    );

    // Check if it's live (inPlay is directly on market, not in odds)
    if (matchOddsMarket?.inPlay === true) return true;

    // Check if it's upcoming (future date)
    if (match.openDate) {
      const matchDate = new Date(match.openDate);
      const now = new Date();
      return matchDate > now;
    }

    

    // Fallback: check marketTime
    if (matchOddsMarket?.marketTime) {
      const matchDate = new Date(matchOddsMarket.marketTime);
      const now = new Date();
      return matchDate > now;
    }

    return false;
  });

  // Separate live and upcoming matches
  const liveMatches = allMatches.filter((match: any) => {
    const matchOddsMarket = match.odds?.find(
      (market: any) => market.marketType === "MATCH_ODDS",
    );
    return matchOddsMarket?.inPlay === true;
  });

  const upcomingMatches = allMatches.filter((match: any) => {
    const matchOddsMarket = match.odds?.find(
      (market: any) => market.marketType === "MATCH_ODDS",
    );
    return matchOddsMarket?.inPlay !== true;
  });

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
          {liveMatches.length} live • {upcomingMatches.length} upcoming
        </p>
      </div>

      {liveMatches.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">
            Live Matches
          </h2>
          {liveMatches.map((match: any, idx: number) => (
            <MatchCard
              key={match.id || `${match.name}-${idx}`}
              match={match}
              eventType="4"
              addToBetSlip={addToBetSlip}
              seriesName={series.name}
            />
          ))}
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">
            Upcoming Matches
          </h2>
          {upcomingMatches.map((match: any, idx: number) => (
            <MatchCard
              key={match.id || `${match.name}-${idx}`}
              match={match}
              eventType="4"
              addToBetSlip={addToBetSlip}
              seriesName={series.name}
            />
          ))}
        </div>
      )}

      {allMatches.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No live or upcoming matches available for this series.
          </p>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------- MATCH CARD ---------------------------- */

function MatchCard({
  match,
  eventType,
  addToBetSlip,
  seriesName,
}: {
  match: any;
  eventType: string;
  addToBetSlip: Function;
  seriesName?: string;
}) {
  console.log("match",match)
  // Get the MATCH_ODDS market (main betting market)
 const matchOddsMarket = match.odds.find(
  (o: any) =>
    o?.odds !== null &&
    typeof o.odds === "object" &&
    !Array.isArray(o.odds) &&
    Object.keys(o.odds).length > 0
);

console.log("matchOddsMarket:", matchOddsMarket);


 console.log("FINAL matchOddsMarket:", matchOddsMarket);






  if (!matchOddsMarket) {
    console.log("No MATCH_ODDS market for match:", match.name);
    return null;
  }

  // Get runners from the market definition
  const allRunners = matchOddsMarket.runners || [];

  // Sort runners: non-draw runners first
  const runners = [...allRunners].sort((a: any, b: any) => {
    const aIsDraw = a.name?.toLowerCase().includes("draw") || false;
    const bIsDraw = b.name?.toLowerCase().includes("draw") || false;
    if (aIsDraw && !bIsDraw) return 1;
    if (!aIsDraw && bIsDraw) return -1;
    return 0;
  });

  const hideExtrasFor = ["7", "4339"]; // horse & greyhound
  const isLive = matchOddsMarket?.inPlay === true;
  const marketStatus = (matchOddsMarket?.status || "").toUpperCase();

  const statusTone: Record<string, string> = {
    SUSPENDED: "border-amber-400/80 bg-amber-500/5",
    CLOSED: "border-border/70 bg-muted/20",
    INACTIVE: "border-border/70 bg-muted/20",
    SETTLED: "border-emerald-500/60 bg-emerald-500/5",
  };

  const cardStatusClass = statusTone[marketStatus] || "border-border";
  const showStatusBadge = marketStatus
    ? !["OPEN", "ACTIVE"].includes(marketStatus)
    : false;
  const showRunners = runners.length <= 3;

  if (runners.length === 0) {
    console.log("No runners for match:", match.name);
    return null;
  }

  const matchName = match.name || "Match";
  const matchDate = match.openDate || matchOddsMarket.marketTime;

  return (
    <Card
      className={`bg-secondary/40 backdrop-blur-2xl border rounded-md p-2 ${cardStatusClass}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <Link
          href={`/sports/${eventType}/${matchOddsMarket.marketId}/${match.id || ""}`}
          className="flex-shrink-0"
        >
          <div>
            {seriesName && (
              <p className="text-[9px] text-muted-foreground mb-1">
                {seriesName}
              </p>
            )}
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-semibold text-xs">{matchName}</h3>
              {isLive && (
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  LIVE
                </span>
              )}
              {showStatusBadge && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {marketStatus}
                </span>
              )}
            </div>
            <p className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit mt-0.5">
              {matchDate ? formatToIST(matchDate) : "TBD"}
            </p>
          </div>
        </Link>

        <div className="flex gap-2 flex-wrap justify-end">
          {hideExtrasFor.includes(eventType)
            ? // For horse racing/greyhound - show multiple markets
              match.odds?.map((mkt: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/sports/${eventType}/${mkt.marketId}/${match.id || ""}`}
                  className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold px-2 py-1 rounded border border-primary/30 transition"
                >
                  {mkt.marketTime
                    ? formatToIST(mkt.marketTime, "HH:mm")
                    : "TBD"}
                </Link>
              ))
            : showRunners
              ? // For cricket with runners - show back/lay odds
                runners.map((runner: any, idx: number) => {
                  console.log("Processing runner:", runner.length, runner);

                  // SIMPLIFIED: Check if runner has back/lay odds directly
                  const hasBackOdds =
                    Array.isArray(runner.back) && runner.back.length > 0;
                  const hasLayOdds =
                    Array.isArray(runner.lay) && runner.lay.length > 0;

                  // OR check if odds are in the market's odds.runners array
                  // If runner doesn't have direct odds, check market's odds structure
                  let backOdds = runner.back || [];
                  let layOdds = runner.lay || [];

                  // Alternative: Check if market has a generic odds structure
                  if (
                    (!hasBackOdds || !hasLayOdds) &&
                    matchOddsMarket.odds?.runners?.length > 0
                  ) {
                    // If market has runners with odds, use the first available odds
                    // This is a fallback when we can't match by selectionId
                    const availableOdds = matchOddsMarket.odds.runners[idx];
                    console.log('ruuu',matchOddsMarket.odds.runners)
                    if (availableOdds) {
                      backOdds = availableOdds.back || backOdds;
                      layOdds = availableOdds.lay || layOdds;
                    }
                  }

                  const hasBack = backOdds.length > 0;
                  const hasLay = layOdds.length > 0;

                  console.log(
                    `Runner ${runner.name || idx}: back=${hasBack}, lay=${hasLay}`,
                  );

                  const runnerStatus = runner?.status || "ACTIVE";
                  const canTrade =
                    ["ACTIVE", "OPEN"].includes(marketStatus) &&
                    ["ACTIVE", "OPEN"].includes(runnerStatus);

                  // Get first available back/lay odds
                  const firstBack = hasBack ? backOdds[0] : null;
                  const firstLay = hasLay ? layOdds[0] : null;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-0.5 min-w-fit"
                    >
                      <div className="text-[9px] sm:text-[10px] font-medium text-center px-1">
                        {runner.name?.toLowerCase().includes("draw")
                          ? "Draw"
                          : runners
                                .filter(
                                  (r: any) =>
                                    !r.name?.toLowerCase().includes("draw"),
                                )
                                .findIndex((r: any) => r === runner) === 0
                            ? "1"
                            : "2"}
                      </div>
                      <div className="flex gap-0.5">
                        {hasBack ? (
                          <OddsButton
                            type="Back"
                            odd={firstBack}
                            canTrade={canTrade}
                            addToBetSlip={addToBetSlip}
                            runner={runner}
                            market={matchOddsMarket}
                          />
                        ) : (
                          <LockedOddsButton type="Back" />
                        )}
                        {hasLay ? (
                          <OddsButton
                            type="Lay"
                            odd={firstLay}
                            canTrade={canTrade}
                            addToBetSlip={addToBetSlip}
                            runner={runner}
                            market={matchOddsMarket}
                          />
                        ) : (
                          <LockedOddsButton type="Lay" />
                        )}
                      </div>
                    </div>
                  );
                })
              : null}
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------- ODDS BUTTON ---------------------------- */

function OddsButton({
  type,
  odd,
  canTrade,
  addToBetSlip,
  runner,
  market,
}: {
  type: "Back" | "Lay";
  odd: any | null;
  canTrade: boolean;
  addToBetSlip: Function;
  runner: any;
  market: any;
}) {
  const isLocked = !odd || !odd.price || odd.price <= 0;
  console.log("oddd",odd)

  const bg =
    type === "Back"
      ? "bg-chart-3 hover:bg-chart-3/80"
      : "bg-chart-2 hover:bg-chart-2/80";

  return (
    <div
      className={`relative m-0.5 text-white px-2 sm:px-3 py-2 rounded flex items-center justify-center min-w-[50px] sm:min-w-[60px] h-[40px] text-center sm:h-[48px] ${
        isLocked || !canTrade
          ? "bg-secondary cursor-not-allowed"
          : `${bg} cursor-pointer`
      }`}
      onClick={() =>
        !isLocked &&
        canTrade &&
        addToBetSlip({
          id: Date.now(),
          teams: market.marketName,
          market: `${runner.name} - ${type}`,
          odds: odd.price.toString(),
          stake: "100",
          potentialWin: (100 * odd.price).toFixed(2),
          matchId: market.marketId,
          selectionId: runner.id,
        })
      }
    >
      {isLocked ? (
        <span className="opacity-70">
          <Lock size={16} />
        </span>
      ) : (
        <div className="text-xs sm:text-sm gap-1 font-bold flex flex-col opacity-80 leading-tight">
          <p>{odd.price.toFixed(2)}</p>
          <p className="text-[9px] sm:text-[10px]">({formatSize(odd.size)})</p>
        </div>
      )}
      {!canTrade && !isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded" />
      )}
    </div>
  );
}

/* ---------------------------- LOCKED ODDS BUTTON ---------------------------- */

function LockedOddsButton({ type }: { type: "Back" | "Lay" }) {
  const bg = type === "Back" ? "bg-chart-3/30" : "bg-chart-2/30";

  return (
    <div
      className={`relative m-0.5 text-white/50 px-2 sm:px-3 py-2 rounded flex items-center justify-center min-w-[50px] sm:min-w-[60px] h-[40px] text-center sm:h-[48px] ${bg} cursor-not-allowed`}
    >
      <span className="opacity-70">
        <Lock size={16} />
      </span>
    </div>
  );
}
