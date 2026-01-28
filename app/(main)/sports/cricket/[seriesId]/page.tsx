"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSportsSeries } from "@/contexts/SportsContext";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import { Series, Match } from "@/components/sports/types";
import { formatToIST } from "@/lib/date-utils";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { formatSize } from "@/lib/format-utils";
import { Lock } from "lucide-react";

export default function SeriesMatchesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = use(params);
  const seriesList = useSportsSeries("4", true) as Series[];
  const { addToBetSlip } = useBetSlip();
  const [hasWaited, setHasWaited] = useState(false);

  // Store seriesId in sessionStorage for back navigation
  useEffect(() => {
    if (seriesId && typeof window !== "undefined") {
      sessionStorage.setItem("lastCricketSeriesId", seriesId);
    }
  }, [seriesId]);

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

  // Find the specific series
  const series = useMemo(() => {
    return seriesList.find((s) => s.id === seriesId);
  }, [seriesList, seriesId]);

  const isLoading = seriesList.length === 0 && !hasWaited;

  if (isLoading) return <SportsEventsSkeleton />;

  if (!series && hasWaited)
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

  // Filter and separate live and upcoming matches
  const allMatches = (series.matches || []).filter((match) => {
    // Include live matches
    if (match.odds?.[0]?.odds?.inplay === true) return true;
    
    // Include upcoming matches (future date)
    if (match.event?.openDate) {
      const matchDate = new Date(match.event.openDate);
      const now = new Date();
      return matchDate > now;
    }
    
    return false;
  });

  const liveMatches = allMatches.filter(
    (m) => m.odds?.[0]?.odds?.inplay === true
  );

  const upcomingMatches = allMatches.filter(
    (m) => !m.odds?.[0]?.odds?.inplay
  );

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
          {liveMatches.map((match, idx) => (
            <MatchCard
              key={`${match.event?.id}-${idx}`}
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
          {upcomingMatches.map((match, idx) => (
            <MatchCard
              key={`${match.event?.id}-${idx}`}
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
  match: Match;
  eventType: string;
  addToBetSlip: Function;
  seriesName?: string;
}) {
  const market = match.odds?.[0];
  const allRunners = market?.runners || [];

  const runners = [...allRunners].sort((a, b) => {
    const aIsDraw = a.runnerName.toLowerCase().includes("draw");
    const bIsDraw = b.runnerName.toLowerCase().includes("draw");
    if (aIsDraw && !bIsDraw) return 1;
    if (!aIsDraw && bIsDraw) return -1;
    return 0;
  });

  const hideExtrasFor = ["7", "4339"]; // horse & greyhound
  const isLive = Boolean(market?.odds?.inplay);
  const marketStatus = market?.odds?.status?.toUpperCase();
  const statusTone: Record<string, string> = {
    SUSPENDED: "border-amber-400/80 bg-amber-500/5",
    CLOSED: "border-border/70 bg-muted/20",
    INACTIVE: "border-border/70 bg-muted/20",
    SETTLED: "border-emerald-500/60 bg-emerald-500/5",
  };
  let resolvedStatusClass: string | undefined;
  if (typeof marketStatus === "string") {
    resolvedStatusClass = statusTone[marketStatus];
  }
  const cardStatusClass = resolvedStatusClass || "border-border";
  const showStatusBadge = marketStatus
    ? !["OPEN", "ACTIVE"].includes(marketStatus)
    : false;
  const showRunners = runners.length <= 3;
  if (!market?.odds) return null;
  
  return (
    <Card
      className={`bg-secondary/40 backdrop-blur-2xl border rounded-md p-2 ${cardStatusClass}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <Link
          href={`/sports/${eventType}/${market?.marketId}/${
            match.event?.id ?? ""
          }`}
          className="flex-shrink-0 "
        >
          <div>
            {seriesName && (
              <p className="text-[9px] text-muted-foreground mb-1">
                {seriesName}
              </p>
            )}
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-semibold text-xs">
                {match.event?.name || "Match"}
              </h3>
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
              {match.event?.openDate
                ? formatToIST(match.event.openDate)
                : "TBD"}
            </p>
          </div>
        </Link>

        <div className="flex gap-2 flex-wrap justify-end">
          {hideExtrasFor.includes(eventType)
            ? match.odds?.map((mkt, idx) => (
                <Link
                  key={idx}
                  href={`/sports/${eventType}/${mkt.marketId}/${
                    match.event?.id ?? ""
                  }`}
                  className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold px-2 py-1 rounded border border-primary/30 transition"
                >
                  {mkt.marketStartTime
                    ? formatToIST(mkt.marketStartTime, "HH:mm")
                    : "TBD"}
                </Link>
              ))
            : showRunners
            ? runners.map((runner, idx) => {
                const oddsRunner = market?.odds?.runners?.find(
                  (r) =>
                    r.selectionId.toString() === runner.selectionId.toString()
                );
                if (!oddsRunner) return null;

                const marketStatusRaw = market?.odds?.status || "";
                const runnerStatus = oddsRunner.status;

                const canTrade =
                  ["ACTIVE", "OPEN"].includes(marketStatusRaw) &&
                  ["ACTIVE", "OPEN"].includes(runnerStatus);

                const firstBack = oddsRunner?.back?.[0];
                const firstLay = oddsRunner?.lay?.[0];

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-0.5 min-w-fit"
                  >
                    <div className="text-[9px] sm:text-[10px] font-medium text-center px-1">
                      {runner.runnerName.toLowerCase().includes("draw")
                        ? "Draw"
                        : runners
                            .filter(
                              (r) =>
                                !r.runnerName.toLowerCase().includes("draw")
                            )
                            .findIndex(
                              (r) => r.selectionId === runner.selectionId
                            ) === 0
                        ? "1"
                        : "2"}
                    </div>
                    <div className="flex gap-0.5">
                      {firstBack && (
                        <OddsButton
                          type="Back"
                          odd={firstBack}
                          canTrade={canTrade}
                          addToBetSlip={addToBetSlip}
                          runner={runner}
                          market={market}
                        />
                      )}
                      {firstLay && (
                        <OddsButton
                          type="Lay"
                          odd={firstLay}
                          canTrade={canTrade}
                          addToBetSlip={addToBetSlip}
                          runner={runner}
                          market={market}
                        />
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
  odd: any;
  canTrade: boolean;
  addToBetSlip: Function;
  runner: any;
  market: any;
}) {
  const isLocked = !odd.price || odd.price <= 1.1;
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
          market: `${runner.runnerName} - ${type}`,
          odds: odd.price.toString(),
          stake: "100",
          potentialWin: (100 * odd.price).toFixed(2),
          matchId: market.marketId,
          selectionId: runner.selectionId,
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

