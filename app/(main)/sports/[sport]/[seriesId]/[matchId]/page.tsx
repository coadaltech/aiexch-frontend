"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBetting, useMyBets, useMarketExposure, useFancyMarketExposure, useFancyExposureChart } from "@/hooks/useBetting";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useSeries } from "@/hooks/useSportsApi";
import { useStakeSettings, useLedger, DEFAULT_STAKES } from "@/hooks/useUserQueries";
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
  isRawOdds?: boolean; // true for ADV markets — odds stored as raw, converted only at placement
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
  const isBetfair = data.market?.provider?.toUpperCase() === "BETFAIR";
  const displayOdds =
    data.bettingType === "LINE" && data.run != null
      ? `${data.run} (${Math.round(isBetfair ? numOdds : numOdds * 100)})`
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
  const stakeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => stakeInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [data.marketId, data.runner?.selectionId]);

  const handleStake = (val: string) => {
    if (val === "" || /^\d*$/.test(val)) {
      onStakeChange(val);
    }
  };

  const setStakeClamped = (n: number) => {
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
              ref={stakeInputRef}
              type="number"
              value={stake}
              onChange={(e) => handleStake(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const current = parseFloat(stake) || 0;
                  setStakeClamped(current === 0 ? 500 : current + 500);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setStakeClamped(Math.max(0, (parseFloat(stake) || 0) - 500));
                }
              }}
              placeholder="0"
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
                  setStakeClamped(current === 0 ? 500 : current + 500);
                }}
                className="bg-gray-100 text-gray-600 px-1 py-0.5 text-[10px] hover:bg-gray-200 border border-gray-300 rounded-t disabled:opacity-50"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={isDelaying}
                onClick={() => setStakeClamped(Math.max(0, (parseFloat(stake) || 0) - 500))}
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
              onClick={() => setStakeClamped(btn.value)}
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
// BETFAIR prices are already in decimal — skip conversion entirely.
// WINNING_ODDS are also already in decimal (Betfair-style) — skip conversion and use price-1 for profit.
function toDecimalOdds(price: number, provider?: string, marketType?: string): number {
  if (provider?.toUpperCase() === "BETFAIR") return price;
  if (marketType?.toUpperCase() === "WINNING_ODDS") return price;
  if (price < 100) return price / 100 ;
  if (price >= 100) return price / 100;
  return price;
}

