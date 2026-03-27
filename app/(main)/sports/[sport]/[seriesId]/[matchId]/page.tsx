"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBetting, useMyBets, useMarketExposure, useFancyMarketExposure } from "@/hooks/useBetting";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useSeries } from "@/hooks/useSportsApi";
import { sportsApi } from "@/lib/api";
import { getSportConfig } from "@/lib/sports-config";
import { addDemoBets } from "@/lib/demo-bets";
import type { DemoBet } from "@/lib/demo-bets";
import { toast } from "sonner";

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

function QuickBetPanel({
  data,
  stake,
  onStakeChange,
  onClose,
  onPlaceBet,
  isLoading,
  betDelayRemaining,
  onCancelDelay,
}: {
  data: QuickBetData;
  stake: string;
  onStakeChange: (val: string) => void;
  onClose: () => void;
  onPlaceBet: (stake: string, odds: string) => void;
  isLoading?: boolean;
  betDelayRemaining?: number;
  onCancelDelay?: () => void;
}) {
  const { market, runner, odds } = data;
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

  const quickStakes = [100, 500, 1000, 5000, 10000, 50000];
  const isDelaying = betDelayRemaining != null && betDelayRemaining > 0;

  const handleStake = (val: string) => {
    const n = parseFloat(val) || 0;
    onStakeChange(n > 0 ? String(n) : "");
  };

  const canPlace = !!stake && stakeNum > 0 && !stakeError && !isLoading && !isDelaying;

  return (
    <div className="px-2 sm:px-3 py-3 border-t border-teal-600 bg-gradient-to-b from-sky-200/90 via-sky-100/80 to-white dark:from-sky-900/40 dark:via-sky-800/30 dark:to-gray-900">
      {/* Bet delay countdown banner */}
      {isDelaying && (
        <div className="mb-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
            <span className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">
              Placing in {betDelayRemaining}s...
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelDelay}
            className="px-2 py-0.5 text-xs bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-200 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Top Section: Label, Odds, Stake */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 justify-end mb-3">
        <div className="text-black dark:text-white font-bold text-xs sm:text-sm truncate max-w-full sm:max-w-none text-right sm:text-left">
          {runnerName} - {marketName.toUpperCase()}
        </div>

        <div className="flex items-center">
          <input
            type="text"
            value={odds}
            readOnly
            className="w-14 sm:w-16 bg-white dark:bg-gray-800 text-black dark:text-white text-[10px] sm:text-xs py-1.5 px-2 text-center border border-gray-300 dark:border-gray-600 rounded cursor-default"
          />
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center">
            <input
              type="number"
              value={stake}
              onChange={(e) => handleStake(e.target.value)}
              placeholder="1"
              autoFocus
              disabled={isDelaying}
              className={`w-14 sm:w-16 bg-white dark:bg-gray-800 text-black dark:text-white text-[10px] sm:text-xs py-1.5 px-2 text-center border rounded focus:ring-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                stakeError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              } ${isDelaying ? "opacity-50" : ""}`}
            />
            <div className="flex flex-col ml-0.5">
              <button
                type="button"
                disabled={isDelaying}
                onClick={() => handleStake(String((parseFloat(stake) || 0) + 1))}
                className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1 py-0.5 text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-t disabled:opacity-50"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={isDelaying}
                onClick={() => handleStake(String(Math.max(0, (parseFloat(stake) || 0) - 1)))}
                className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1 py-0.5 text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b disabled:opacity-50"
              >
                ▼
              </button>
            </div>
          </div>
          {stakeError && (
            <span className="text-red-500 text-[9px] sm:text-[10px] font-medium">{stakeError}</span>
          )}
        </div>
      </div>

      {/* Quick stake buttons + actions */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {quickStakes.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={isDelaying}
              onClick={() => onStakeChange(String(amount))}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
            >
              {amount >= 1000 ? amount / 1000 + "K" : amount}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPlaceBet(stake, odds)}
            disabled={!canPlace}
            className="min-w-[84px] sm:min-w-[96px] px-4 sm:px-5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-1.5"
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
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
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
// Non-decimal prices (whole numbers like 150, 100) are Indian format → divide by 100.
// Prices already in decimal (e.g. 1.50, 2.40) are passed through as-is.
function toDecimalOdds(price: number): number {
  const str = price.toString();
  if (str.includes('.')) return price; // already decimal
  return price / 100;
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

  const config = getSportConfig(sport);
  const eventTypeId = config?.eventTypeId ?? "4";
  const { data: seriesData = [] } = useSeries(config?.eventTypeId ?? null);
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
      return result;
    }
    return lastGoodMarkets.current;
  }, [wsMarkets, wsBookmakers, wsSessions, initialData, fastOdds, normalizeBookmakers, normalizeSessions]);

  // Keep a ref to latest markets for price-change detection during bet delay
  const marketsRef = useRef(markets);
  useEffect(() => {
    marketsRef.current = markets;
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
      // Convert to decimal odds to match the stored format
      return String(toDecimalOdds(parseFloat(String(rawPrice))));
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
      <div className="px-2 py-1">
        <div className="rounded-lg bg-gray-900 flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-red-400 text-3xl">!</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Connection Failed</h2>
            <p className="text-gray-400 text-sm mb-4">Unable to connect to the live data server.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm"
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
      <div className="px-2 py-1">
        <div className="rounded-lg bg-gray-900 flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400 text-sm">Loading match data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageStatus === "no-data") {
    return (
      <div className="px-2 py-1">
        {/* Show match header if available */}
        {(matchInfo || series || matchFromSeries) && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-3 mb-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-white font-semibold text-base sm:text-lg truncate">
                  {[series?.name, matchFromSeries?.name || matchInfo?.eventName || "Match"]
                    .filter(Boolean)
                    .join(" - ")}
                </h1>
              </div>
              {(matchFromSeries?.openDate || matchInfo?.startTime) && (
                <span className="text-gray-400 text-xs sm:text-sm shrink-0">
                  {formatDate(matchFromSeries?.openDate || matchInfo?.startTime)}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="rounded-lg bg-gray-900 flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <h2 className="text-lg font-semibold text-white mb-2">No Active Markets</h2>
            <p className="text-gray-400 text-sm mb-1">This match currently has no open markets.</p>
            <p className="text-xs text-gray-500">Markets will appear automatically when they become available.</p>
          </div>
        </div>
      </div>
    );
  }

  const backLayOverlay = (market: any) => {
    const show = market?.sportingEvent || market?.status === "SUSPENDED";
    if (!show) return null;
    const label = market?.status === "SUSPENDED" ? "Suspended" : "Ball Running";
    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-10 cursor-not-allowed bg-white/60 dark:bg-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-red-600 font-bold text-sm sm:text-base">
          {label}
        </span>
      </div>
    );
  };

  const oddsBtnClass =
    "flex-1 min-w-0 px-1 py-1 flex flex-col items-center justify-center border-none rounded cursor-pointer leading-tight";
  const oddsPriceClass = "text-black font-bold text-[10px] sm:text-xs";
  const oddsSizeClass = "text-black/50 font-medium text-[8px] sm:text-[9px]";

  // Runner name cell: shows name + per-runner P&L from DB function
  const RunnerNameCell = ({
    runner,
    marketId,
    displayName,
    isFancy,
  }: {
    runner: any;
    marketId: string;
    displayName?: string;
    isFancy?: boolean;
  }) => {
    const runnerId = runner.selectionId?.toString() ?? "";
    let pnl: number | null = null;

    if (isFancy) {
      // Fancy markets: per-market worst-case P&L (not per-runner)
      pnl = fancyExposureMap?.get(String(marketId)) ?? null;
    } else {
      // Odds/bookmaker markets: per-runner P&L
      const marketRunners = marketExposureMap?.get(String(marketId));
      pnl = marketRunners?.get(runnerId) ?? null;
    }

    return (
      <div className="min-w-0 pr-1 flex flex-col gap-0.5">
        <span className="text-black dark:text-white font-semibold text-[11px] sm:text-xs truncate block leading-tight">
          {displayName ?? runner.name}
        </span>
        {pnl !== null && (
          <span
            className={`text-[9px] sm:text-[10px] font-semibold leading-tight ${
              pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-1 sm:px-2 py-1 w-full max-w-full min-w-0 bg-gray-50 dark:bg-gray-900 min-h-full ">
      {/* Match header */}
      {(matchInfo || series || matchFromSeries) && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-3 mb-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-semibold text-base sm:text-lg truncate">
                {[series?.name, matchFromSeries?.name || matchInfo?.eventName || "Match"]
                  .filter(Boolean)
                  .join(" - ")}
              </h1>
            </div>
            {(matchFromSeries?.openDate || matchInfo?.startTime) && (
              <span className="text-gray-400 text-xs sm:text-sm shrink-0">
                {formatDate(matchFromSeries?.openDate || matchInfo?.startTime)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        {visibleMarkets.map(
          (market) =>
            (market.bettingType == "ODDS" || market.bettingType == "BOOKMAKER") && (
              <div
                key={market.marketId}
                className="rounded overflow-hidden border border-gray-300 dark:border-gray-700"
              >
                <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1 border-b border-gray-700 bg-gray-900/50 items-center">
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <h3 className="font-semibold text-white text-[11px] sm:text-xs truncate leading-tight">
                      {market.marketName}
                    </h3>
                    <p className="text-gray-400 text-[9px] sm:text-[10px] truncate leading-tight">
                      Min: {market.marketCondition?.["minBet"] ?? "-"} / Max:{" "}
                      {market.marketCondition?.["maxBet"] ?? "-"}
                    </p>
                  </div>
                  <div className="justify-self-end font-semibold uppercase bg-[#72BBEF] text-black text-[10px] sm:text-xs py-0.5 px-1.5 rounded">
                    Back
                  </div>
                  <div className="font-semibold uppercase bg-[#FAA9BA] text-black text-[10px] sm:text-xs py-0.5 px-1.5 rounded w-fit">
                    Lay
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {market.runners.map((runner: any) => (
                    <div
                      key={runner.selectionId}
                      className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white dark:bg-gray-800"
                    >
                      <RunnerNameCell
                        runner={runner}
                        marketId={market.marketId}
                      />
                      <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                        <div className="flex-1 flex flex-col items-end min-w-0">
                          <div className="gap-1 flex justify-end items-center flex-wrap">
                            {(() => {
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
                                    className={`${oddsBtnClass} hover:bg-[#60ADDF] transition-colors bg-[#72BBEF] w-20`}
                                  >
                                    <span className={oddsPriceClass}>{item.price}</span>
                                    <span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                                  </button>
                                ) : (
                                  <button key={`empty-back-${posIdx}`} className={`${oddsBtnClass} bg-[#a8d8f0] w-20`} disabled>
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
                                    className={`${oddsBtnClass} hover:bg-[#E898A8] transition-colors bg-[#FAA9BA] w-20`}
                                  >
                                    <span className={oddsPriceClass}>{layItem.price ? layItem.price : "0"}</span>
                                    <span className={oddsSizeClass}>{formatAmount(layItem.size)}</span>
                                  </button>
                                ))
                              : null}
                            {Array.from({ length: Math.max(0, 3 - (runner.lay?.length || 0)) }).map((_, emptyIdx) => (
                              <button key={`empty-lay-${emptyIdx}`} className={`${oddsBtnClass} bg-[#f5c9d3] w-20`} disabled>
                                <span className={oddsPriceClass}>-</span>
                                <span className={oddsSizeClass}>-</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        {backLayOverlay(market)}
                      </div>
                    </div>
                  ))}
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
                    />
                  )}
              </div>
            )
        )}

        {visibleMarkets.some((m) => m.bettingType === "LINE") && (
        <div className="rounded overflow-hidden border border-gray-300 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1 border-b border-gray-700 bg-gray-900/50 items-center">
            <h3 className="font-semibold text-white text-[11px] sm:text-xs truncate leading-tight">
              Fancy
            </h3>
            <div className="justify-self-end font-semibold uppercase bg-[#72BBEF] text-black text-[10px] sm:text-xs py-0.5 px-1.5 rounded w-fit">
              NO
            </div>
            <div className="w-fit font-semibold uppercase bg-[#FAA9BA] text-black text-[10px] sm:text-xs py-0.5 px-1.5 rounded">
              YES
            </div>
          </div>
          {visibleMarkets.map(
            (market) =>
              market.bettingType == "LINE" && (
                <div key={market.marketId} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {market.runners.map((runner: any) => (
                      <div
                        key={runner.selectionId}
                        className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white dark:bg-gray-800"
                      >
                        <RunnerNameCell
                          runner={runner}
                          marketId={market.marketId}
                          displayName={market.marketName}
                          isFancy
                        />
                        <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                          <div className="flex-1 flex flex-col items-end min-w-0">
                            <div className="gap-1 flex justify-end items-center flex-wrap">
                              {runner.lay && runner.lay.length > 0 ? (
                                runner.lay.map((layItem: any, layIdx: number) => (
                                  <button
                                    key={layIdx}
                                    onClick={() =>
                                      handleLayClick(market, runner, toDecimalOdds(layItem.price), String(layItem.line ?? ""), layIdx)
                                    }
                                    className={`${oddsBtnClass} hover:bg-[#60ADDF] transition-colors bg-[#72BBEF] w-20`}
                                  >
                                    <span className={oddsPriceClass}>{layItem.line}</span>
                                    <span className={oddsSizeClass}>{formatAmount(layItem.price)}</span>
                                  </button>
                                ))
                              ) : (
                                <button className={`${oddsBtnClass} bg-[#a8d8f0] w-20`} disabled>
                                  <span className={oddsPriceClass}>-</span>
                                  <span className={oddsSizeClass}>-</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                            <div className="gap-1 flex justify-start items-center flex-wrap min-w-0">
                              {runner.back && runner.back.length > 0 ? (
                                runner.back.map((backItem: any, backIdx: number) => (
                                  <button
                                    key={backIdx}
                                    onClick={() =>
                                      handleBackClick(market, runner, toDecimalOdds(backItem.price), String(backItem.line ?? ""), backIdx)
                                    }
                                    className={`${oddsBtnClass} hover:bg-[#E898A8] transition-colors bg-[#FAA9BA] w-20`}
                                  >
                                    <span className={oddsPriceClass}>{backItem.line}</span>
                                    <span className={oddsSizeClass}>{formatAmount(backItem.price)}</span>
                                  </button>
                                ))
                              ) : (
                                <button className={`${oddsBtnClass} bg-[#f5c9d3] w-20`} disabled>
                                  <span className={oddsPriceClass}>-</span>
                                  <span className={oddsSizeClass}>-</span>
                                </button>
                              )}
                            </div>
                            <div className="hidden sm:flex flex-col text-[9px] text-black/50 dark:text-gray-400 leading-tight text-right shrink-0">
                              <span>Max:{market.marketCondition?.["maxBet"] ?? "-"}</span>
                              <span>MKT:{market.marketCondition?.["potLimit"] ?? market.marketCondition?.["maxProfit"] ?? "-"}</span>
                            </div>
                          </div>
                          {backLayOverlay(market)}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    />
                  )}
                </div>
              )
          )}
        </div>
        )}
      </div>
    </div>
  );
}
