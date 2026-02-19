"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBetting } from "@/hooks/useBetting";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";
import { getSportConfig } from "@/lib/sports-config";
import { addDemoBets } from "@/lib/demo-bets";
import type { DemoBet } from "@/lib/demo-bets";
import { toast } from "sonner";

type QuickBetData = {
  marketId: string;
  bettingType: string;
  market: any;
  runner: any;
  eventName: string;
  odds: string;
  isLay: boolean;
};

function QuickBetPanel({
  data,
  onClose,
  onPlaceBet,
}: {
  data: QuickBetData;
  onClose: () => void;
  onPlaceBet: (stake: string, odds: string) => void;
}) {
  const [stake, setStake] = useState("");
  const { market, runner, eventName, odds } = data;
  const marketName = market?.marketName || "";
  const runnerName = runner?.name || "";

  const quickStakes = [100, 500, 1000, 5000, 10000, 50000];

  const handleStake = (val: string) => {
    const n = parseFloat(val) || 0;
    setStake(n > 0 ? String(n) : "");
  };

  return (
    <div className="px-2 sm:px-3 py-3 border-t border-teal-600 bg-gradient-to-b from-sky-200/90 via-sky-100/80 to-white dark:from-sky-900/40 dark:via-sky-800/30 dark:to-gray-900">
      {/* Top Right Section: Label, Odds Input, Stake Input */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 justify-end mb-3">
        {/* Label */}
        <div className="text-black dark:text-white font-bold text-xs sm:text-sm truncate max-w-full sm:max-w-none text-right sm:text-left">
          {runnerName} - {marketName.toUpperCase()}
        </div>

        {/* Odds Display (Fixed) */}
        <div className="flex items-center">
          <input
            type="text"
            value={odds}
            readOnly
            className="w-14 sm:w-16 bg-white dark:bg-gray-800 text-black dark:text-white text-[10px] sm:text-xs py-1.5 px-2 text-center border border-gray-300 dark:border-gray-600 rounded cursor-default"
          />
        </div>

        {/* Stake Input */}
        <div className="flex items-center">
          <input
            type="number"
            value={stake}
            onChange={(e) => handleStake(e.target.value)}
            placeholder="1"
            className="w-14 sm:w-16 bg-white dark:bg-gray-800 text-black dark:text-white text-[10px] sm:text-xs py-1.5 px-2 text-center border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
      </div>

      {/* Bottom Right Section: Quick Bet Buttons and Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        {/* Quick Bet Amount Buttons */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {quickStakes.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setStake(String(amount))}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              {amount >= 1000 ? amount / 1000 + "K" : amount}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPlaceBet(stake, odds)}
            disabled={!stake || parseFloat(stake) <= 0}
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            Place Bet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const params = useParams();
  const sport = params.sport as string;
  const seriesId = params.seriesId as string;
  const matchId = params.matchId as string;
  const { addToBetSlip } = useBetSlip();
  const [quickBet, setQuickBet] = useState<QuickBetData | null>(null);
  const queryClient = useQueryClient();
  const { user, updateDemoBalance } = useAuth();
  const { placeBet } = useBetting();

  const config = getSportConfig(sport);
  const { seriesData } = UseSportsSeries(config?.eventTypeId ?? null);
  const { status, isConnected, markets } = useMarketWebSocket(matchId);

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
        if (markets.length === 0) {
          setPageStatus("no-data");
        }
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [status, isConnected, markets]);

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
    if (amount >= 100000) {
      const lacs = (amount / 100000).toFixed(1);
      return `${lacs}L`;
    } else if (amount >= 1000) {
      const thousands = (amount / 1000).toFixed(1);
      return `${thousands}K`;
    }
    return amount.toFixed(0);
  };

  const handleBackClick = (market: any, runner: any, odds: number | string) => {
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
    setQuickBet({
      marketId: market.marketId,
      bettingType: market.bettingType,
      market,
      runner,
      eventName: matchInfo?.eventName || "Match",
      odds: String(odds),
      isLay: false,
    });
  };

  const handleLayClick = (market: any, runner: any, odds: number | string) => {
    const o = typeof odds === "number" ? odds : parseFloat(String(odds));
    if (o === 0 && odds !== "0") return;
    setQuickBet({
      marketId: market.marketId,
      bettingType: market.bettingType,
      market,
      runner,
      eventName: matchInfo?.eventName || "Match",
      odds: String(odds),
      isLay: true,
    });
  };

  const handleQuickBetPlace = (stake: string, odds: string) => {
    if (!quickBet || !stake || parseFloat(stake) <= 0) return;
    const { market, runner, eventName, isLay } = quickBet;
    const oddsValue = odds || quickBet.odds;
    const marketName = market?.marketName || "";
    const runnerName = runner?.name || "";
    const stakeNum = parseFloat(stake);
    const oddsNum = parseFloat(oddsValue) || 0;
    const betPayload = {
      id: Date.now(),
      teams: `${eventName} - ${runnerName}`,
      market: isLay ? `LAY ${marketName}` : marketName,
      odds: oddsValue,
      stake,
      potentialWin: (stakeNum * oddsNum).toFixed(2),
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
    } else {
      placeBet({
        matchId,
        marketId: market.marketId,
        eventTypeId: config?.eventTypeId?.toString() || "1",
        selectionId: runner.selectionId?.toString() ?? "",
        marketName,
        runnerName,
        odds: oddsNum,
        stake: stakeNum,
        type: isLay ? "lay" : "back",
      });
      toast.success("Bet placed.");
    }
    setQuickBet(null);
  };

  if (pageStatus === "error") {
    return (
      <div className="rounded-lg bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-400 text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Connection Failed
          </h2>
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
            <h2 className="text-xl font-semibold text-white mb-2">
              No Open Markets
            </h2>
            <p className="text-gray-400 mb-2">This match has no active markets</p>
            <p className="text-sm text-gray-600">
              Markets will appear when available
            </p>
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
        <span
          className="text-red-500 font-bold text-sm sm:text-base drop-shadow-sm"
          style={{ pointerEvents: "auto" }}
        >
          {label}
        </span>
      </div>
    );
  };

  const oddsBtnClass =
    "min-w-[28px] sm:min-w-[34px] md:min-w-[40px] px-1 py-1 flex flex-col items-center justify-center border-none rounded cursor-pointer leading-tight";
  const oddsPriceClass = "text-white font-bold text-[10px] sm:text-xs";
  const oddsSizeClass = "text-gray-400 font-medium text-[8px] sm:text-[9px]";

  return (
    <div className="px-1 sm:px-2 py-1 w-full max-w-full min-w-0">
      {/* Match header: left = event name + series name, right = start time */}
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
                      <div className="min-w-0 pr-1">
                        <span className="text-white font-semibold text-[11px] sm:text-xs truncate block leading-tight">
                          {runner.name}
                        </span>
                      </div>
                      <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                        <div className="flex-1 flex flex-col items-end min-w-0">
                          <div className="gap-1 flex justify-end items-center flex-wrap">
                            {(() => {
                              // For ODDS and BOOKMAKER, fill from right to left
                              const backItems = runner.back || [];
                              const positions = Array(3).fill(null);

                              // Fill from right to left: first item in rightmost (index 2), second in middle (index 1), third in leftmost (index 0)
                              backItems.forEach((item: any, idx: number) => {
                                if (idx < 3) {
                                  positions[2 - idx] = item; // Fill from right: idx 0 -> pos 2, idx 1 -> pos 1, idx 2 -> pos 0
                                }
                              });

                              return positions.map((item, posIdx) => {
                                if (item) {
                                  return (
                                    <button
                                      key={`back-${posIdx}`}
                                      onClick={() =>
                                        handleBackClick(
                                          market,
                                          runner,
                                          item.price
                                        )
                                      }
                                      className={`${oddsBtnClass} hover:bg-green-900 transition-colors bg-green-900/70 w-20`}
                                    >
                                      <span className={oddsPriceClass}>
                                        {item.price}
                                      </span>
                                      <span className={oddsSizeClass}>
                                        {formatAmount(item.size)}
                                      </span>
                                    </button>
                                  );
                                } else {
                                  return (
                                    <button
                                      key={`empty-back-${posIdx}`}
                                      className={`${oddsBtnClass} bg-green-900/70 w-20`}
                                      disabled
                                    >
                                      <span className={oddsPriceClass}>-</span>
                                      <span className={oddsSizeClass}>-</span>
                                    </button>
                                  );
                                }
                              });
                            })()}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-start min-w-0">
                          <div className="gap-1 flex justify-start items-center flex-wrap">
                            {runner.lay &&
                              runner.lay.length > 0 &&
                              runner.lay.map((layItem: any, layIdx: number) => (
                                <button
                                  key={layIdx}
                                  onClick={() =>
                                    handleLayClick(
                                      market,
                                      runner,
                                      layItem.price
                                    )
                                  }
                                  className={`${oddsBtnClass} hover:bg-[#39111A] transition-colors bg-[#39111A]/70 w-20`}
                                >
                                  <span className={oddsPriceClass}>
                                    {layItem.price ? layItem.price : "0"}
                                  </span>
                                  <span className={oddsSizeClass}>
                                    {formatAmount(layItem.size)}
                                  </span>
                                </button>
                              ))}
                            {Array.from({
                              length: Math.max(
                                0,
                                3 - (runner.lay?.length || 0)
                              ),
                            }).map((_, emptyIdx: number) => (
                              <button
                                key={`empty-lay-${emptyIdx}`}
                                className={`${oddsBtnClass} bg-[#39111A]/70 w-20`}
                                disabled
                              >
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
                  (quickBet.bettingType === "ODDS" ||
                    quickBet.bettingType === "BOOKMAKER") && (
                    <QuickBetPanel
                      data={quickBet}
                      onClose={() => setQuickBet(null)}
                      onPlaceBet={handleQuickBetPlace}
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
                <div
                  key={market.marketId}
                  className="border-b border-gray-700 last:border-b-0"
                >
                  <div className="divide-y divide-gray-700">
                    {market.runners.map((runner: any) => (
                      <div
                        key={runner.selectionId}
                        className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-white font-medium text-[11px] sm:text-xs truncate block leading-tight">
                            {market.marketName}
                          </span>
                        </div>
                        <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                          <div className="flex-1 flex flex-col items-end min-w-0">
                            <div className="gap-1 flex justify-end items-center flex-wrap">
                              {runner.lay && runner.lay.length > 0 ? (
                                runner.lay.map(
                                  (layItem: any, layIdx: number) => (
                                    <button
                                      key={layIdx}
                                      onClick={() =>
                                        handleLayClick(
                                          market,
                                          runner,
                                          String(layItem.line ?? layItem.price)
                                        )
                                      }
                                      className={`${oddsBtnClass} hover:bg-green-900 transition-colors bg-green-900/70 w-20`}
                                    >
                                      <span className={oddsPriceClass}>
                                        {layItem.line}
                                      </span>
                                      <span className={oddsSizeClass}>
                                        {formatAmount(layItem.price)}
                                      </span>
                                    </button>
                                  )
                                )
                              ) : (
                                <button
                                  className={`${oddsBtnClass} bg-green-900/70 w-20`}
                                  disabled
                                >
                                  <span className={oddsPriceClass}>-</span>
                                  <span className={oddsSizeClass}>-</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                            <div className="gap-1 flex justify-start items-center flex-wrap min-w-0">
                              {runner.back && runner.back.length > 0 ? (
                                runner.back.map(
                                  (backItem: any, backIdx: number) => (
                                    <button
                                      key={backIdx}
                                      onClick={() =>
                                        handleBackClick(
                                          market,
                                          runner,
                                          String(backItem.line ?? backItem.price)
                                        )
                                      }
                                      className={`${oddsBtnClass} hover:bg-[#39111A] transition-colors bg-[#39111A]/70 w-20`}
                                    >
                                      <span className={oddsPriceClass}>
                                        {backItem.line}
                                      </span>
                                      <span className={oddsSizeClass}>
                                        {formatAmount(backItem.price)}
                                      </span>
                                    </button>
                                  )
                                )
                              ) : (
                                <button
                                  className={`${oddsBtnClass} bg-[#39111A]/70 w-20`}
                                  disabled
                                >
                                  <span className={oddsPriceClass}>-</span>
                                  <span className={oddsSizeClass}>-</span>
                                </button>
                              )}
                            </div>
                            <div className="hidden sm:flex flex-col text-[9px] text-gray-400 leading-tight text-right shrink-0">
                              <span>
                                Min: {market.marketCondition?.["minBet"] ?? "-"}
                              </span>
                              <span>
                                Max: {market.marketCondition?.["maxBet"] ?? "-"}
                              </span>
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
                      onClose={() => setQuickBet(null)}
                      onPlaceBet={handleQuickBetPlace}
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
