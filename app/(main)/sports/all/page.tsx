"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSportsSeries } from "@/contexts/SportsContext";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import { Series, Match } from "@/components/sports/types";
import { formatToIST } from "@/lib/date-utils";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { formatSize } from "@/lib/format-utils";
import { Lock } from "lucide-react";
import { sportsList } from "@/data";

export default function AllSportsPage() {
  const { addToBetSlip } = useBetSlip();
  const [hasWaited, setHasWaited] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("All");

  // Get all sports data - backend doesn't support "all", so we subscribe to each sport
  const allSportsData = sportsList.map((sport) => ({
    eventType: sport.eventType,
    series: useSportsSeries(sport.eventType, true) as Series[],
  }));

  const allSeries = allSportsData.flatMap((data) =>
    data.series.map((series) => ({ ...series, eventType: data.eventType }))
  );
  const isLoading = allSeries.length === 0 && !hasWaited;

  useEffect(() => {
    if (allSeries.length > 0) {
      setHasWaited(true);
    }
  }, [allSeries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <SportsEventsSkeleton />;

  if (!allSeries.length && hasWaited)
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-2">
          No live events available at the moment.
        </p>
        <p className="text-sm text-muted-foreground">
          Please check back later.
        </p>
      </Card>
    );

  const allCountries = [
    "All",
    ...new Set(
      allSeries.flatMap(
        (s) => s.matches?.map((m) => m.event?.countryCode).filter(Boolean) || []
      )
    ),
  ];

  const allMatches = allSeries
    .flatMap((series: any) =>
      (series.matches || []).map((match: any) => {
        const sport = sportsList.find((s) => s.eventType === series.eventType);
        return {
          ...match,
          seriesName: series.name,
          eventType: series.eventType,
          sportName: sport?.name || "Unknown",
        };
      })
    )
    .filter(
      (m) =>
        selectedCountry === "All" || m.event?.countryCode === selectedCountry
    )
    .sort((a, b) => {
      const timeA = new Date(a.event?.openDate || 0).getTime();
      const timeB = new Date(b.event?.openDate || 0).getTime();
      return timeA - timeB;
    });

  const liveMatches = allMatches.filter((m) => m.odds?.[0]?.odds?.inplay);

  const matchesBySport = liveMatches.reduce((acc, match) => {
    const sportName = match.sportName || "Unknown";
    if (!acc[sportName]) acc[sportName] = [];
    acc[sportName].push(match);
    return acc;
  }, {} as Record<string, typeof liveMatches>);

  const sortedSports = Object.entries(matchesBySport).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="space-y-4">
      {allCountries.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allCountries.map((country) => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country as string)}
              className={`text-xs px-3 py-1.5 rounded transition ${
                selectedCountry === country
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {country}
            </button>
          ))}
        </div>
      )}

      {liveMatches.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No live matches available</p>
        </Card>
      ) : (
        sortedSports.map(([sportName, matches]) => (
          <div key={sportName} className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground px-2">
              {sportName}
            </h2>
            {matches.map((match) => (
              <MatchCard
                key={`${match.event?.id}-${match.odds?.[0]?.marketId}`}
                match={match}
                eventType={match.eventType || ""}
                addToBetSlip={addToBetSlip}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function MatchCard({
  match,
  eventType,
  addToBetSlip,
}: {
  match: Match & {
    seriesName?: string;
    eventType?: string;
    sportName?: string;
  };
  eventType: string;
  addToBetSlip: Function;
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

  const hideExtrasFor = ["7", "4339"];
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
          className="flex-shrink-0"
        >
          <div>
            {match.seriesName && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] text-muted-foreground">
                  {match.seriesName}
                </span>
              </div>
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

        <div className="flex gap-2 flex-wrap justify-end shrink-0">
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
