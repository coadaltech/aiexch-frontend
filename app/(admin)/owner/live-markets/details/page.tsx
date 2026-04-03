"use client";

import { useMemo, useState } from "react";
import { useLiveMarketsDetails, useLiveMarketsPnl } from "@/hooks/useOwner";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatAmount(v: number) {
  if (!v) return "0";
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
}

function pnlColor(v: number) {
  return v > 0 ? "text-green-600" : v < 0 ? "text-red-600" : "text-gray-400";
}

function fmt(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

function normalizeBookmakers(bookmakers: any[]): any[] {
  if (!bookmakers?.length) return [];
  return bookmakers
    .filter((bm) => {
      const st = bm.odds?.status || "";
      return st !== "CLOSED" && st !== "INACTIVE";
    })
    .map((bm) => {
      const odds = bm.odds;
      const st = odds?.status || "OPEN";
      return {
        marketId: bm.marketId,
        marketName: bm.marketName || odds?.mname || "Bookmaker",
        bettingType: "BOOKMAKER",
        status: st === "SUSPENDED" ? "SUSPENDED" : st,
        sportingEvent: false,
        marketCondition: {
          minBet: parseFloat(odds?.min || "100"),
          maxBet: parseFloat(odds?.max || "50000"),
        },
        runners: (odds?.runners || []).map((r: any) => ({
          selectionId: r.selectionId,
          name: r.runnerName,
          status: r.status || "ACTIVE",
          back: r.back?.map((b: any) => ({ price: b.price, size: parseFloat(b.size) || 0 })) || null,
          lay: r.lay?.map((l: any) => ({ price: l.price, size: parseFloat(l.size) || 0 })) || null,
        })),
      };
    });
}

function normalizeSessions(sessions: any[]): any[] {
  if (!sessions?.length) return [];
  return sessions
    .filter((s) => {
      const gs = (s.GameStatus || "").toUpperCase();
      return gs !== "CLOSED" && gs !== "INACTIVE" && gs !== "COMPLETE";
    })
    .map((s) => {
      const isSuspended = (s.GameStatus || "").toUpperCase() === "SUSPENDED";
      const isBallRunning = s.GameStatus === "Ball Running" || s.GameStatus === "BALL RUNNING" || s.ballsess === 1;
      const st = isSuspended || isBallRunning ? "SUSPENDED" : "OPEN";
      return {
        marketId: `session-${s.SelectionId}`,
        marketName: s.RunnerName,
        bettingType: "LINE",
        status: st,
        sportingEvent: isBallRunning,
        marketCondition: { minBet: parseFloat(s.min || "100"), maxBet: parseFloat(s.max || "25000") },
        runners: [{
          selectionId: s.SelectionId,
          name: s.RunnerName,
          status: st,
          back: s.BackPrice1 ? [{ line: s.BackPrice1, price: s.BackSize1 || 100 }] : null,
          lay: s.LayPrice1 ? [{ line: s.LayPrice1, price: s.LaySize1 || 100 }] : null,
        }],
      };
    });
}

// ─── Suspended overlay ───────────────────────────────────────────────────────

function MarketOverlay({ market }: { market: any }) {
  const show = market?.sportingEvent || market?.status === "SUSPENDED";
  if (!show) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 cursor-not-allowed">
      <span className="text-red-600 font-bold text-xs">
        {market.status === "SUSPENDED" ? "Suspended" : "Ball Running"}
      </span>
    </div>
  );
}

const oddsBtnBase = "flex-1 min-w-0 px-1 py-1 flex flex-col items-center justify-center rounded leading-tight";

// ─── Odds / Bookmaker market ─────────────────────────────────────────────────

