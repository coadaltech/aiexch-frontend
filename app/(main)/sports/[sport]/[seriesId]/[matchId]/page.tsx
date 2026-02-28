"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBetting, useMyBets } from "@/hooks/useBetting";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";
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
  isLay: boolean;
};

function QuickBetPanel({
  data,
  stake,
  onStakeChange,
  onClose,
  onPlaceBet,
  isLoading,
}: {
  data: QuickBetData;
  stake: string;
  onStakeChange: (val: string) => void;
  onClose: () => void;
  onPlaceBet: (stake: string, odds: string) => void;
  isLoading?: boolean;
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

  const handleStake = (val: string) => {
    const n = parseFloat(val) || 0;
    onStakeChange(n > 0 ? String(n) : "");
  };

  const canPlace = !!stake && stakeNum > 0 && !stakeError && !isLoading;

  return (
    <div className="px-2 sm:px-3 py-3 border-t border-teal-600 bg-gradient-to-b from-sky-200/90 via-sky-100/80 to-white dark:from-sky-900/40 dark:via-sky-800/30 dark:to-gray-900">
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
              className={`w-14 sm:w-16 bg-white dark:bg-gray-800 text-black dark:text-white text-[10px] sm:text-xs py-1.5 px-2 text-center border rounded focus:ring-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                stakeError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              }`}
            />
            <div className="flex flex-col ml-0.5">
              <button
                type="button"
                onClick={() => handleStake(String((parseFloat(stake) || 0) + 1))}
                className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1 py-0.5 text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-t"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleStake(String(Math.max(0, (parseFloat(stake) || 0) - 1)))}
                className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1 py-0.5 text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b"
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
              onClick={() => onStakeChange(String(amount))}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors"
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
            ) : (
              "Place Bet"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
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
function toMarketType(bettingType: string): string {
  switch (bettingType?.toUpperCase()) {
    case "BOOKMAKER": return "bookmakers";
    case "LINE": return "sessions";
    default: return "odds";
  }
}

// Calculate net P&L for runner R if it wins, across all bets in a market
function calcExistingPnl(bets: any[], runnerId: string): number {
  return bets.reduce((sum: number, bet: any) => {
    const betType = bet.betType || bet.type;
    const k = typeof bet.stake === "number" ? bet.stake : parseFloat(bet.stake);
    const o = typeof bet.odds === "number" ? bet.odds : parseFloat(bet.odds);
    if (!k || !o) return sum;
    // LINE (sessions) bets: show -(stake) as potential loss
    if (bet.marketType === "sessions") {
      return sum + (-k);
    }
    const isSelected = bet.selectionId?.toString() === runnerId;
    if (betType === "back") {
      return sum + (isSelected ? k * (o - 1) : -k);
    } else {
      return sum + (isSelected ? -(k * (o - 1)) : k);
    }
  }, 0);
}


// Calculate profit for a runner given the active quickBet + stake
function calcRunnerProfit(
  runnerId: string,
  quickBet: QuickBetData,
  stake: string
): number | null {
  const stakeNum = parseFloat(stake) || 0;
  const oddsNum = parseFloat(quickBet.odds) || 0;
  if (!stakeNum || !oddsNum) return null;

  // LINE markets: show -(stake) as potential loss only
  if (quickBet.bettingType === "LINE") {
    return -stakeNum;
  }

  const isSelected = runnerId === quickBet.runner.selectionId?.toString();

  if (quickBet.isLay) {
    // Lay on selected runner:
    // selected wins → user loses stake*(odds-1)
    // selected loses (other wins) → user wins stake
    return isSelected ? -(stakeNum * (oddsNum - 1)) : stakeNum;
  } else {
    // Back on selected runner:
    // selected wins → profit = stake*(odds-1)
    // other wins → loss = -stake
    return isSelected ? stakeNum * (oddsNum - 1) : -stakeNum;
  }
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
  const queryClient = useQueryClient();
  const { user, updateDemoBalance } = useAuth();
  const { placeBetAsync } = useBetting();
  const { data: myBetsData } = useMyBets("matched");

  // Map of marketId → active bets for this match (used for P&L display)
  const activeBetsByMarket = useMemo(() => {
    const bets: any[] = myBetsData?.data ?? [];
    const map = new Map<string, any[]>();
    for (const bet of bets) {
      if (bet.matchId !== matchId) continue;
      if (!map.has(bet.marketId)) map.set(bet.marketId, []);
      map.get(bet.marketId)!.push(bet);
    }
    return map;
  }, [myBetsData, matchId]);

  const config = getSportConfig(sport);
  const { seriesData } = UseSportsSeries(config?.eventTypeId ?? null);
  const { status, isConnected, markets } = useMarketWebSocket(matchId);
  markets.map((m)=>{
    if(m.bettingType == "LINE"){
      console.log(m)
    }
  })

  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [pageStatus, setPageStatus] = useState<
    "connecting" | "connected" | "no-data" | "error" | "success"
  >("connecting");

  const series = useMemo(
    () => seriesData.find((s: { id: string }) => s.id === seriesId),
    [seriesData, seriesId]
  );
  const matchFromSeries = useMemo(
    () => series?.matches?.find((m: { id: string }) => m.id === matchId),
    [series, matchId]
  );

  useEffect(() => {
    if (status === "error") {
      setPageStatus("error");
    } else if (status === "disconnected" || status === "connecting") {
      setPageStatus("connecting");
    } else if (isConnected && markets.length > 0) {
      setMatchInfo({
        eventName: markets[0]?.eventName || "Match",
        sport: markets[0]?.sport || "Cricket",
        startTime: markets[0]?.startTime,
      });
      setPageStatus("success");
    } else if (isConnected && markets.length === 0) {
      const timeout = setTimeout(() => {
        if (markets.length === 0) setPageStatus("no-data");
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [status, isConnected, markets]);

  const handleQuickBetClose = () => {
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

  const handleBackClick = (market: any, runner: any, odds: number | string) => {
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
    setQuickBetStake("");
    setQuickBet({
      marketId: market.marketId,
      bettingType: market.bettingType,
      market,
      runner,
      allRunners: buildAllRunners(market, runner, o),
      eventName: matchInfo?.eventName || "Match",
      odds: String(odds),
      isLay: false,
    });
  };

  const handleLayClick = (market: any, runner: any, odds: number | string) => {
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
    setQuickBetStake("");
    setQuickBet({
      marketId: market.marketId,
      bettingType: market.bettingType,
      market,
      runner,
      allRunners: buildAllRunners(market, runner, o),
      eventName: matchInfo?.eventName || "Match",
      odds: String(odds),
      isLay: true,
    });
  };

  const handleQuickBetPlace = async (stake: string, odds: string) => {
    if (!quickBet || !stake || parseFloat(stake) <= 0) return;
    const { market, runner, allRunners, isLay } = quickBet;
    const oddsValue = odds || quickBet.odds;
    const marketName = market?.marketName || "";
    const runnerName = runner?.name || "";
    const stakeNum = parseFloat(stake);
    const oddsNum = parseFloat(oddsValue) || 0;
    const marketType = toMarketType(market.bettingType);
    const isLineBet = market.bettingType === "LINE";

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

    // For LINE: potentialWin = stake + stake*(rate/100), for others: stake*odds
    const potentialWin = isLineBet
      ? (stakeNum + stakeNum * (oddsNum / 100)).toFixed(2)
      : (stakeNum * oddsNum).toFixed(2);

    const betPayload = {
      id: `slip-${Date.now()}-${market?.marketId ?? ""}-${runner?.selectionId ?? ""}`,
      teams: `${quickBet.eventName} - ${runnerName}`,
      market: isLay ? `LAY ${marketName}` : marketName,
      odds: oddsValue,
      stake,
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

    setIsPlacing(true);
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
        createdAt: new Date().toISOString(),
        matchId,
        marketId: market.marketId,
        selectionId: runner.selectionId?.toString(),
      };
      addDemoBets([demoBet]);
      const userBalance = parseFloat(user?.balance || "0");
      updateDemoBalance((userBalance - stakeNum).toFixed(2));
      queryClient.invalidateQueries({ queryKey: ["my-bets"] });
      toast.success("Bet placed. Balance updated.");
      setIsPlacing(false);
      handleQuickBetClose();
    } else {
      try {
        await placeBetAsync({
          matchId,
          marketId: market.marketId,
          eventTypeId: config?.eventTypeId?.toString() || "4",
          marketType,
          selectionId: runner.selectionId?.toString() ?? "",
          selectionName: runnerName,
          marketName,
          odds: oddsNum,
          stake: stakeNum,
          type: isLay ? "lay" : "back",
          runners: allRunners,
        });
        toast.success("Bet placed.");
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          (err instanceof Error ? err.message : "Failed to place bet");
        toast.error(message);
      } finally {
        setIsPlacing(false);
        handleQuickBetClose();
      }
    }
  };

  if (pageStatus === "error") {
    return (
      <div className="rounded-lg bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-400 text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Failed</h2>
          <p className="text-gray-400 mb-4">Unable to connect to server</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (pageStatus === "connecting" || pageStatus === "connected") {
    return (
      <div className="mt-30 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (pageStatus === "no-data") {
    return (
      <div className="px-2 py-1 h-full">
        <div className="h-full rounded-lg bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-gray-400 text-3xl">📊</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Open Markets</h2>
            <p className="text-gray-400 mb-2">This match has no active markets</p>
            <p className="text-sm text-gray-600">Markets will appear when available</p>
            {matchInfo && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400">Match ID: {matchId}</div>
                {matchInfo.startTime && (
                  <div className="text-sm text-gray-400 mt-1">
                    Start: {formatDate(matchInfo.startTime)}
                  </div>
                )}
              </div>
            )}
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
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[70%] min-w-[4rem] flex items-center justify-center pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.12) 6px, rgba(0,0,0,0.12) 12px)",
          backgroundColor: "rgba(0,0,0,0.35)",
          cursor: "not-allowed",
        }}
      >
        <span className="text-red-500 font-bold text-sm sm:text-base drop-shadow-sm" style={{ pointerEvents: "auto" }}>
          {label}
        </span>
      </div>
    );
  };

  const oddsBtnClass =
    "min-w-[28px] sm:min-w-[34px] md:min-w-[40px] px-1 py-1 flex flex-col items-center justify-center border-none rounded cursor-pointer leading-tight";
  const oddsPriceClass = "text-white font-bold text-[10px] sm:text-xs";
  const oddsSizeClass = "text-gray-400 font-medium text-[8px] sm:text-[9px]";

  // Runner name cell: shows name + cumulative P&L (existing bets + current quickBet preview)
  const RunnerNameCell = ({
    runner,
    marketId,
    bets,
    displayName,
  }: {
    runner: any;
    marketId: string;
    bets: any[];
    displayName?: string;
  }) => {
    const runnerId = runner.selectionId?.toString() ?? "";
    const isActiveMarket = quickBet?.marketId === marketId;
    const hasExistingBets = bets.length > 0;
    const hasActiveQuickBet =
      isActiveMarket && !!quickBetStake && parseFloat(quickBetStake) > 0;

    const existingPnl = calcExistingPnl(bets, runnerId);
    const quickBetPnl = isActiveMarket
      ? calcRunnerProfit(runnerId, quickBet!, quickBetStake)
      : null;

    const showPnl = hasExistingBets || hasActiveQuickBet;
    const totalPnl = showPnl ? existingPnl + (quickBetPnl ?? 0) : null;

    return (
      <div className="min-w-0 pr-1 flex flex-col gap-0.5">
        <span className="text-white font-semibold text-[11px] sm:text-xs truncate block leading-tight">
          {displayName ?? runner.name}
        </span>
        {totalPnl !== null && (
          <span
            className={`text-[9px] sm:text-[10px] font-semibold leading-tight ${
              totalPnl >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {totalPnl.toFixed(2)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-1 sm:px-2 py-1 w-full max-w-full min-w-0">
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

      <div className="bg-gray-900 space-y-1">
        {markets.map(
          (market) =>
            (market.bettingType == "ODDS" || market.bettingType == "BOOKMAKER") && (
              <div
                key={market.marketId}
                className="bg-gray-800 border border-gray-700 rounded overflow-hidden"
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
                  <div className="justify-self-end font-semibold uppercase bg-green-900 text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded">
                    Back
                  </div>
                  <div className="font-semibold uppercase bg-[#39111A] text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded w-fit">
                    Lay
                  </div>
                </div>
                <div className="divide-y divide-gray-700">
                  {market.runners.map((runner: any) => (
                    <div
                      key={runner.selectionId}
                      className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0"
                    >
                      <RunnerNameCell
                        runner={runner}
                        marketId={market.marketId}
                        bets={activeBetsByMarket.get(market.marketId) ?? []}
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
                                    onClick={() => handleBackClick(market, runner, item.price)}
                                    className={`${oddsBtnClass} hover:bg-green-900 transition-colors bg-green-900/70 w-20`}
                                  >
                                    <span className={oddsPriceClass}>{item.price}</span>
                                    <span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                                  </button>
                                ) : (
                                  <button key={`empty-back-${posIdx}`} className={`${oddsBtnClass} bg-green-900/70 w-20`} disabled>
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
                                    onClick={() => handleLayClick(market, runner, layItem.price)}
                                    className={`${oddsBtnClass} hover:bg-[#39111A] transition-colors bg-[#39111A]/70 w-20`}
                                  >
                                    <span className={oddsPriceClass}>{layItem.price ? layItem.price : "0"}</span>
                                    <span className={oddsSizeClass}>{formatAmount(layItem.size)}</span>
                                  </button>
                                ))
                              : null}
                            {Array.from({ length: Math.max(0, 3 - (runner.lay?.length || 0)) }).map((_, emptyIdx) => (
                              <button key={`empty-lay-${emptyIdx}`} className={`${oddsBtnClass} bg-[#39111A]/70 w-20`} disabled>
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
                    />
                  )}
              </div>
            )
        )}

        <div className="bg-gray-800 border border-gray-700 rounded overflow-hidden">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1 border-b border-gray-700 bg-gray-900/50 items-center">
            <h3 className="font-semibold text-white text-[11px] sm:text-xs truncate leading-tight">
              Fancy
            </h3>
            <div className="justify-self-end font-semibold uppercase bg-[#39111A] text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded w-fit">
              NO
            </div>
            <div className="w-fit font-semibold uppercase bg-green-900 text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded">
              YES
            </div>
          </div>
          {markets.map(
            (market) =>
              market.bettingType == "LINE" && (
                <div key={market.marketId} className="border-b border-gray-700 last:border-b-0">
                  <div className="divide-y divide-gray-700">
                    {market.runners.map((runner: any) => (
                      <div
                        key={runner.selectionId}
                        className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0"
                      >
                        <RunnerNameCell
                          runner={runner}
                          marketId={market.marketId}
                          bets={activeBetsByMarket.get(market.marketId) ?? []}
                          displayName={market.marketName}
                        />
                        <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                          <div className="flex-1 flex flex-col items-end min-w-0">
                            <div className="gap-1 flex justify-end items-center flex-wrap">
                              {runner.lay && runner.lay.length > 0 ? (
                                runner.lay.map((layItem: any, layIdx: number) => (
                                  <button
                                    key={layIdx}
                                    onClick={() =>
                                      handleLayClick(market, runner, String(layItem.line ?? layItem.price))
                                    }
                                    className={`${oddsBtnClass} hover:bg-green-900 transition-colors bg-green-900/70 w-20`}
                                  >
                                    <span className={oddsPriceClass}>{layItem.line}</span>
                                    <span className={oddsSizeClass}>{formatAmount(layItem.price)}</span>
                                  </button>
                                ))
                              ) : (
                                <button className={`${oddsBtnClass} bg-green-900/70 w-20`} disabled>
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
                                      handleBackClick(market, runner, String(backItem.line ?? backItem.price))
                                    }
                                    className={`${oddsBtnClass} hover:bg-[#39111A] transition-colors bg-[#39111A]/70 w-20`}
                                  >
                                    <span className={oddsPriceClass}>{backItem.line}</span>
                                    <span className={oddsSizeClass}>{formatAmount(backItem.price)}</span>
                                  </button>
                                ))
                              ) : (
                                <button className={`${oddsBtnClass} bg-[#39111A]/70 w-20`} disabled>
                                  <span className={oddsPriceClass}>-</span>
                                  <span className={oddsSizeClass}>-</span>
                                </button>
                              )}
                            </div>
                            <div className="hidden sm:flex flex-col text-[9px] text-gray-400 leading-tight text-right shrink-0">
                              <span>Min: {market.marketCondition?.["minBet"] ?? "-"}</span>
                              <span>Max: {market.marketCondition?.["maxBet"] ?? "-"}</span>
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
                    />
                  )}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