function toDecimalfancyOdds(price: number, provider?: string): number {
  if ((provider?.toUpperCase() === "BETFAIR") && (price < 10 )) return price;
  return price /100 ;
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
  const { data: ledger } = useLedger();
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
                ? [{ line: s.BackPrice1, price: s.BackPrice1, size: s.BackSize1 || 0 }]
                : null,
              lay: s.LayPrice1
                ? [{ line: s.LayPrice1, price: s.LayPrice1, size: s.LaySize1 || 0 }]
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
    if (quickBet.isRawOdds) return String(parseFloat(String(rawPrice)));
    const convertOdds = quickBet.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
    return String(convertOdds(parseFloat(String(rawPrice)), quickBet.market?.provider, quickBet.market?.marketType));
  }, [markets, quickBet]);

  // Preview exposure: calculate what exposure would look like if the current quick bet were placed
  const previewExposure = useMemo(() => {
    if (!quickBet) return null;
    const stakeNum = parseFloat(quickBetStake) || 0;
    if (stakeNum <= 0) return null;

    const { isLay, allRunners, runner, marketId, bettingType } = quickBet;
    const rawOddsNum = parseFloat(liveQuickBetOdds ?? quickBet.odds) || 0;
    if (rawOddsNum <= 0) return null;

    // Only for odds/bookmaker markets (not fancy/session)
    if (bettingType === "LINE") return null;

    // For ADV markets odds are stored raw — convert now for calculation
    const isBetfairMarket = quickBet.market?.provider?.toUpperCase() === "BETFAIR";
    const isWinningOdds = quickBet.market?.marketType?.toUpperCase() === "WINNING_ODDS";
    const oddsNum = quickBet.isRawOdds ? toDecimalOdds(rawOddsNum, quickBet.market?.provider, quickBet.market?.marketType) : rawOddsNum;

    // BETFAIR / WINNING_ODDS: decimal odds (e.g. 1.98), profit = stake * (odds - 1)
    // Non-BETFAIR: profit ratio already (e.g. 0.24), profit = stake * odds
    const profitMultiplier = (isBetfairMarket || isWinningOdds) ? oddsNum - 1 : oddsNum;

    const selectedId = runner.selectionId?.toString() ?? "";
    const existingMarket = marketExposureMap?.get(String(marketId));

    const map = new Map<string, number>();
    for (const r of allRunners) {
      const rId = r.id;
      const existing = existingMarket?.get(rId) ?? 0;

      let betPnl: number;
      if (isLay) {
        betPnl = rId === selectedId ? -(stakeNum * profitMultiplier) : stakeNum;
      } else {
        betPnl = rId === selectedId ? (stakeNum * profitMultiplier) : -stakeNum;
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

  // Format odds price: use enough decimal places to avoid rounding small values
  // e.g. 0.035 must not round to 0.04
  const formatOddsPrice = (price: number | string | null | undefined): string => {
    if (price == null) return "0";
    const num = parseFloat(String(price));
    if (isNaN(num)) return "0";
    const dp = num < 0.1 ? 3 : 2;
    return parseFloat(num.toFixed(dp)).toString();
  };

  // Build allRunners for storage in transaction_details
  // LINE markets: only pass the single clicked runner (binary YES/NO market)
  const buildAllRunners = (market: any, clickedRunner: any, clickedPrice: number): RunnerSummary[] => {
    const convertOdds = market.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
    if (market.bettingType === "LINE") {
      return [{ id: clickedRunner.selectionId?.toString() ?? "", name: clickedRunner.name || "", price: clickedPrice }];
    }
    return (market.runners || []).map((r: any) => {
      const isClicked = r.selectionId === clickedRunner.selectionId;
      const rawPrice = parseFloat(r.back?.[0]?.price || r.lay?.[0]?.price || "0");
      const price = isClicked ? clickedPrice : convertOdds(rawPrice, market.provider, market.marketType);
      return {
        id: r.selectionId?.toString() ?? "",
        name: r.name || "",
        price,
      };
    });
  };

  const handleBackClick = (market: any, runner: any, odds: number | string, run?: string | null, priceIndex: number = 0, isRawOdds = false) => {
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
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
      isRawOdds,
    });
  };

  const handleLayClick = (market: any, runner: any, odds: number | string, run?: string | null, priceIndex: number = 0, isRawOdds = false) => {
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
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
      isRawOdds,
    });
  };

  // Helper: get current live price for a specific runner's back/lay slot
  // isRaw=true: return raw price as-is (for ADV markets that store raw odds)
  const getLivePrice = useCallback(
    (marketId: string, selectionId: string, isLay: boolean, priceIndex: number = 0, isRaw = false): string | null => {
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
      if (isRaw) return String(parseFloat(String(rawPrice)));
      // Convert to decimal odds — fancy/LINE markets use /100 only (no +1)
      const convertOdds = liveMarket.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
      return String(convertOdds(parseFloat(String(rawPrice)), liveMarket.provider, liveMarket.marketType));
    },
    []
  );

  // Core bet placement logic (called directly or after delay completes)
  const executeBetPlacement = useCallback(
    async (qb: QuickBetData, stakeStr: string, oddsValue: string) => {
      const { market, runner, isLay } = qb;

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
      const currentPrice = getLivePrice(market.marketId, selId, isLay, qb.priceIndex, qb.isRawOdds);
      if (currentPrice !== null && currentPrice !== oddsValue) {
        toast.error(`Bet cancelled — price changed from ${oddsValue} to ${currentPrice}`);
        return;
      }

      const marketName = market?.marketName || "";
      const runnerName = runner?.name || "";
      const stakeNum = parseFloat(stakeStr);
      const oddsNum = parseFloat(oddsValue) || 0;

      // Rebuild allRunners at placement time so all runner prices are consistent
      // with the same live snapshot — uses oddsValue for the selected runner.
      const convertOdds = market.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
      // For ADV markets odds are stored raw — convert the selected runner's price too
      const selectedOddsConverted = qb.isRawOdds ? convertOdds(oddsNum, market.provider, market.marketType) : oddsNum;
      const allRunners: RunnerSummary[] = market.bettingType === "LINE"
        ? [{ id: selId, name: runner.name || "", price: oddsNum }]
        : (liveMarket ?? market).runners?.map((r: any) => {
            const isSelected = r.selectionId?.toString() === selId;
            const rawPrice = parseFloat(isLay ? r.lay?.[0]?.price || r.back?.[0]?.price || "0" : r.back?.[0]?.price || r.lay?.[0]?.price || "0");
            return {
              id: r.selectionId?.toString() ?? "",
              name: r.name || "",
              price: isSelected ? selectedOddsConverted : convertOdds(rawPrice, market.provider, market.marketType),
            };
          }) ?? qb.allRunners;
      const marketType = toBettingType(market.bettingType);
      // Use converted odds for potentialWin display (raw odds would give inflated values for ADV markets)
      const potentialWin = (stakeNum * selectedOddsConverted).toFixed(2);

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
          // For ADV markets odds were stored raw — convert before sending to DB
          const dbOddsNum = qb.isRawOdds ? toDecimalOdds(oddsNum, market?.provider, market?.marketType) : oddsNum;
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
            odds: dbOddsNum,
            stake: stakeNum,
            run: qb.run != null ? parseFloat(qb.run) : null,
            type: isLay ? "lay" : "back",
            runners: allRunners,
            provider: market.provider,
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
    const livePriceNow = getLivePrice(market.marketId, runner.selectionId?.toString() ?? "", isLay, quickBet.priceIndex, quickBet.isRawOdds);
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

    // Exposure + limit validation (all markets)
    {
      const finalLimit = parseFloat(ledger?.finalLimit ?? "0");
      const oddsNum = parseFloat(odds || quickBet.odds) || 0;
      const { isLay, allRunners, runner, market } = quickBet;
      const selectedId = runner.selectionId?.toString() ?? "";
      const existingMarket = marketExposureMap?.get(String(quickBet.marketId));

      const isBetfairMkt = market?.provider?.toUpperCase() === "BETFAIR";
      const isWinningOddsMkt = market?.marketType?.toUpperCase() === "WINNING_ODDS";
      const isFancyMkt = quickBet.bettingType === "LINE";

      // For ADV markets odds are stored raw — convert now for calculation
      const calcOddsNum = quickBet.isRawOdds ? toDecimalOdds(oddsNum, market?.provider, market?.marketType) : oddsNum;

      // calcOddsNum is always in converted form:
      //   BETFAIR / WINNING_ODDS → decimal odds (e.g. 1.98), profit = stake * (odds - 1)
      //   non-BETFAIR match/bookmaker → profit ratio (e.g. 0.24), profit = stake * odds
      //   fancy (any provider) → lay risk ratio (e.g. 1.35), lay risk = stake * odds
      const profitMultiplier = isFancyMkt
        ? calcOddsNum
        : (isBetfairMkt || isWinningOddsMkt) ? calcOddsNum - 1 : calcOddsNum;

      // Compute P&L of THIS bet alone for every runner (not including existing exposure)
      const thisBetPnls: number[] = allRunners.map((r) =>
        isLay
          ? r.id === selectedId ? -(stakeNum * profitMultiplier) : stakeNum
          : r.id === selectedId ? (stakeNum * profitMultiplier) : -stakeNum
      );

      const worstBetLoss = Math.min(...thisBetPnls);

      // Check if this would normally be rejected
      const wouldReject =
        (worstBetLoss < 0 && Math.abs(worstBetLoss) > finalLimit) ||
        (worstBetLoss >= 0 && stakeNum > finalLimit);

      if (wouldReject) {
        // Exposure-reducing exception: allow any bet (back or lay) that improves
        // (reduces) the overall worst-case loss compared to current exposure.
        // This lets users hedge their position even after hitting their limit.
        if (existingMarket) {
          const existingWorstLoss = Math.min(
            ...allRunners.map((r) => existingMarket.get(r.id) ?? 0)
          );
          const projectedWorstLoss = Math.min(
            ...allRunners.map((r, i) => (existingMarket.get(r.id) ?? 0) + thisBetPnls[i])
          );
          const projectedNetLoss = projectedWorstLoss < 0 ? Math.abs(projectedWorstLoss) : 0;
          const reducesExposure = projectedWorstLoss > existingWorstLoss;
          // Original limit = finalLimit + current exposure (what the user started with)
          const currentExposure = existingWorstLoss < 0 ? Math.abs(existingWorstLoss) : 0;
          const originalLimit = finalLimit + currentExposure;
          const withinLimit = projectedNetLoss <= originalLimit;
          if (reducesExposure || withinLimit) {
            // Bet reduces exposure or net exposure is within limit — allow it through
          } else {
            toast.error("Bet rejected — potential loss exceeds your available limit.");
            return;
          }
        } else {
          toast.error(
            worstBetLoss >= 0
              ? "Bet rejected — stake exceeds your available limit."
              : "Bet rejected — potential loss exceeds your available limit."
          );
          return;
        }
      }
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

  // Detect the best rendering layout for a non-fancy market
  const detectMarketLayout = (market: any): 'standard' | 'team-binary' | 'binary' | 'odd-even' | 'lottery' | 'multi-grid' => {
    const runners: any[] = market.runners || [];
    const names = runners.map((r: any) => (r.name || '').toUpperCase().trim());
    // If any runner has meaningful lay odds → standard back/lay grid
    const hasLay = runners.some((r: any) => {
      const lay = r.lay || [];
      return lay.length > 0 && parseFloat(String(lay[0]?.price)) > 0;
    });
    if (hasLay) return 'standard';
    // Lottery: 8–12 runners whose names are single digits 0-9
    if (runners.length >= 8 && names.every((n) => /^\d$/.test(n))) return 'lottery';
    // ODD/EVEN: explicitly named ODD and EVEN
    if (names.includes('ODD') && names.includes('EVEN')) return 'odd-even';
    // Binary: ONLY when runners are explicitly named YES and NO
    if (names.includes('YES') && names.includes('NO')) return 'binary';
    // 2-runner markets with team names (no lay) → same look as match odds
    if (runners.length === 2) return 'team-binary';
    // 3+ runners, no lay → multi-grid
    return 'multi-grid';
  };

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

    let prevPnl: number | null = null;

    if (isFancy) {
      // Fancy markets: per-market worst-case P&L (not per-runner)
      // Treat 0 as null — API sometimes returns 0 for markets with no real exposure
      const rawSettled = fancyExposureMap?.get(String(marketId));
      const settled = rawSettled != null && rawSettled !== 0 ? rawSettled : null;
      // Show preview if quickBet is active for this fancy market
      if (quickBet && String(quickBet.marketId) === String(marketId) && quickBet.bettingType === "LINE") {
        const stakeNum = parseFloat(quickBetStake) || 0;
        const oddsNum = parseFloat(liveQuickBetOdds ?? quickBet.odds) || 0;
        if (stakeNum > 0 && oddsNum > 0) {
          // oddsNum is already converted by toDecimalfancyOdds (/100) for all providers
          const layRisk = stakeNum * oddsNum;
          const betPnl = quickBet.isLay ? -layRisk : -stakeNum;
          prevPnl = settled;
          pnl = (settled ?? 0) + betPnl;
        } else {
          pnl = settled;
        }
      } else {
        pnl = settled;
      }
    } else if (previewExposure && previewExposure.marketId === String(marketId)) {
      // Show preview exposure when quick bet panel is active
      const marketRunners = marketExposureMap?.get(String(marketId));
      prevPnl = marketRunners?.get(runnerId) ?? null;
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

    const fmtPnl = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

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

        {pnl !== null && prevPnl !== null ? (
          // Second bet: previous => overall  diff: betPnl
          (() => {
            const diff = pnl - prevPnl;
            return (
              <span className="text-[10px] sm:text-xs font-bold leading-tight flex items-center gap-1 flex-wrap">
                <span className={prevPnl >= 0 ? "text-live-text" : "text-danger"}>{fmtPnl(prevPnl)}</span>
                <span className="text-gray-400">=&gt;</span>
                <span className={pnl >= 0 ? "text-live-text" : "text-danger"}>{fmtPnl(pnl)}</span>
                <span className="text-gray-400">=&gt;</span>
                <span className="text-gray-500 font-normal">diff:</span>
                <span className={diff >= 0 ? "text-live-text" : "text-danger"}>{fmtPnl(diff)}</span>
              </span>
            );
          })()
        ) : pnl !== null ? (
          <span
            className={`text-[10px] sm:text-xs font-bold leading-tight ${
              pnl >= 0 ? "text-live-text" : "text-danger"
            }`}
          >
            {fmtPnl(pnl)}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="px-2 sm:px-3 py-2 w-full max-w-full min-w-0 min-h-full">
      {/* Match header */}
      {(matchInfo || series || matchFromSeries) && (() => {
        const matchOddsMarket = visibleMarkets.find((m: any) => m.marketType === "MATCH_ODDS" || m.marketType === "WINNING_ODDS");
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
        {/* ── Standard markets (match odds, bookmaker, team-binary) ── */}
        {visibleMarkets
          .filter((market: any) => {
            if (market.bettingType === "LINE") return false;
            const l = detectMarketLayout(market);
            return l === "standard" || l === "team-binary";
          })
          .map((market: any) => {
            const layout = detectMarketLayout(market);
            const isMarketSusp = market.status === "SUSPENDED" || !!market.sportingEvent;
            const minBet = market.marketCondition?.minBet ?? "-";
            const maxBet = market.marketCondition?.maxBet ?? "-";

            // Shared suspended cell for ADV layouts
            const SuspendedCell = ({ className = "" }: { className?: string }) => (
              <div
                className={`relative overflow-hidden rounded flex items-center justify-center ${className}`}
                style={{ background: "repeating-linear-gradient(45deg,#374151 0,#374151 4px,#4B5563 4px,#4B5563 8px)" }}
              >
                <span className="text-red-400 font-bold text-xs relative z-10">Suspended</span>
              </div>
            );

            // ── STANDARD layout: back/lay 3-level grid ──
            if (layout === "standard") {
              return (
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
                                      toDecimalOdds(item.price, market.provider, market.marketType),
                                      null,
                                      2 - posIdx
                                    )}
                                    className={`${oddsBtnClass} transition-all w-24 ${posIdx === 2 ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm" : "bg-white hover:bg-back/30 border border-back/50"}`}
                                  >
                                    <span className={oddsPriceClass}>{formatOddsPrice(item.price)}</span>
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
                                          toDecimalOdds(layItem.price, market.provider, market.marketType),
                                          null,
                                          layIdx
                                        )}
                                        className={`${oddsBtnClass} transition-all w-24 ${layIdx === 0 ? "bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay shadow-sm" : "bg-white hover:bg-lay/30 border border-lay/50"}`}
                                      >
                                        <span className={oddsPriceClass}>{layItem.price ? formatOddsPrice(layItem.price) : "0"}</span>
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
            ); // end standard layout
            } // end if layout === "standard"

            // ── TEAM-BINARY layout: 2 runners with team names, no lay → same as match odds ──
            if (layout === "team-binary") {
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] items-center">
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight">{market.marketName}</h3>
                      <p className="text-white/70 text-xs sm:text-sm truncate leading-tight">Min: {minBet} / Max: {maxBet}</p>
                    </div>
                    <div className="justify-self-end font-bold uppercase bg-back text-black text-xs sm:text-sm py-0.5 px-1.5 rounded">Back</div>
                    <div className="font-bold uppercase bg-lay text-black text-xs sm:text-sm py-0.5 px-1.5 rounded w-fit">Lay</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {market.runners.map((runner: any) => {
                      const isRunnerSuspended = runner.status === "SUSPENDED" || runner.status === "REMOVED" || isMarketSusp;
                      return (
                        <div key={runner.selectionId} className="px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white hover:bg-gray-50/80 transition-colors">
                          <RunnerNameCell runner={runner} marketId={market.marketId} />
                          <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                            <div className="flex-1 flex flex-col items-end min-w-0">
                              <div className="gap-1 flex justify-end items-center flex-wrap">
                                {(() => {
                                  if (isRunnerSuspended) return Array(3).fill(null).map((_, i) => (
                                    <button key={i} className={`${oddsBtnClass} bg-back-disabled w-24`} disabled><span className={oddsPriceClass}>0</span><span className={oddsSizeClass}>0</span></button>
                                  ));
                                  const backItems = runner.back || [];
                                  const positions = Array(3).fill(null);
                                  backItems.forEach((item: any, idx: number) => { if (idx < 3) positions[2 - idx] = item; });
                                  return positions.map((item, posIdx) => item ? (
                                    <button key={posIdx} onClick={() => handleBackClick(market, runner, toDecimalOdds(item.price, market.provider, market.marketType), null, 2 - posIdx)}
                                      className={`${oddsBtnClass} transition-all w-24 ${posIdx === 2 ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm" : "bg-white hover:bg-back/30 border border-back/50"}`}>
                                      <span className={oddsPriceClass}>{formatOddsPrice(item.price)}</span><span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                                    </button>
                                  ) : (
                                    <button key={posIdx} className={`${oddsBtnClass} bg-back-disabled w-24`} disabled><span className={oddsPriceClass}>-</span><span className={oddsSizeClass}>-</span></button>
                                  ));
                                })()}
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col items-start min-w-0">
                              <div className="gap-1 flex justify-start items-center flex-wrap">
                                {Array(3).fill(null).map((_, i) => (
                                  <button key={i} className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled><span className={oddsPriceClass}>-</span><span className={oddsSizeClass}>-</span></button>
                                ))}
                              </div>
                            </div>
                            {backLayOverlay(market)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }

            // Shared ADV market header
            const advHeader = (
              <div className="px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] flex items-center justify-between gap-2">
                <span className="font-bold text-white text-sm sm:text-base truncate">{market.marketName}</span>
                <span className="text-white/70 text-xs sm:text-sm whitespace-nowrap shrink-0">
                  Min: {minBet} | Max: {maxBet}
                </span>
              </div>
            );

            // ── BINARY layout (YES/NO or any 2-runner no-lay market) ──
            if (layout === "binary") {
              const runners: any[] = market.runners || [];
              const yesRunner = runners.find((r: any) => r.name?.toUpperCase() === "YES") ?? runners[0];
              const noRunner = runners.find((r: any) => r.name?.toUpperCase() === "NO") ?? runners[1];
              const renderBinaryCell = (runner: any, side: "back" | "lay") => {
                if (!runner) return null;
                const isRunnerSusp = isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
                const backItem = runner.back?.[0];
                const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                if (isRunnerSusp) return <SuspendedCell className="min-h-[2.75rem]" />;
                return (
                  <button
                    onClick={() => rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)}
                    className={`min-h-[2.75rem]  flex flex-col items-center justify-center font-bold text-sm text-gray-900 transition-all ${side === "back" ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back" : "bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay"}`}
                  >
                    <span className="text-base font-bold">{rawPrice != null ? formatOddsPrice(rawPrice) : "-"}</span>
                    {backItem?.size && <span className="text-[11px]">{formatAmount(parseFloat(String(backItem.size)))}</span>}
                  </button>
                );
              };
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", alignItems: "stretch" }} className="bg-white">
                    <div className="px-3 flex items-center min-h-[2.75rem]">
                      {yesRunner && <RunnerNameCell runner={yesRunner} marketId={market.marketId} />}
                    </div>
                    {renderBinaryCell(yesRunner, "back")}
                    <div className="px-3 flex items-center min-h-[2.75rem]">
                      {noRunner && <RunnerNameCell runner={noRunner} marketId={market.marketId} />}
                    </div>
                    {renderBinaryCell(noRunner, "lay")}
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }

            // ── ODD/EVEN layout ──
            // Layout: [ODD label] [wide button] [EVEN label] [wide button]
            if (layout === "odd-even") {
              const runners: any[] = market.runners || [];
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div
                    className="bg-white items-stretch"
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
                  >
                    {runners.flatMap((runner: any) => {
                      const isRunnerSusp = isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
                      const backItem = runner.back?.[0];
                      const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                      return [
                        <span key={`lbl-${runner.selectionId}`} className="text-gray-800 font-bold text-sm px-3 flex items-center">
                          {runner.name}
                        </span>,
                        isRunnerSusp
                          ? <SuspendedCell key={`susp-${runner.selectionId}`} className="min-h-[2.75rem]" />
                          : <button key={`btn-${runner.selectionId}`}
                              onClick={() => rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)}
                              className="min-h-[2.75rem] flex items-center justify-center font-bold text-base text-gray-900 bg-back hover:bg-back-hover transition-all">
                              {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
                            </button>,
                      ];
                    })}
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }

            // ── LOTTERY layout (0-9 digit circle buttons) ──
            if (layout === "lottery") {
              const runners: any[] = market.runners || [];
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div className="bg-white px-2 sm:px-3 py-3">
                    {isMarketSusp
                      ? <SuspendedCell className="w-full min-h-[2.5rem]" />
                      : (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {runners.map((runner: any) => {
                            const backItem = runner.back?.[0];
                            const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                            const isRunnerSusp = runner.status === "SUSPENDED" || runner.status === "REMOVED";
                            return (
                              <button key={runner.selectionId}
                                disabled={isRunnerSusp || rawPrice == null}
                                onClick={() => rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)}
                                className="w-9 h-9 rounded-full bg-[#142669] hover:bg-[#142669] text-white font-bold text-sm flex items-center justify-center shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {runner.name}
                              </button>
                            );
                          })}
                        </div>
                      )
                    }
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }

            // ── MULTI-GRID layout (Man of Match, Wicket Method, Most Fours, etc.) ──
            // 3 [name | odds] pairs per row, each pair has runner name left and wide odds box right
            {
              const runners: any[] = market.runners || [];
              const colsPerRow = Math.min(runners.length, 3);
              const rows: any[][] = [];
              for (let i = 0; i < runners.length; i += colsPerRow) rows.push(runners.slice(i, i + colsPerRow));
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div className="bg-white divide-y divide-gray-100">
                    {rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid divide-x divide-gray-100" style={{ gridTemplateColumns: `repeat(${colsPerRow}, 1fr)` }}>
                        {row.map((runner: any) => {
                          const isRunnerSusp = isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
                          const backItem = runner.back?.[0];
                          const odds = backItem ? toDecimalOdds(parseFloat(String(backItem.price)), market.provider, market.marketType) : null;
                          return (
                            <div key={runner.selectionId} className="flex items-stretch">
                              <div className="flex-1 px-2 py-1.5 min-w-0">
                                <RunnerNameCell runner={runner} marketId={market.marketId} />
                              </div>
                              {isRunnerSusp
                                ? <SuspendedCell className="w-16 min-h-[2.25rem] shrink-0" />
                                : <button onClick={() => odds != null && handleBackClick(market, runner, odds, null, 0)}
                                    className="w-16 min-h-[2.25rem] flex items-center justify-center font-bold text-sm text-gray-900 bg-back hover:bg-back-hover transition-all shrink-0">
                                    {odds != null ? formatOddsPrice(odds) : "-"}
                                  </button>
                              }
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }
          })}

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
                                    <button key={layIdx} onClick={() => handleLayClick(market, runner, toDecimalfancyOdds(layItem.price, market.provider), String(layItem.line ?? ""), layIdx)} className={`${oddsBtnClass} bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay shadow-sm transition-all w-24`}>
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
                                    <button key={backIdx} onClick={() => handleBackClick(market, runner, toDecimalfancyOdds(backItem.price, market.provider), String(backItem.line ?? ""), backIdx)} className={`${oddsBtnClass} transition-all w-24 ${backIdx === 0 ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm" : "bg-white hover:bg-back/30 border border-back/50"}`}>
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

        {/* ── ADV markets (binary, odd-even, lottery, multi-grid) ── */}
        {visibleMarkets
          .filter((market: any) => {
            if (market.bettingType === "LINE") return false;
            const l = detectMarketLayout(market);
            return l !== "standard" && l !== "team-binary";
          })
          .map((market: any) => {
            const layout = detectMarketLayout(market);
            const isMarketSusp = market.status === "SUSPENDED" || !!market.sportingEvent;
            const minBet = market.marketCondition?.minBet ?? "-";
            const maxBet = market.marketCondition?.maxBet ?? "-";

            const SuspendedCell = ({ className = "" }: { className?: string }) => (
              <div
                className={`relative overflow-hidden rounded flex items-center justify-center ${className}`}
                style={{ background: "repeating-linear-gradient(45deg,#374151 0,#374151 4px,#4B5563 4px,#4B5563 8px)" }}
              >
                <span className="text-red-400 font-bold text-xs relative z-10">Suspended</span>
              </div>
            );

            const advHeader = (
              <div className="px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] flex items-center justify-between gap-2">
                <span className="font-bold text-white text-sm sm:text-base truncate">{market.marketName}</span>
                <span className="text-white/70 text-xs sm:text-sm whitespace-nowrap shrink-0">
                  Min: {minBet} | Max: {maxBet}
                </span>
              </div>
            );

            if (layout === "binary") {
              const runners: any[] = market.runners || [];
              const yesRunner = runners.find((r: any) => r.name?.toUpperCase() === "YES") ?? runners[0];
              const noRunner = runners.find((r: any) => r.name?.toUpperCase() === "NO") ?? runners[1];
              const renderBinaryCell = (runner: any, side: "back" | "lay") => {
                if (!runner) return null;
                const isRunnerSusp = isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
                const backItem = runner.back?.[0];
                const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                if (isRunnerSusp) return <SuspendedCell className="min-h-[2.75rem]" />;
                return (
                  <button
                    onClick={() => rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)}
                    className={`min-h-[2.75rem] flex flex-col items-center justify-center font-bold text-sm text-gray-900 transition-all ${side === "back" ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back" : "bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay"}`}
                  >
                    <span className="text-base font-bold">{rawPrice != null ? formatOddsPrice(rawPrice) : "-"}</span>
                    {backItem?.size && <span className="text-[11px]">{formatAmount(parseFloat(String(backItem.size)))}</span>}
                  </button>
                );
              };
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", alignItems: "stretch" }} className="bg-white">
                    <div className="px-3 flex items-center min-h-[2.75rem]">
                      {yesRunner && <RunnerNameCell runner={yesRunner} marketId={market.marketId} />}
                    </div>
                    {renderBinaryCell(yesRunner, "back")}
                    <div className="px-3 flex items-center min-h-[2.75rem]">
                      {noRunner && <RunnerNameCell runner={noRunner} marketId={market.marketId} />}
                    </div>
                    {renderBinaryCell(noRunner, "lay")}
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }

            if (layout === "odd-even") {
              const runners: any[] = market.runners || [];
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div className="bg-white items-stretch" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                    {runners.flatMap((runner: any) => {
                      const isRunnerSusp = isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
                      const backItem = runner.back?.[0];
                      const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                      return [
                        <div key={`lbl-${runner.selectionId}`} className="px-3 flex items-center min-h-[2.75rem]">
                          <RunnerNameCell runner={runner} marketId={market.marketId} />
                        </div>,
                        isRunnerSusp
                          ? <SuspendedCell key={`susp-${runner.selectionId}`} className="min-h-[2.75rem]" />
                          : <button key={`btn-${runner.selectionId}`}
                              onClick={() => rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)}
                              className="min-h-[2.75rem] flex items-center justify-center font-bold text-base text-gray-900 bg-back hover:bg-back-hover transition-all">
                              {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
                            </button>,
                      ];
                    })}
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }

            if (layout === "lottery") {
              const runners: any[] = market.runners || [];
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div className="bg-white px-2 sm:px-3 py-3">
                    {isMarketSusp
                      ? <SuspendedCell className="w-full min-h-[2.5rem]" />
                      : (
                        <div className="flex items-end justify-end gap-2 flex-wrap">
                          {runners.map((runner: any) => {
                            const backItem = runner.back?.[0];
                            const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                            const isRunnerSusp = runner.status === "SUSPENDED" || runner.status === "REMOVED";
                            const rId = runner.selectionId?.toString() ?? "";
                            const runnerPnl: number | null = (() => {
                              if (previewExposure && previewExposure.marketId === String(market.marketId)) {
                                return previewExposure.runners.get(rId) ?? null;
                              }
                              return marketExposureMap?.get(String(market.marketId))?.get(rId) ?? null;
                            })();
                            return (
                              <div key={runner.selectionId} className="flex flex-col items-center gap-0.5">
                                <button
                                  disabled={isRunnerSusp || rawPrice == null}
                                  onClick={() => rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)}
                                  className="w-9 h-9 rounded-full bg-[#142669] hover:bg-[#142669] text-white font-bold text-sm flex items-center justify-center shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                  {runner.name}
                                </button>
                                {runnerPnl !== null && (
                                  <span className={`text-[9px] font-bold leading-none ${runnerPnl >= 0 ? "text-live-text" : "text-danger"}`}>
                                    {runnerPnl >= 0 ? "+" : ""}{runnerPnl.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }

            // multi-grid (fallthrough)
            {
              const runners: any[] = market.runners || [];
              const colsPerRow = Math.min(runners.length, 3);
              const rows: any[][] = [];
              for (let i = 0; i < runners.length; i += colsPerRow) rows.push(runners.slice(i, i + colsPerRow));
              return (
                <div key={market.marketId} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {advHeader}
                  <div className="bg-white divide-y divide-gray-100">
                    {rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid divide-x divide-gray-100" style={{ gridTemplateColumns: `repeat(${colsPerRow}, 1fr)` }}>
                        {row.map((runner: any) => {
                          const isRunnerSusp = isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
                          const backItem = runner.back?.[0];
                          const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                          return (
                            <div key={runner.selectionId} className="flex items-stretch">
                              <div className="flex-1 px-2 py-1.5 min-w-0">
                                <RunnerNameCell runner={runner} marketId={market.marketId} />
                              </div>
                              {isRunnerSusp
                                ? <SuspendedCell className="w-16 min-h-[2.25rem] shrink-0" />
                                : <button onClick={() => rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)}
                                    className="w-16 min-h-[2.25rem] flex items-center justify-center font-bold text-sm text-gray-900 bg-back hover:bg-back-hover transition-all shrink-0">
                                    {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
                                  </button>
                              }
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {quickBet && quickBet.marketId === market.marketId && (
                    <QuickBetPanel data={quickBet} stake={quickBetStake} onStakeChange={setQuickBetStake}
                      onClose={handleQuickBetClose} onPlaceBet={handleQuickBetPlace} isLoading={isPlacing}
                      betDelayRemaining={betDelayRemaining} onCancelDelay={cancelBetDelay}
                      stakeButtons={customStakes} currentOdds={liveQuickBetOdds} />
                  )}
                </div>
              );
            }
          })}
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