function OddsMarket({
  market,
  oddsExposureMap,
}: {
  market: any;
  oddsExposureMap: Map<string, Map<string, number>>;
}) {
  const runnerPnlMap = oddsExposureMap.get(String(market.marketId));

  return (
    <div className="rounded overflow-hidden border border-gray-200">
      <div className="grid grid-cols-3 gap-1 px-2 py-1 border-b border-gray-200 bg-[#174b73] items-center">
        <div className="min-w-0 flex flex-col gap-0.5">
          <h3 className="font-semibold text-white text-[11px] truncate leading-tight">{market.marketName}</h3>
          <p className="text-white/70 text-[9px] truncate">
            Min: {market.marketCondition?.minBet ?? "-"} / Max: {market.marketCondition?.maxBet ?? "-"}
          </p>
        </div>
        <div className="justify-self-end font-semibold bg-[#72bbef] text-black text-[10px] py-0.5 px-1.5 rounded">Back</div>
        <div className="font-semibold bg-[#faa9ba] text-black text-[10px] py-0.5 px-1.5 rounded w-fit">Lay</div>
      </div>
      <div className="divide-y divide-gray-100">
        {market.runners.map((runner: any) => {
          const runnerId = String(runner.selectionId);
          const pnl = runnerPnlMap?.get(runnerId) ?? null;
          return (
            <div key={runner.selectionId} className="px-2 py-1 grid grid-cols-3 gap-1 items-center bg-white">
              {/* Runner name + P&L */}
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-gray-900 font-semibold text-[11px] truncate">{runner.name}</span>
                {pnl !== null && (
                  <span className={`text-[9px] font-semibold leading-tight ${pnlColor(pnl)}`}>
                    {fmt(pnl)}
                  </span>
                )}
              </div>
              <div className="col-span-2 flex relative min-h-[2.25rem]">
                {/* Back */}
                <div className="flex-1 flex justify-end items-center gap-1">
                  {(() => {
                    const backs = runner.back || [];
                    const positions = Array(3).fill(null);
                    backs.forEach((item: any, i: number) => { if (i < 3) positions[2 - i] = item; });
                    return positions.map((item, idx) =>
                      item ? (
                        <div key={idx} className={`${oddsBtnBase} bg-[#72bbef] w-16`}>
                          <span className="text-black font-bold text-[10px]">{item.price}</span>
                          <span className="text-black text-[8px]">{formatAmount(item.size)}</span>
                        </div>
                      ) : (
                        <div key={idx} className={`${oddsBtnBase} bg-[#c7dff7] opacity-50 w-16`}>
                          <span className="text-[10px]">-</span>
                        </div>
                      )
                    );
                  })()}
                </div>
                {/* Lay */}
                <div className="flex-1 flex justify-start items-center gap-1">
                  {(() => {
                    const lays = runner.lay || [];
                    const positions = Array(3).fill(null);
                    lays.forEach((item: any, i: number) => { if (i < 3) positions[i] = item; });
                    return positions.map((item, idx) =>
                      item ? (
                        <div key={idx} className={`${oddsBtnBase} bg-[#faa9ba] w-16`}>
                          <span className="text-black font-bold text-[10px]">{item.price}</span>
                          <span className="text-black text-[8px]">{formatAmount(item.size)}</span>
                        </div>
                      ) : (
                        <div key={idx} className={`${oddsBtnBase} bg-[#f6d0d8] opacity-50 w-16`}>
                          <span className="text-[10px]">-</span>
                        </div>
                      )
                    );
                  })()}
                </div>
                <MarketOverlay market={market} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fancy markets ───────────────────────────────────────────────────────────

function FancyMarkets({
  markets,
  fancyExposureMap,
}: {
  markets: any[];
  fancyExposureMap: Map<string, number>;
}) {
  if (!markets.length) return null;
  return (
    <div className="rounded overflow-hidden border border-gray-200">
      <div className="grid grid-cols-3 gap-1 px-2 py-1 border-b bg-[#174b73]">
        <h3 className="font-semibold text-white text-[11px]">Fancy</h3>
        <div className="justify-self-end font-semibold bg-[#72bbef] text-black text-[10px] py-0.5 px-1.5 rounded">NO</div>
        <div className="font-semibold bg-[#faa9ba] text-black text-[10px] py-0.5 px-1.5 rounded w-fit">YES</div>
      </div>
      {markets.map((market) =>
        market.runners.map((runner: any) => {
          const pnl = fancyExposureMap.get(String(market.marketId)) ?? null;
          return (
            <div key={market.marketId} className="px-2 py-1 grid grid-cols-3 gap-1 items-center bg-white border-b border-gray-100 last:border-b-0">
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-gray-900 font-semibold text-[11px] truncate">{market.marketName}</span>
                {pnl !== null && (
                  <span className={`text-[9px] font-semibold leading-tight ${pnlColor(pnl)}`}>
                    {fmt(pnl)}
                  </span>
                )}
              </div>
              <div className="col-span-2 flex relative min-h-[2.25rem]">
                <div className="flex-1 flex justify-end items-center gap-1">
                  {runner.lay?.length ? (
                    runner.lay.map((item: any, i: number) => (
                      <div key={i} className={`${oddsBtnBase} bg-[#72bbef] w-16`}>
                        <span className="text-black font-bold text-[10px]">{item.line}</span>
                        <span className="text-black text-[8px]">{formatAmount(item.price)}</span>
                      </div>
                    ))
                  ) : (
                    <div className={`${oddsBtnBase} bg-[#c7dff7] opacity-50 w-16`}><span className="text-[10px]">-</span></div>
                  )}
                </div>
                <div className="flex-1 flex justify-start items-center gap-1">
                  {runner.back?.length ? (
                    runner.back.map((item: any, i: number) => (
                      <div key={i} className={`${oddsBtnBase} bg-[#faa9ba] w-16`}>
                        <span className="text-black font-bold text-[10px]">{item.line}</span>
                        <span className="text-black text-[8px]">{formatAmount(item.price)}</span>
                      </div>
                    ))
                  ) : (
                    <div className={`${oddsBtnBase} bg-[#f6d0d8] opacity-50 w-16`}><span className="text-[10px]">-</span></div>
                  )}
                </div>
                <MarketOverlay market={market} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: "Soccer",
  2: "Tennis",
  4: "Cricket",
};

function eventTypeLabel(id: number) {
  return EVENT_TYPE_LABELS[id] ?? `Sport ${id}`;
}

type DbMarket = { market_id: string; market_name: string; market_type: number };
type MatchGroup = {
  matchId: string;
  eventTypeId: string;
  eventName: string;
  competitionId: string;
  competitionName: string;
  markets: DbMarket[];
};

type EventTypeGroup = {
  eventTypeId: number;
  matches: MatchGroup[];
};

// ─── Match detail view (only mounts WebSocket when a match is selected) ─────

function MatchDetailView({
  match,
  oddsExposureMap,
  fancyExposureMap,
  onBack,
}: {
  match: MatchGroup;
  oddsExposureMap: Map<string, Map<string, number>>;
  fancyExposureMap: Map<string, number>;
  onBack: () => void;
}) {
  const { matchOdds, bookmakers, sessions } = useLiveMatch(match.matchId, match.eventTypeId);

  const allMarkets = useMemo(() => {
    const bmNorm = normalizeBookmakers(bookmakers);
    const sessNorm = normalizeSessions(sessions);
    const seenIds = new Set(matchOdds.map((m: any) => m.marketId));
    return [
      ...matchOdds,
      ...bmNorm.filter((m) => !seenIds.has(m.marketId)),
      ...sessNorm,
    ].filter((m) => m.status !== "CLOSED" && m.status !== "INACTIVE");
  }, [matchOdds, bookmakers, sessions]);

  const dbMarketIds = useMemo(
    () => new Set(match.markets.map((m) => String(m.market_id))),
    [match.markets]
  );

  const oddsMarkets = allMarkets.filter(
    (m) => (m.bettingType === "ODDS" || m.bettingType === "BOOKMAKER") && dbMarketIds.has(String(m.marketId))
  );
  const fancyMarkets = allMarkets.filter(
    (m) => m.bettingType === "LINE" && dbMarketIds.has(String(m.marketId))
  );

  const showPlaceholders = allMarkets.length === 0;

  return (
    <div className="space-y-4">
      {/* Back + match header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Matches
        </button>
        <div className="rounded-lg bg-[#174b73] px-4 py-3 text-white">
          <p className="text-[10px] text-white/70">{match.competitionName}</p>
          <p className="font-semibold text-sm">{match.eventName || `Match ${match.matchId}`}</p>
          <p className="text-[10px] text-white/50 mt-0.5">{match.markets.length} market{match.markets.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Markets */}
      <div className="space-y-2">
        {showPlaceholders ? (
          <div className="space-y-2">
            {match.markets.map((m) => (
              <div key={m.market_id} className="rounded border border-gray-200 px-3 py-2 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-700">{m.market_name}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            {oddsMarkets.map((market) => (
              <OddsMarket key={market.marketId} market={market} oddsExposureMap={oddsExposureMap} />
            ))}
            <FancyMarkets markets={fancyMarkets} fancyExposureMap={fancyExposureMap} />
            {oddsMarkets.length === 0 && fancyMarkets.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No open markets at this time</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Match list item ────────────────────────────────────────────────────────

function MatchListItem({
  match,
  onClick,
}: {
  match: MatchGroup;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{match.competitionName}</p>
        <p className="font-medium text-gray-900 text-sm truncate">
          {match.eventName || `Match ${match.matchId}`}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{match.markets.length}</p>
          <p className="text-[10px] text-gray-500">Markets</p>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LiveMarketsDetailsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useLiveMarketsDetails();
  const { data: pnlData } = useLiveMarketsPnl();
  const [selectedMatch, setSelectedMatch] = useState<MatchGroup | null>(null);

  // Build oddsExposureMap: marketId → runnerId → pnl
  const oddsExposureMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const row of (pnlData?.odds ?? []) as any[]) {
      const mId = String(row.market_id);
      if (!map.has(mId)) map.set(mId, new Map());
      map.get(mId)!.set(String(row.runner_id), parseFloat(row.runner_profit ?? "0"));
    }
    return map;
  }, [pnlData]);

  // Build fancyExposureMap: marketId → pnl
  const fancyExposureMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of (pnlData?.fancy ?? []) as any[]) {
      map.set(String(row.market_id), parseFloat(row.runner_profit ?? "0"));
    }
    return map;
  }, [pnlData]);

  const eventTypeGroups = useMemo<EventTypeGroup[]>(() => {
    if (!data?.length) return [];

    const eventMap = new Map<number, Map<string, MatchGroup>>();

    for (const row of data as any[]) {
      const etId: number = row.event_type_id ?? 0;
      const matchKey = String(row.match_id ?? 0);

      if (!eventMap.has(etId)) eventMap.set(etId, new Map());
      const matchMap = eventMap.get(etId)!;

      if (!matchMap.has(matchKey)) {
        matchMap.set(matchKey, {
          matchId: matchKey,
          eventTypeId: String(etId),
          eventName: row.event_name ?? "",
          competitionId: String(row.competition_id),
          competitionName: row.competitions_name ?? "",
          markets: [],
        });
      }
      matchMap.get(matchKey)!.markets.push({
        market_id: row.market_id,
        market_name: row.market_name,
        market_type: row.market_type,
      });
    }

    const ORDER: Record<number, number> = { 4: 0, 1: 1, 2: 2 };
    return Array.from(eventMap.entries())
      .sort(([a], [b]) => (ORDER[a] ?? 99) - (ORDER[b] ?? 99))
      .map(([eventTypeId, matchMap]) => ({
        eventTypeId,
        matches: Array.from(matchMap.values()),
      }));
  }, [data]);

  // ── Selected match detail view ──
  if (selectedMatch) {
    return (
      <MatchDetailView
        match={selectedMatch}
        oddsExposureMap={oddsExposureMap}
        fancyExposureMap={fancyExposureMap}
        onBack={() => setSelectedMatch(null)}
      />
    );
  }

  // ── Match list view ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Live Markets — Details</h1>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-center py-16 text-red-500">
          Failed to load markets.{" "}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {!isLoading && !isError && eventTypeGroups.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No active markets found. Markets appear here once bets are placed.
        </div>
      )}

      {eventTypeGroups.length > 0 && (
        <div className="space-y-5">
          {eventTypeGroups.map((et) => (
            <div key={et.eventTypeId}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {eventTypeLabel(et.eventTypeId)}
                </span>
                <span className="text-xs text-gray-400">({et.matches.length} match{et.matches.length !== 1 ? "es" : ""})</span>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {et.matches.map((match) => (
                  <MatchListItem
                    key={match.matchId}
                    match={match}
                    onClick={() => setSelectedMatch(match)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
