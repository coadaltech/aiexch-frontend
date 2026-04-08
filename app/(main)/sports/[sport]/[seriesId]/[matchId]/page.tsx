"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBetting, useMyBets, useMarketExposure, useFancyMarketExposure, useFancyExposureChart } from "@/hooks/useBetting";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useSeries } from "@/hooks/useSportsApi";
import { useStakeSettings, DEFAULT_STAKES } from "@/hooks/useUserQueries";
import { sportsApi } from "@/lib/api";
import { getSportConfig } from "@/lib/sports-config";
import { addDemoBets } from "@/lib/demo-bets";
import type { DemoBet } from "@/lib/demo-bets";
import { toast } from "sonner";
import { Timer } from "lucide-react";

type RunnerSummary = {
  id: string;
  name: string;
  price: number;
};

type QuickBetData = {
  marketId: string;
  bettingType: string;
  market: any;
  runner: any;
  allRunners: RunnerSummary[];
  eventName: string;
  odds: string;
  run?: string | null;
  isLay: boolean;
  priceIndex: number;
};

function formatStakeLabel(value: number): string {
  if (value >= 10000000) return `${value / 10000000}Cr`;
  if (value >= 100000) return `${value / 100000}L`;
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
}

function QuickBetPanel({
  data,
  stake,
  onStakeChange,
  onClose,
  onPlaceBet,
  isLoading,
  betDelayRemaining,
  onCancelDelay,
  stakeButtons,
  currentOdds,
}: {
  data: QuickBetData;
  stake: string;
  onStakeChange: (val: string) => void;
  onClose: () => void;
  onPlaceBet: (stake: string, odds: string) => void;
  isLoading?: boolean;
  betDelayRemaining?: number;
  onCancelDelay?: () => void;
  stakeButtons?: { label: string; value: number }[];
  currentOdds?: string;
}) {
  const { market, runner, odds } = data;
  const rawOdds = currentOdds ?? odds;
  const numOdds = parseFloat(rawOdds);
  const displayOdds =
    data.bettingType === "LINE" && data.run != null
      ? `${data.run} (${Math.round(numOdds * 100)})`
      : isNaN(numOdds)
      ? rawOdds
      : (() => {
          const str = String(numOdds);
          const decimals = str.includes(".") ? str.split(".")[1].length : 0;
          return decimals > 4 ? numOdds.toFixed(4) : str;
        })();
  const marketName = market?.marketName || "";
  const runnerName = runner?.name || "";

  const minBet = parseFloat(market?.marketCondition?.minBet) || 0;
  const maxBet = parseFloat(market?.marketCondition?.maxBet) || 0;
  const stakeNum = parseFloat(stake) || 0;

  const belowMin = stakeNum > 0 && minBet > 0 && stakeNum < minBet;
  const aboveMax = stakeNum > 0 && maxBet > 0 && stakeNum > maxBet;
  const stakeError = belowMin
    ? `Min bet is ${minBet}`
    : aboveMax
    ? `Max bet is ${maxBet}`
    : null;

  const resolvedStakes = (stakeButtons && stakeButtons.length > 0 ? stakeButtons : DEFAULT_STAKES).map(
    (btn) => ({ ...btn, label: formatStakeLabel(btn.value) })
  );
  const isDelaying = betDelayRemaining != null && betDelayRemaining > 0;

  const handleStake = (val: string) => {
    let n = parseFloat(val) || 0;
    if (maxBet > 0 && n > maxBet) n = maxBet;
    onStakeChange(n > 0 ? String(n) : "");
  };

  const canPlace = !!stake && stakeNum > 0 && !stakeError && !isLoading && !isDelaying;

  return (
    <div className={`px-2 sm:px-3  border-t-2 ${data.isLay ? "border-lay bg-gradient-to-b from-lay/50 to-lay/10" : "border-back bg-gradient-to-b from-back/50 to-back/10"}`}>
      {/* Bet delay countdown banner */}
      {isDelaying && (
        <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block" />
            <span className="text-xs sm:text-sm font-medium text-amber-700">
              Placing in {betDelayRemaining}s...
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelDelay}
            className="px-2 py-0.5 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Top Section: Label, Odds, Stake */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 justify-end mb-1">
        <div className="text-gray-800 font-bold text-xs sm:text-sm truncate max-w-full sm:max-w-none text-right sm:text-left">
          {runnerName} - {marketName.toUpperCase()}
        </div>

        <div className="flex items-center">
          <input
            type="text"
            value={displayOdds}
            readOnly
            className="w-20 sm:w-24 bg-gray-50 text-gray-900 text-sm sm:text-base font-bold py-1.5 px-2 text-center border border-gray-300 rounded cursor-default"
          />
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center">
            <input
              type="number"
              value={stake}
              onChange={(e) => handleStake(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const current = parseFloat(stake) || 0;
                  handleStake(String(current === 0 ? 500 : current + 500));
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  handleStake(String(Math.max(0, (parseFloat(stake) || 0) - 500)));
                }
              }}
              placeholder="0"
              autoFocus
              disabled={isDelaying}
              style={{ width: `${Math.max(7, (stake?.length || 1) + 3)}ch` }}
              className={`min-w-[5rem] sm:min-w-[6rem] bg-gray-50 text-gray-900 text-sm sm:text-base font-bold py-1.5 px-2 text-center border rounded focus:ring-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-[width] duration-150 ${
                stakeError
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-[#1a3578]"
              } ${isDelaying ? "opacity-50" : ""}`}
            />
            <div className="flex flex-col ml-0.5">
              <button
                type="button"
                disabled={isDelaying}
                onClick={() => {
                  const current = parseFloat(stake) || 0;
                  handleStake(String(current === 0 ? 500 : current + 500));
                }}
                className="bg-gray-100 text-gray-600 px-1 py-0.5 text-[10px] hover:bg-gray-200 border border-gray-300 rounded-t disabled:opacity-50"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={isDelaying}
                onClick={() => handleStake(String(Math.max(0, (parseFloat(stake) || 0) - 500)))}
                className="bg-gray-100 text-gray-600 px-1 py-0.5 text-[10px] hover:bg-gray-200 border border-gray-300 border-t-0 rounded-b disabled:opacity-50"
              >
                ▼
              </button>
            </div>
          {stakeError && (
            <span className="text-danger text-[9px] sm:text-[10px] font-medium ml-2">{stakeError}</span>
          )}
          </div>
        </div>
      </div>

      {/* Quick stake buttons + actions */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {resolvedStakes.map((btn) => (
            <button
              key={btn.value}
              type="button"
              disabled={isDelaying}
              onClick={() => onStakeChange(String(btn.value))}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded bg-gradient-to-b from-sports-header to-sports-header/80 hover:from-sports-header/90 hover:to-sports-header/70 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPlaceBet(stake, rawOdds)}
            disabled={!canPlace}
            className="min-w-[84px] sm:min-w-[96px] px-4 sm:px-5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold bg-[#142669] hover:from-cta-deposit-from-hover hover:to-cta-deposit-to-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                Placing...
              </>
            ) : isDelaying ? (
              `Waiting ${betDelayRemaining}s...`
            ) : (
              "Place Bet"
            )}
          </button>
          <button
            type="button"
            onClick={isDelaying ? onCancelDelay : onClose}
            disabled={isLoading}
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold bg-gradient-to-b from-danger-strong to-danger-strong/80 hover:from-danger-strong/90 hover:to-danger-strong/70 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Map bettingType to marketType expected by backend
function toBettingType(bettingType: string): string {
  switch (bettingType?.toUpperCase()) {
    case "BOOKMAKER": return "bookmaker";
    case "LINE": return "fancy";
    default: return "odds";
  }
}

// Convert price to international decimal odds.
// Values 10–99 are Indian format (e.g. 24, 24.5) → divide by 100 and add 1.
// Values >= 100 are Indian format (e.g. 150) → divide by 100 only.
// Values < 10 are already decimal odds (e.g. 1.50, 2.40) → pass through as-is.
function toDecimalOdds(price: number): number {
  if (price >= 10 && price < 100) return price / 100 + 1;
  if (price >= 100) return price / 100;
  return price;
}

function toDecimalfancyOdds(price: number): number {
  // if (price >= 10 && price < 100) return price / 100;
  // if (price >= 100) return price / 100;
  return price/100;
}

export default function MatchPage() {
  const params = useParams();
  const sport = params.sport as string;
  const seriesId = params.seriesId as string;
  const matchId = params.matchId as string;
  const { addToBetSlip } = useBetSlip();
  const [quickBet, setQuickBet] = useState<QuickBetData | null>(null);
  const [quickBetStake, setQuickBetStake] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [betDelayRemaining, setBetDelayRemaining] = useState(0);
  const betDelayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const betDelayResolveRef = useRef<(() => void) | null>(null);
  const queryClient = useQueryClient();
  const { user, updateDemoBalance } = useAuth();
  const { placeBetAsync } = useBetting();
  useMyBets("matched");
  const { data: marketExposureMap } = useMarketExposure();
  const { data: fancyExposureMap } = useFancyMarketExposure();
  const [exposureChartMarket, setExposureChartMarket] = useState<{ marketId: string; name: string } | null>(null);
  const { data: exposureChartData, isLoading: isExposureChartLoading } = useFancyExposureChart(exposureChartMarket?.marketId ?? null);

  const config = getSportConfig(sport);
  const eventTypeId = config?.eventTypeId ?? "4";
  const { data: seriesData = [] } = useSeries(config?.eventTypeId ?? null);
  const { data: customStakes } = useStakeSettings(!!user && !user.isDemo);
  const { status, isConnected, matchOdds: wsMarkets, bookmakers: wsBookmakers, sessions: wsSessions } = useLiveMatch(matchId, eventTypeId);

  // Try to use cached odds data from the sport listing page for instant display
  const cachedOdds = queryClient.getQueryData<any[]>(["match-odds-list", matchId]);

  // Fast lightweight fetch — just match odds (shows markets quickly)
  const [fastOdds, setFastOdds] = useState<any[] | null>(null);
  const fastFetchDone = useRef(false);

  useEffect(() => {
    if (fastFetchDone.current || cachedOdds) return;
    fastFetchDone.current = true;

    sportsApi
      .getMarketsWithOdds(eventTypeId, matchId)
      .then((res: any) => {
        const data = res.data?.data ?? res.data ?? [];
        if (data.length > 0) setFastOdds(data);
      })
      .catch(() => {});
  }, [eventTypeId, matchId, cachedOdds]);

  // Full REST fetch for all data (bookmakers, sessions, etc.)
  const [initialData, setInitialData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    sportsApi
      .getMatchDetails(eventTypeId, matchId)
      .then((res: any) => {
        const data = res.data || res;
        setInitialData(data);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [eventTypeId, matchId]);

  // Normalize bookmaker data into the same format as matchOdds
  const normalizeBookmakers = useCallback((bookmakers: any[]): any[] => {
    if (!bookmakers || bookmakers.length === 0) return [];
    return bookmakers
      .filter((bm: any) => {
        const st = bm.odds?.status || "";
        return st !== "CLOSED" && st !== "INACTIVE";
      })
      .map((bm: any) => {
        const odds = bm.odds;
        const st = odds?.status || "OPEN";
        return {
          marketId: bm.marketId,
          marketName: bm.marketName || odds?.mname || "Bookmaker",
          marketType: "BOOKMAKER",
          status: st === "SUSPENDED" ? "SUSPENDED" : st,
          inPlay: odds?.inplay ?? true,
          bettingType: "BOOKMAKER",
          marketCondition: {
            marketId: bm.marketId,
            betDelay: odds?.betDelay || 0,
            minBet: parseFloat(odds?.min || "100"),
            maxBet: parseFloat(odds?.max || "50000"),
            maxProfit: 0,
            betLock: false,
          },
          sportingEvent: false,
          runners: (odds?.runners || []).map((r: any) => ({
            selectionId: r.selectionId,
            name: r.runnerName,
            status: r.status || "ACTIVE",
            back: r.back?.map((b: any) => ({
              price: b.price,
              size: parseFloat(b.size) || b.size || 0,
            })) || null,
            lay: r.lay?.map((l: any) => ({
              price: l.price,
              size: parseFloat(l.size) || l.size || 0,
            })) || null,
          })),
        };
      });
  }, []);

  // Normalize session/fancy data into LINE format
  const normalizeSessions = useCallback((sessions: any[]): any[] => {
    if (!sessions || sessions.length === 0) return [];
    return sessions
      .filter((s: any) => {
        const gs = (s.GameStatus || "").toUpperCase();
        return gs !== "CLOSED" && gs !== "INACTIVE" && gs !== "COMPLETE";
      })
      .map((s: any) => {
        const gameStatus = s.GameStatus || "";
        const isSuspended = gameStatus.toUpperCase() === "SUSPENDED";
        const isBallRunning =
          gameStatus === "Ball Running" ||
          gameStatus === "BALL RUNNING" ||
          (s.ballsess && s.ballsess === 1);

        let st = "OPEN";
        if (isSuspended) st = "SUSPENDED";
        else if (isBallRunning) st = "SUSPENDED";

        return {
          marketId: `session-${s.SelectionId}`,
          marketName: s.RunnerName,
          marketType: "SESSION",
          status: st,
          inPlay: true,
          bettingType: "LINE",
          marketCondition: {
            marketId: `session-${s.SelectionId}`,
            betDelay: 0,
            minBet: parseFloat(s.min || "100"),
            maxBet: parseFloat(s.max || "25000"),
            maxProfit: 0,
            betLock: false,
          },
          sportingEvent: isBallRunning,
          runners: [
            {
              selectionId: s.SelectionId,
              name: s.RunnerName,
              status: isSuspended || isBallRunning ? "SUSPENDED" : "ACTIVE",
              back: s.BackPrice1
                ? [{ line: s.BackPrice1, price: s.BackSize1 || 100, size: s.BackSize1 || 100 }]
                : null,
              lay: s.LayPrice1
                ? [{ line: s.LayPrice1, price: s.LaySize1 || 100, size: s.LaySize1 || 100 }]
                : null,
            },
          ],
        };
      });
  }, []);

  // Merge all market sources: WebSocket > REST full > fast odds > cached odds
  const lastGoodMarkets = useRef<any[]>(cachedOdds && cachedOdds.length > 0 ? cachedOdds : []);

  const markets = useMemo(() => {
    const hasWsData = wsMarkets.length > 0 || wsBookmakers.length > 0 || wsSessions.length > 0;

    let matchOdds: any[] = [];
    let bookmakerMarkets: any[] = [];
    let sessionMarkets: any[] = [];

    if (hasWsData) {
      matchOdds = wsMarkets;
      bookmakerMarkets = normalizeBookmakers(wsBookmakers);
      sessionMarkets = normalizeSessions(wsSessions);
    } else if (initialData) {
      matchOdds = initialData.matchOdds || [];
      bookmakerMarkets = normalizeBookmakers(initialData.bookmakers || []);
      sessionMarkets = normalizeSessions(initialData.sessions || []);
    } else if (fastOdds && fastOdds.length > 0) {
      // Fast lightweight endpoint returned before the full fetch
      matchOdds = fastOdds;
    }

    // Deduplicate by marketId
    const seenIds = new Set(matchOdds.map((m: any) => m.marketId));
    const deduped = [
      ...matchOdds,
      ...bookmakerMarkets.filter((m: any) => !seenIds.has(m.marketId)),
      ...sessionMarkets,
    ];

    const result = deduped.filter(
      (m: any) => m.status !== "CLOSED" && m.status !== "INACTIVE"
    );

    // Never go empty if we had data before — keep last good markets until new data arrives
    if (result.length > 0) {
      lastGoodMarkets.current = result;
      // console.log("[MatchPage] markets updated:", result.map((m: any) => ({
      //   marketId: m.marketId,
      //   marketName: m.marketName,
      //   marketType: m.marketType,
      //   bettingType: m.bettingType,
      //   status: m.status,
      //   runnersCount: m.runners?.length,
      // })));
      // console.log("[MatchPage] full markets data:", result);
      return result;
    }
    return lastGoodMarkets.current;
  }, [wsMarkets, wsBookmakers, wsSessions, initialData, fastOdds, normalizeBookmakers, normalizeSessions]);

  // Keep a ref to latest markets for price-change detection during bet delay
  const marketsRef = useRef(markets);
  useEffect(() => {
    marketsRef.current = markets;
  }, [markets]);

  // Track last market data update time for the live clock
  const [lastMarketUpdate, setLastMarketUpdate] = useState<Date | null>(null);
  useEffect(() => {
    if (markets.length > 0) setLastMarketUpdate(new Date());
  }, [markets]);

  // Cleanup bet delay timer on unmount
  useEffect(() => {
    return () => {
      if (betDelayTimerRef.current) clearInterval(betDelayTimerRef.current);
    };
  }, []);

  const cancelBetDelay = useCallback(() => {
    if (betDelayTimerRef.current) {
      clearInterval(betDelayTimerRef.current);
      betDelayTimerRef.current = null;
    }
    setBetDelayRemaining(0);
    betDelayResolveRef.current = null;
    setIsPlacing(false);
  }, []);
  // Auto-close QuickBetPanel if the selected market becomes suspended or ball-running
  useEffect(() => {
    if (!quickBet) return;
    const liveMarket = markets.find((m: any) => m.marketId === quickBet.marketId);
    if (!liveMarket) return;
    if (liveMarket.status === "SUSPENDED" || liveMarket.sportingEvent) {
      const reason = liveMarket.status === "SUSPENDED" ? "market suspended" : "ball running";
      cancelBetDelay();
      setQuickBet(null);
      setQuickBetStake("");
      toast.error(`Bet panel closed — ${reason}`);
    }
  }, [markets, quickBet, cancelBetDelay]);

  // Auto-close QuickBetPanel after 10s of no stake interaction
  useEffect(() => {
    if (!quickBet || isPlacing) return;
    const timer = setTimeout(() => {
      setQuickBet(null);
      setQuickBetStake("");
    }, 10000);
    return () => clearTimeout(timer);
  }, [quickBet, quickBetStake, isPlacing]);

  // Derive the current live price for the open QuickBetPanel so it updates in real-time
  const liveQuickBetOdds = useMemo(() => {
    if (!quickBet) return undefined;
    const liveMarket = markets.find((m: any) => m.marketId === quickBet.marketId);
    if (!liveMarket) return undefined;
    const liveRunner = liveMarket.runners?.find(
      (r: any) => r.selectionId?.toString() === quickBet.runner.selectionId?.toString()
    );
    if (!liveRunner) return undefined;
    const prices = quickBet.isLay ? liveRunner.lay : liveRunner.back;
    if (!prices?.length) return undefined;
    const item = prices[quickBet.priceIndex];
    if (!item) return undefined;
    const rawPrice = item?.price ?? item?.[0] ?? null;
    if (rawPrice == null) return undefined;
    const convertOdds = quickBet.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
    return String(convertOdds(parseFloat(String(rawPrice))));
  }, [markets, quickBet]);

  // Preview exposure: calculate what exposure would look like if the current quick bet were placed
  const previewExposure = useMemo(() => {
    if (!quickBet) return null;
    const stakeNum = parseFloat(quickBetStake) || 0;
    if (stakeNum <= 0) return null;

    const { isLay, allRunners, runner, marketId, bettingType } = quickBet;
    const oddsNum = parseFloat(liveQuickBetOdds ?? quickBet.odds) || 0;
    if (oddsNum <= 0) return null;

    // Only for odds/bookmaker markets (not fancy/session)
    if (bettingType === "LINE") return null;

    const selectedId = runner.selectionId?.toString() ?? "";
    const existingMarket = marketExposureMap?.get(String(marketId));

    const map = new Map<string, number>();
    for (const r of allRunners) {
      const rId = r.id;
      const existing = existingMarket?.get(rId) ?? 0;

      let betPnl: number;
      if (isLay) {
        betPnl = rId === selectedId ? -(stakeNum * oddsNum - stakeNum) : stakeNum;
      } else {
        betPnl = rId === selectedId ? (stakeNum * oddsNum - stakeNum) : -stakeNum;
      }

      map.set(rId, existing + betPnl);
    }
    return { marketId: String(marketId), runners: map };
  }, [quickBet, quickBetStake, marketExposureMap, liveQuickBetOdds]);

  // Filter out admin-disabled/hidden markets for user-facing view
  const visibleMarkets = useMemo(
    () => markets.filter((m: any) => !m.adminDisabled && !m.adminHidden),
    [markets]
  );

  const [matchInfo, setMatchInfo] = useState<any>(null);
  // If cached odds exist from sport listing page, start as "success" to avoid any blink
  const [pageStatus, setPageStatus] = useState<
    "connecting" | "connected" | "no-data" | "error" | "success"
  >(() => (cachedOdds && cachedOdds.length > 0 ? "success" : "connecting"));

  const series = useMemo(
    () => seriesData.find((s: { id: string }) => String(s.id) === String(seriesId)),
    [seriesData, seriesId]
  );
  const matchFromSeries = useMemo(
    () => series?.matches?.find((m: { id: string }) => String(m.id) === String(matchId)),
    [series, matchId]
  );

  const hasEverHadMarkets = useRef(!!(cachedOdds && cachedOdds.length > 0));

  useEffect(() => {
    // If we have markets from any source (REST, WS, or cache), show them immediately
    if (visibleMarkets.length > 0) {
      hasEverHadMarkets.current = true;
      setMatchInfo({
        eventName: markets[0]?.eventName || "Match",
        sport: markets[0]?.sport || "Cricket",
        startTime: markets[0]?.startTime,
      });
      setPageStatus("success");
      return;
    }

    // Once we've shown markets, never regress to loading/no-data (WS may momentarily send empty)
    if (hasEverHadMarkets.current) return;

    // Still loading initial data — keep showing loading
    if (initialLoading) {
      setPageStatus("connecting");
      return;
    }

    // Connection error and no data at all
    if (status === "error") {
      setPageStatus("error");
      return;
    }

    // Data sources still loading (WS connecting) — keep showing loading
    if (!isConnected && (status === "connecting" || status === "disconnected")) {
      setPageStatus("connecting");
      const timeout = setTimeout(() => {
        setPageStatus((prev) => (prev === "connecting" ? "no-data" : prev));
      }, 8000);
      return () => clearTimeout(timeout);
    }

    // WS connected but genuinely no markets
    if (isConnected && visibleMarkets.length === 0) {
      setPageStatus("no-data");
    }
  }, [status, isConnected, markets, visibleMarkets.length, initialLoading]);

  const handleQuickBetClose = () => {
    cancelBetDelay();
    setQuickBet(null);
    setQuickBetStake("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    if (!amount) return "0";
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  // Build allRunners for storage in transaction_details
  // LINE markets: only pass the single clicked runner (binary YES/NO market)
  const buildAllRunners = (market: any, clickedRunner: any, clickedPrice: number): RunnerSummary[] => {
    if (market.bettingType === "LINE") {
      return [{ id: clickedRunner.selectionId?.toString() ?? "", name: clickedRunner.name || "", price: clickedPrice }];
    }
    return (market.runners || []).map((r: any) => {
      const isClicked = r.selectionId === clickedRunner.selectionId;
      const price = isClicked
        ? clickedPrice
        : parseFloat(r.back?.[0]?.price || r.lay?.[0]?.price || "0");
      return {
        id: r.selectionId?.toString() ?? "",
        name: r.name || "",
        price,
      };
    });
  };

  const handleBackClick = (market: any, runner: any, odds: number | string, run?: string | null, priceIndex: number = 0) => {
    console.log(odds)
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
    // Block if market is suspended or ball running
    const mktStatus = isMarketBlocked(market.marketId);
    if (mktStatus.blocked) {
      toast.error(mktStatus.reason);
      return;
    }
    setQuickBetStake("");
    setQuickBet({
      marketId: market.marketId,
      bettingType: market.bettingType,
      market,
      runner,
      allRunners: buildAllRunners(market, runner, o),
      eventName: matchInfo?.eventName || "Match",
      odds: String(odds),
      run: run ?? null,
      isLay: false,
      priceIndex,
    });
  };

  const handleLayClick = (market: any, runner: any, odds: number | string, run?: string | null, priceIndex: number = 0) => {
    console.log(odds)
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
    // Block if market is suspended or ball running
    const mktStatus = isMarketBlocked(market.marketId);
    if (mktStatus.blocked) {
      toast.error(mktStatus.reason);
      return;
    }
    setQuickBetStake("");
    setQuickBet({
      marketId: market.marketId,
      bettingType: market.bettingType,
      market,
      runner,
      allRunners: buildAllRunners(market, runner, o),
      eventName: matchInfo?.eventName || "Match",
      odds: String(odds),
      run: run ?? null,
      isLay: true,
      priceIndex,
    });
  };

  // Helper: get current live price for a specific runner's back/lay slot
  const getLivePrice = useCallback(
    (marketId: string, selectionId: string, isLay: boolean, priceIndex: number = 0): string | null => {
      const liveMarket = marketsRef.current.find(
        (m: any) => m.marketId === marketId
      );
      if (!liveMarket) return null;
      const liveRunner = liveMarket.runners?.find(
        (r: any) => r.selectionId?.toString() === selectionId
      );
      if (!liveRunner) return null;
      const prices = isLay ? liveRunner.lay : liveRunner.back;
      if (!prices || prices.length === 0) return null;
      const item = prices[priceIndex];
      if (!item) return null;
      const rawPrice = item?.price ?? item?.[0] ?? null;
      if (rawPrice == null) return null;
      // Convert to decimal odds — fancy/LINE markets use /100 only (no +1)
      const convertOdds = liveMarket.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
      return String(convertOdds(parseFloat(String(rawPrice))));
    },
    []
  );

  // Core bet placement logic (called directly or after delay completes)
  const executeBetPlacement = useCallback(
    async (qb: QuickBetData, stakeStr: string, oddsValue: string) => {
      const { market, runner, allRunners, isLay } = qb;

      // Final pre-placement check: market status
      const liveMarket = marketsRef.current.find((m: any) => m.marketId === market.marketId);
      if (liveMarket) {
        if (liveMarket.status === "SUSPENDED") {
          toast.error("Bet cancelled — market is suspended");
          return;
        }
        if (liveMarket.sportingEvent) {
          toast.error("Bet cancelled — ball is running");
          return;
        }
      }

      // Final pre-placement check: price change on the exact slot user clicked
      const selId = runner.selectionId?.toString() ?? "";
      const currentPrice = getLivePrice(market.marketId, selId, isLay, qb.priceIndex);
      if (currentPrice !== null && currentPrice !== oddsValue) {
        toast.error(`Bet cancelled — price changed from ${oddsValue} to ${currentPrice}`);
        return;
      }

      const marketName = market?.marketName || "";
      const runnerName = runner?.name || "";
      const stakeNum = parseFloat(stakeStr);
      const oddsNum = parseFloat(oddsValue) || 0;
      const marketType = toBettingType(market.bettingType);
      const potentialWin = (stakeNum * oddsNum).toFixed(2);

      const betPayload = {
        id: `slip-${Date.now()}-${market?.marketId ?? ""}-${runner?.selectionId ?? ""}`,
        teams: `${qb.eventName} - ${runnerName}`,
        market: isLay ? `LAY ${marketName}` : marketName,
        odds: oddsValue,
        stake: stakeStr,
        potentialWin,
        matchId,
        marketId: market.marketId,
        selectionId: runner.selectionId?.toString() ?? "",
        marketName,
        runnerName,
        type: (isLay ? "lay" : "back") as "back" | "lay",
        eventTypeId: config?.eventTypeId?.toString(),
      };
      addToBetSlip(betPayload);

      if (user?.isDemo) {
        const demoBet: DemoBet = {
          id: `demo-${betPayload.id}`,
          type: isLay ? "lay" : "back",
          status: "pending",
          stake: stakeNum,
          odds: oddsNum,
          marketName,
          runnerName,
          potentialWin: stakeNum * oddsNum,
          addedDate: new Date().toISOString(),
          matchId,
          marketId: market.marketId,
          selectionId: runner.selectionId?.toString(),
        };
        addDemoBets([demoBet]);
        const userBalance = parseFloat(user?.balance || "0");
        updateDemoBalance((userBalance - stakeNum).toFixed(2));
        queryClient.invalidateQueries({ queryKey: ["my-bets"] });
        toast.success("Bet placed. Balance updated.");
      } else {
        try {
          await placeBetAsync({
            matchId,
            marketId: market.marketId,
            eventTypeId: config?.eventTypeId?.toString() || "4",
            competitionId: seriesId,
            marketType: market.marketType || marketType,
            bettingType: marketType,
            selectionId: runner.selectionId?.toString() ?? "",
            selectionName: runnerName,
            marketName,
            odds: oddsNum,
            stake: stakeNum,
            run: qb.run != null ? parseFloat(qb.run) : null,
            type: isLay ? "lay" : "back",
            runners: allRunners,
          });
          toast.success("Bet placed.");
        } catch (err: unknown) {
          const axiosErr = err as {
            response?: {
              status?: number;
              data?: { error?: string; message?: string };
            };
            message?: string;
          };

          const errStatus = axiosErr.response?.status;
          const rawMessage =
            axiosErr.response?.data?.error ||
            axiosErr.response?.data?.message ||
            (err instanceof Error ? err.message : "Failed to place bet");

          let friendlyMessage = rawMessage;

          if (rawMessage && rawMessage.includes("Bet rejected")) {
            if (rawMessage.includes("no available limit")) {
              friendlyMessage =
                "You have no available limit to place this bet.";
            } else if (rawMessage.includes("exceeds your available limit")) {
              friendlyMessage = "Insufficient limit to place this bet.";
            } else {
              friendlyMessage = "Bet rejected due to insufficient limit.";
            }
          } else if (!rawMessage || (errStatus && errStatus >= 500)) {
            friendlyMessage = "Failed to place bet. Please try again.";
          }

          toast.error(friendlyMessage);
        }
      }
    },
    [
      matchId,
      config,
      user,
      addToBetSlip,
      placeBetAsync,
      queryClient,
      updateDemoBalance,
      getLivePrice,
    ]
  );

  const handleQuickBetPlace = async (stake: string, odds: string) => {
    if (!quickBet || !stake || parseFloat(stake) <= 0) return;
    const { market, runner, isLay } = quickBet;
    const oddsValue = odds || quickBet.odds;
    const stakeNum = parseFloat(stake);

    // Pre-flight: check market status before anything
    const preCheck = isMarketBlocked(market.marketId);
    if (preCheck.blocked) {
      toast.error(`Cannot place bet — ${preCheck.reason}`);
      handleQuickBetClose();
      return;
    }

    // Pre-flight: check if price has changed since panel was opened
    const livePriceNow = getLivePrice(market.marketId, runner.selectionId?.toString() ?? "", isLay, quickBet.priceIndex);
    if (livePriceNow !== null && livePriceNow !== oddsValue) {
      toast.error(`Price changed from ${oddsValue} to ${livePriceNow}. Please try again.`);
      handleQuickBetClose();
      return;
    }

    const minBet = parseFloat(market?.marketCondition?.minBet) || 0;
    const maxBet = parseFloat(market?.marketCondition?.maxBet) || 0;
    if (minBet > 0 && stakeNum < minBet) {
      toast.error(`Minimum bet is ${minBet}`);
      return;
    }
    if (maxBet > 0 && stakeNum > maxBet) {
      toast.error(`Maximum bet is ${maxBet}`);
      return;
    }

    const betDelay = parseFloat(market?.marketCondition?.betDelay) || 0;

    setIsPlacing(true);

    // If betDelay > 0, start countdown and monitor for price changes
    if (betDelay > 0) {
      const selId = runner.selectionId?.toString() ?? "";
      const mktId = market.marketId;
      let remaining = Math.ceil(betDelay);
      setBetDelayRemaining(remaining);

      // Store references for the async delay
      const qbSnapshot = { ...quickBet };
      const stakeSnapshot = stake;
      const oddsSnapshot = oddsValue;

      await new Promise<void>((resolve) => {
        betDelayResolveRef.current = resolve;

        betDelayTimerRef.current = setInterval(() => {
          remaining--;
          setBetDelayRemaining(remaining);

          // Check if market became suspended or ball running during delay
          const delayMarket = marketsRef.current.find((m: any) => m.marketId === mktId);
          if (delayMarket && (delayMarket.status === "SUSPENDED" || delayMarket.sportingEvent)) {
            if (betDelayTimerRef.current)
              clearInterval(betDelayTimerRef.current);
            betDelayTimerRef.current = null;
            setBetDelayRemaining(0);
            setIsPlacing(false);
            betDelayResolveRef.current = null;
            const reason = delayMarket.status === "SUSPENDED" ? "market suspended" : "ball running";
            toast.error(`Bet cancelled — ${reason}`);
            resolve();
            return;
          }

          // Check if price changed during delay
          const currentPrice = getLivePrice(mktId, selId, isLay, qbSnapshot.priceIndex);
          if (currentPrice !== null && currentPrice !== oddsSnapshot) {
            // Price changed — cancel the bet
            if (betDelayTimerRef.current)
              clearInterval(betDelayTimerRef.current);
            betDelayTimerRef.current = null;
            setBetDelayRemaining(0);
            setIsPlacing(false);
            betDelayResolveRef.current = null;
            toast.error(
              `Bet cancelled — price changed from ${oddsSnapshot} to ${currentPrice}`
            );
            resolve();
            return;
          }

          if (remaining <= 0) {
            // Delay complete, price unchanged — proceed with placement
            if (betDelayTimerRef.current)
              clearInterval(betDelayTimerRef.current);
            betDelayTimerRef.current = null;
            setBetDelayRemaining(0);
            betDelayResolveRef.current = null;

            executeBetPlacement(qbSnapshot, stakeSnapshot, oddsSnapshot)
              .finally(() => {
                setIsPlacing(false);
                handleQuickBetClose();
              });
            resolve();
          }
        }, 1000);
      });

      return;
    }

    // No delay — place immediately
    await executeBetPlacement(quickBet, stake, oddsValue);
    setIsPlacing(false);
    handleQuickBetClose();
  };

  // Check if a market is currently suspended or ball-running from live WS data
  const isMarketBlocked = useCallback((marketId: string): { blocked: boolean; reason: string } => {
    const liveMarket = marketsRef.current.find((m: any) => m.marketId === marketId);
    if (!liveMarket) return { blocked: false, reason: "" };
    if (liveMarket.status === "SUSPENDED") return { blocked: true, reason: "Market is suspended" };
    if (liveMarket.sportingEvent) return { blocked: true, reason: "Ball is running" };
    return { blocked: false, reason: "" };
  }, []);

  if (pageStatus === "error") {
    return (
      <div className="px-3 py-2">
        <div className="rounded-xl bg-gradient-to-b from-[#101e50] to-[#0b1545] border border-[#1e4088]/40 flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-red-400 text-3xl">!</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Connection Failed</h2>
            <p className="text-white/50 text-sm mb-4">Unable to connect to the live data server.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-gradient-to-r from-[#142969] to-[#84c2f1] text-white rounded-lg hover:from-[#1a3578] hover:to-[#9dd0f5] text-sm font-semibold shadow-lg shadow-[#142969]/30 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageStatus === "connecting" || pageStatus === "connected") {
    return (
      <div className="px-3 py-2">
        <div className="rounded-xl bg-gradient-to-b from-[#101e50] to-[#0b1545] border border-[#1e4088]/40 flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-4 border-[#1e4088] border-t-[#84c2f1] rounded-full animate-spin mb-3"></div>
            <p className="text-white/50 text-sm">Loading match data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageStatus === "no-data") {
    const eventDate = matchFromSeries?.openDate || matchInfo?.startTime;
    const isEventEnded = eventDate && new Date(eventDate) < new Date();

    return (
      <div className="px-2 py-1">
        {/* Show match header if available */}
        {(matchInfo || series || matchFromSeries) && (
          <div className="bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] rounded-lg px-3 sm:px-4 py-3 mb-2 shadow-md border border-[#1e4088]/30">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-white font-bold text-base sm:text-lg truncate">
                  {[series?.name, matchFromSeries?.name || matchInfo?.eventName || "Match"]
                    .filter(Boolean)
                    .join(" - ")}
                </h1>
              </div>
              {eventDate && (
                <span className="text-white/60 text-xs sm:text-sm shrink-0">
                  {formatDate(eventDate)}
                </span>
              )}
            </div>
          </div>
        )}

        {isEventEnded ? (
          <div className="rounded-xl bg-gradient-to-b from-[#101e50] to-[#0b1545] border border-[#1e4088]/40 flex items-center justify-center py-16">
            <div className="text-center max-w-md px-4">
              <div className="w-14 h-14 mx-auto bg-[#1e4088]/30 rounded-full flex items-center justify-center mb-4 border border-[#1e4088]/40">
                <svg className="w-7 h-7 text-[#5878a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Event Has Ended</h2>
              <p className="text-white/50 text-sm mb-1">This event concluded on {formatDate(eventDate)}.</p>
              <p className="text-xs text-white/30">Markets are no longer available for this match.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-gradient-to-b from-[#101e50] to-[#0b1545] border border-[#1e4088]/40 flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <h2 className="text-lg font-semibold text-white mb-2">No Active Markets</h2>
              <p className="text-white/50 text-sm mb-1">This match currently has no open markets.</p>
              <p className="text-xs text-white/30">Markets will appear automatically when they become available.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const backLayOverlay = (market: any) => {
    const show = market?.sportingEvent || market?.status === "SUSPENDED";
    if (!show) return null;
    const label = market?.status === "SUSPENDED" ? "Suspended" : "Ball Running";
    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-10 cursor-not-allowed bg-white/70 backdrop-blur-[1px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-danger-strong font-bold text-xs sm:text-sm bg-red-50 px-3 py-1 rounded-full border border-red-200/50 shadow-sm">
          {label}
        </span>
      </div>
    );
  };

  const oddsBtnClass =
    "flex-1 min-w-0 px-1 py-1.5 flex flex-col items-center justify-center rounded-md cursor-pointer leading-tight transition-all duration-150";
  const oddsPriceClass = "text-gray-900 font-bold text-sm sm:text-base";
  const oddsSizeClass = "text-gray-900 font-bold text-[11px] sm:text-[13px]";

  // Runner name cell: shows name + per-runner P&L from DB function
  const RunnerNameCell = ({
    runner,
    marketId,
    displayName,
    isFancy,
    betDelay,
  }: {
    runner: any;
    marketId: string;
    displayName?: string;
    isFancy?: boolean;
    betDelay?: number;
  }) => {
    const runnerId = runner.selectionId?.toString() ?? "";
    let pnl: number | null = null;

    if (isFancy) {
      // Fancy markets: per-market worst-case P&L (not per-runner)
      pnl = fancyExposureMap?.get(String(marketId)) ?? null;
    } else if (previewExposure && previewExposure.marketId === String(marketId)) {
      // Show preview exposure (existing + hypothetical bet) when quick bet panel is active
      pnl = previewExposure.runners.get(runnerId) ?? null;
    } else {
      // Odds/bookmaker markets: per-runner P&L from DB
      const marketRunners = marketExposureMap?.get(String(marketId));
      pnl = marketRunners?.get(runnerId) ?? null;
    }

    const handleNameClick = () => {
      if (isFancy) {
        setExposureChartMarket({ marketId: String(marketId), name: displayName ?? runner.name });
      }
    };

    return (
      <div className="min-w-0 pr-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-4">
        {(displayName !== "" || !isFancy) && (
          <span
            className={`text-gray-900 font-bold text-sm sm:text-base block leading-tight ${isFancy ? "cursor-pointer" : "truncate"}`}
            onClick={handleNameClick}
          >
            {displayName || runner.name}
          </span>
        )}
        {betDelay != null && (
          <span className=" flex items-center text-[8px] sm:text-[9px] text-black font-medium leading-tight">
            <Timer size={20}/>
             <span>
            {betDelay}s

            </span>
          </span>
        )}
        </div>

        {pnl !== null && (
          <span
            className={`text-[10px] sm:text-xs font-bold leading-tight ${
              pnl >= 0 ? "text-live-text" : "text-danger"
            }`}
          >
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-2 sm:px-3 py-2 w-full max-w-full min-w-0 min-h-full">
      {/* Match header */}
      {(matchInfo || series || matchFromSeries) && (() => {
        const matchOddsMarket = visibleMarkets.find((m: any) => m.marketType === "MATCH_ODDS");
        const runnerNames = matchOddsMarket?.runners?.map((r: any) => r.name).filter(Boolean) ?? [];
        const openDate = matchFromSeries?.openDate || matchInfo?.startTime;
        const clockStr = lastMarketUpdate
          ? lastMarketUpdate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
            "." +
            String(lastMarketUpdate.getMilliseconds()).padStart(3, "0")
          : null;

        return (
          <div className="bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] rounded-lg px-3 sm:px-4 py-3 mb-2 shadow-md border border-[#1e4088]/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {series?.name && (
                  <p className="text-[#84c2f1] font-bold text-xs sm:text-sm truncate leading-tight mb-0.5 uppercase tracking-wide font-condensed">
                    {series.name}
                  </p>
                )}
                <h1 className="text-white font-bold text-base sm:text-lg truncate leading-tight">
                  {matchFromSeries?.name || matchInfo?.eventName || "Match"}
                </h1>
              </div>
              <div className="shrink-0 text-right">
                {openDate && (
                  <span className="text-white/60 text-xs sm:text-sm block">
                    {formatDate(openDate)}
                  </span>
                )}
                {clockStr && (
                  <span className="text-[#84c2f1] font-mono text-[11px] sm:text-xs block mt-0.5 bg-black/20 px-2 py-0.5 rounded">
                    {clockStr}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="space-y-1">
        {visibleMarkets.map(
          (market) =>
            (market.bettingType == "ODDS" || market.bettingType == "BOOKMAKER") &&
            market.marketType !== "TOURNAMENT_WINNER" && (
              <div
                key={market.marketId}
                className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
              >
                <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] items-center">
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight">
                      {market.marketName}
                    </h3>
                    <p className="text-white/70 text-xs flex items-center sm:text-sm truncate leading-tight">
                      Min: {market.marketCondition?.["minBet"] ?? "-"} / Max:{" "}
                      {market.marketCondition?.["maxBet"] ?? "-"}
                      {market.marketCondition?.betDelay != null && (
                        <span className="flex items-center ml-1 text-yellow-300">· <Timer size={15}/> <span>{market.marketCondition.betDelay}s </span></span>
                      )}
                    </p>
                  </div>
                  <div className="justify-self-end font-bold uppercase bg-back text-black text-xs sm:text-sm py-0.5 px-1.5 rounded">
                    Back
                  </div>
                  <div className="font-bold uppercase bg-lay text-black text-xs sm:text-sm py-0.5 px-1.5 rounded w-fit">
                    Lay
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {market.runners.map((runner: any) => {
                    const isRunnerSuspended = runner.status === "SUSPENDED" || runner.status === "REMOVED" || market.status === "SUSPENDED" || !!market.sportingEvent;
                    return (
                    <div
                      key={runner.selectionId}
                      className="px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white hover:bg-gray-50/80 transition-colors"
                    >
                      <RunnerNameCell
                        runner={runner}
                        marketId={market.marketId}
                      />
                      <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                        <div className="flex-1 flex flex-col items-end min-w-0">
                          <div className="gap-1 flex justify-end items-center flex-wrap">
                            {(() => {
                              if (isRunnerSuspended) {
                                return Array(3).fill(null).map((_, posIdx) => (
                                  <button key={`back-suspended-${posIdx}`} className={`${oddsBtnClass} bg-back-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>0</span>
                                    <span className={oddsSizeClass}>0</span>
                                  </button>
                                ));
                              }
                              const backItems = runner.back || [];
                              const positions = Array(3).fill(null);
                              backItems.forEach((item: any, idx: number) => {
                                if (idx < 3) positions[2 - idx] = item;
                              });
                              return positions.map((item, posIdx) =>
                                item ? (
                                  <button
                                    key={`back-${posIdx}`}
                                    onClick={() => handleBackClick(
                                      market,
                                      runner,
                                      toDecimalOdds(item.price),
                                      null,
                                      2 - posIdx
                                    )}
                                    className={`${oddsBtnClass} transition-all w-24 ${posIdx === 2 ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm" : "bg-white hover:bg-back/30 border border-back/50"}`}
                                  >
                                    <span className={oddsPriceClass}>{item.price}</span>
                                    <span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                                  </button>
                                ) : (
                                  <button key={`empty-back-${posIdx}`} className={`${oddsBtnClass} bg-back-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>-</span>
                                    <span className={oddsSizeClass}>-</span>
                                  </button>
                                )
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-start min-w-0 ">
                          <div className="gap-1 flex justify-start items-center flex-wrap ">
                            {isRunnerSuspended
                              ? Array(3).fill(null).map((_, idx) => (
                                  <button key={`lay-suspended-${idx}`} className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>0</span>
                                    <span className={oddsSizeClass}>0</span>
                                  </button>
                                ))
                              : <>
                                {runner.lay && runner.lay.length > 0
                                  ? runner.lay.map((layItem: any, layIdx: number) => (
                                      <button
                                        key={layIdx}
                                        onClick={() => handleLayClick(
                                          market,
                                          runner,
                                          toDecimalOdds(layItem.price),
                                          null,
                                          layIdx
                                        )}
                                        className={`${oddsBtnClass} transition-all w-24 ${layIdx === 0 ? "bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay shadow-sm" : "bg-white hover:bg-lay/30 border border-lay/50"}`}
                                      >
                                        <span className={oddsPriceClass}>{layItem.price ? layItem.price : "0"}</span>
                                        <span className={oddsSizeClass}>{formatAmount(layItem.size)}</span>
                                      </button>
                                    ))
                                  : null}
                                {Array.from({ length: Math.max(0, 3 - (runner.lay?.length || 0)) }).map((_, emptyIdx) => (
                                  <button key={`empty-lay-${emptyIdx}`} className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>-</span>
                                    <span className={oddsSizeClass}>-</span>
                                  </button>
                                ))}
                              </>
                            }
                          </div>
                        </div>
                        {backLayOverlay(market)}
                      </div>
                    </div>
                    );
                  })}
                </div>
                {quickBet &&
                  quickBet.marketId === market.marketId &&
                  (quickBet.bettingType === "ODDS" || quickBet.bettingType === "BOOKMAKER") && (
                    <QuickBetPanel
                      data={quickBet}
                      stake={quickBetStake}
                      onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose}
                      onPlaceBet={handleQuickBetPlace}
                      isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining}
                      onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes}
                      currentOdds={liveQuickBetOdds}
                    />
                  )}
              </div>
            )
        )}

        {visibleMarkets.some((m) => m.marketType === "TOURNAMENT_WINNER") && (
          visibleMarkets
            .filter((m: any) => m.marketType === "TOURNAMENT_WINNER")
            .map((market: any) => (
              <div
                key={market.marketId}
                className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
              >
                <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] items-center">
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight">
                      {market.marketName || "Tournament Winner"}
                    </h3>
                    <p className="text-white/70 text-xs sm:text-sm truncate leading-tight">
                      Min: {market.marketCondition?.["minBet"] ?? "-"} / Max:{" "}
                      {market.marketCondition?.["maxBet"] ?? "-"}
                    </p>
                  </div>
                  <div className="justify-self-end font-bold uppercase bg-back text-black text-xs sm:text-sm py-0.5 px-1.5 rounded">
                    Back
                  </div>
                  <div className="font-bold uppercase bg-lay text-black text-xs sm:text-sm py-0.5 px-1.5 rounded w-fit">
                    Lay
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {market.runners.map((runner: any) => {
                    const isRunnerSuspended = runner.status === "SUSPENDED" || runner.status === "REMOVED" || market.status === "SUSPENDED" || !!market.sportingEvent;
                    return (
                    <div
                      key={runner.selectionId}
                      className="px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white hover:bg-gray-50/80 transition-colors"
                    >
                      <RunnerNameCell
                        runner={runner}
                        marketId={market.marketId}
                      />
                      <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                        <div className="flex-1 flex flex-col items-end min-w-0">
                          <div className="gap-1 flex justify-end items-center flex-wrap">
                            {(() => {
                              if (isRunnerSuspended) {
                                return Array(3).fill(null).map((_, posIdx) => (
                                  <button key={`back-suspended-${posIdx}`} className={`${oddsBtnClass} bg-back-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>0</span>
                                    <span className={oddsSizeClass}>0</span>
                                  </button>
                                ));
                              }
                              const backItems = runner.back || [];
                              const positions = Array(3).fill(null);
                              backItems.forEach((item: any, idx: number) => {
                                if (idx < 3) positions[2 - idx] = item;
                              });
                              return positions.map((item, posIdx) =>
                                item ? (
                                  <button
                                    key={`back-${posIdx}`}
                                    onClick={() => handleBackClick(
                                      market,
                                      runner,
                                      toDecimalOdds(item.price),
                                      null,
                                      2 - posIdx
                                    )}
                                    className={`${oddsBtnClass} transition-all w-24 ${posIdx === 2 ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm" : "bg-white hover:bg-back/30 border border-back/50"}`}
                                  >
                                    <span className={oddsPriceClass}>{item.price}</span>
                                    <span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                                  </button>
                                ) : (
                                  <button key={`empty-back-${posIdx}`} className={`${oddsBtnClass} bg-back-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>-</span>
                                    <span className={oddsSizeClass}>-</span>
                                  </button>
                                )
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-start min-w-0">
                          <div className="gap-1 flex justify-start items-center flex-wrap">
                            {isRunnerSuspended
                              ? Array(3).fill(null).map((_, idx) => (
                                  <button key={`lay-suspended-${idx}`} className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>0</span>
                                    <span className={oddsSizeClass}>0</span>
                                  </button>
                                ))
                              : <>
                                {runner.lay && runner.lay.length > 0
                                  ? runner.lay.map((layItem: any, layIdx: number) => (
                                      <button
                                        key={layIdx}
                                        onClick={() => handleLayClick(
                                          market,
                                          runner,
                                          toDecimalOdds(layItem.price),
                                          null,
                                          layIdx
                                        )}
                                        className={`${oddsBtnClass} transition-all w-24 ${layIdx === 0 ? "bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay shadow-sm" : "bg-white hover:bg-lay/30 border border-lay/50"}`}
                                      >
                                        <span className={oddsPriceClass}>{layItem.price ? layItem.price : "0"}</span>
                                        <span className={oddsSizeClass}>{formatAmount(layItem.size)}</span>
                                      </button>
                                    ))
                                  : null}
                                {Array.from({ length: Math.max(0, 3 - (runner.lay?.length || 0)) }).map((_, emptyIdx) => (
                                  <button key={`empty-lay-${emptyIdx}`} className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled>
                                    <span className={oddsPriceClass}>-</span>
                                    <span className={oddsSizeClass}>-</span>
                                  </button>
                                ))}
                              </>
                            }
                          </div>
                        </div>
                        {backLayOverlay(market)}
                      </div>
                    </div>
                    );
                  })}
                </div>
                {quickBet &&
                  quickBet.marketId === market.marketId && (
                    <QuickBetPanel
                      data={quickBet}
                      stake={quickBetStake}
                      onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose}
                      onPlaceBet={handleQuickBetPlace}
                      isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining}
                      onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes}
                      currentOdds={liveQuickBetOdds}
                    />
                  )}
              </div>
            ))
        )}

        {visibleMarkets.some((m) => m.bettingType === "LINE") && (
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] items-center">
            <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight" style={{gridColumn: "1"}}>
              Fancy
            </h3>
            <div className="justify-self-end font-bold uppercase bg-lay text-black text-xs sm:text-sm py-0.5 px-1.5 rounded w-fit">
              NO
            </div>
            <div className="w-fit font-bold uppercase bg-back text-black text-xs sm:text-sm py-0.5 px-1.5 rounded">
              YES
            </div>
          </div>
          {visibleMarkets.map(
            (market) =>
              market.bettingType == "LINE" && (
                <div key={market.marketId} className="border-b border-gray-100 last:border-b-0 bg-white">
                  {(() => {
                    const isMarketSuspended = market.status === "SUSPENDED" || !!market.sportingEvent;
                    const visibleRunners = isMarketSuspended
                      ? market.runners
                      : market.runners.filter((r: any) => r.status !== "SUSPENDED" && r.status !== "REMOVED");
                    const midIdx = Math.floor((visibleRunners.length - 1) / 2);
                    return visibleRunners.map((runner: any, runnerIdx: number) => {
                      const isRunnerSuspended = isMarketSuspended;
                      const showLabel = runnerIdx === midIdx;
                      return (
                        <div key={runner.selectionId} className={`px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white${market.runners.length > 1 ? " py-0.5" : ""}`}>
                          {showLabel ? (
                            <RunnerNameCell
                              runner={runner}
                              marketId={market.marketId}
                              displayName={market.marketName}
                              isFancy
                              betDelay={market.marketCondition?.betDelay}
                            />
                          ) : (
                            <div />
                          )}
                          <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                            <div className="flex-1 flex flex-col items-end min-w-0">
                              <div className="gap-1 flex justify-end items-center flex-wrap">
                                {isRunnerSuspended ? (
                                  <button className={`${oddsBtnClass} bg-back-disabled w-24`} disabled><span className={oddsPriceClass}>0</span><span className={oddsSizeClass}>0</span></button>
                                ) : runner.lay?.length > 0 ? (
                                  runner.lay.map((layItem: any, layIdx: number) => (
                                    <button key={layIdx} onClick={() => handleLayClick(market, runner, toDecimalfancyOdds(layItem.price), String(layItem.line ?? ""), layIdx)} className={`${oddsBtnClass} bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay shadow-sm transition-all w-24`}>
                                      <span className={oddsPriceClass}>{layItem.line}</span><span className={oddsSizeClass}>{formatAmount(layItem.price)}</span>
                                    </button>
                                  ))
                                ) : (
                                  <button className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled><span className={oddsPriceClass}>-</span><span className={oddsSizeClass}>-</span></button>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                              <div className="gap-1 flex justify-start items-center flex-wrap min-w-0">
                                {isRunnerSuspended ? (
                                  <button className={`${oddsBtnClass} bg-back-disabled w-24`} disabled><span className={oddsPriceClass}>0</span><span className={oddsSizeClass}>0</span></button>
                                ) : runner.back?.length > 0 ? (
                                  runner.back.map((backItem: any, backIdx: number) => (
                                    <button key={backIdx} onClick={() => handleBackClick(market, runner, toDecimalfancyOdds(backItem.price), String(backItem.line ?? ""), backIdx)} className={`${oddsBtnClass} transition-all w-24 ${backIdx === 0 ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm" : "bg-white hover:bg-back/30 border border-back/50"}`}>
                                      <span className={oddsPriceClass}>{backItem.line}</span><span className={oddsSizeClass}>{formatAmount(backItem.price)}</span>
                                    </button>
                                  ))
                                ) : (
                                  <button className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled><span className={oddsPriceClass}>-</span><span className={oddsSizeClass}>-</span></button>
                                )}
                              </div>
                              {showLabel && (
                                <div className="hidden sm:flex flex-col text-xs text-black font-bold leading-tight text-right shrink-0">
                                  <span>Max:{market.marketCondition?.["maxBet"] ?? "-"}</span>
                                  <span>MKT:{market.marketCondition?.["potLimit"] ?? market.marketCondition?.["maxProfit"] ?? "-"}</span>
                                </div>
                              )}
                            </div>
                            {backLayOverlay(market)}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {quickBet && quickBet.marketId === market.marketId && quickBet.bettingType === "LINE" && (
                    <QuickBetPanel
                      data={quickBet}
                      stake={quickBetStake}
                      onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose}
                      onPlaceBet={handleQuickBetPlace}
                      isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining}
                      onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes}
                      currentOdds={liveQuickBetOdds}
                    />
                  )}
                </div>
              )
          )}
        </div>
        )}
      </div>

      {/* Fancy Exposure Chart Modal */}
      {exposureChartMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setExposureChartMarket(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-md max-h-[80vh] overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#142969] to-[#1a3578] text-white">
              <div>
                <h3 className="font-semibold text-sm">Exposure</h3>
                <p className="text-xs text-white/80">{exposureChartMarket.name}</p>
              </div>
              <button onClick={() => setExposureChartMarket(null)} className="text-white hover:text-white/70 text-xl leading-none">&times;</button>
            </div>
            {isExposureChartLoading ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-6 h-6 border-2 border-sports-header border-t-transparent rounded-full animate-spin" />
              </div>
            ) : exposureChartData && exposureChartData.length > 0 ? (
              <div className="overflow-y-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <tbody>
                    {exposureChartData.map((row) => (
                      <tr
                        key={row.run}
                        className={row.profit >= 0 ? "bg-blue-200" : "bg-red-200"}
                      >
                        <td className="px-4 py-2 font-medium text-gray-800 border-b border-gray-200">{row.run}</td>
                        <td className={`px-4 py-2 text-right font-semibold border-b border-gray-200 ${row.profit >= 0 ? "text-gray-800" : "text-danger"}`}>
                          {row.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-10">No exposure data</div>
            )}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-center">
              <button
                onClick={() => setExposureChartMarket(null)}
                className="px-6 py-1.5 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
