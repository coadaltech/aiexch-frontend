// app/match/[matchId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { addToBetSlip } = useBetSlip();

  const { status, isConnected, markets } = useMarketWebSocket(matchId);
  console.log("markets -> ", markets)

  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [pageStatus, setPageStatus] = useState<
    "connecting" | "connected" | "no-data" | "error" | "success"
  >("connecting");

  // Derive page status from WS status + markets
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
      // Give a brief window for data to arrive
      const timeout = setTimeout(() => {
        if (markets.length === 0) {
          setPageStatus("no-data");
        }
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [status, isConnected, markets]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format odds
  const formatOdds = (odds: any) => {
    if (!odds) return "-";
    if (typeof odds === "object") return odds.price || "-";
    return odds.toString();
  };

  // Format size/amount (K for thousands, L for lacs)
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

  // ============ HANDLERS ============
  const handleBackClick = (market: any, runner: any, odds: number) => {
    if (!odds) return;

    const bet = {
      id: Date.now(),
      teams: `${matchInfo?.eventName || "Match"} - ${runner.name}`,
      market: market.marketName,
      odds: odds.toString(),
      stake: "0",
      potentialWin: "0",
      matchId: matchId,
      marketId: market.marketId,
      selectionId: runner.selectionId.toString(),
      marketName: market.marketName,
      runnerName: runner.name,
    };

    addToBetSlip(bet);
  };

  const handleLayClick = (market: any, runner: any, odds: number) => {
    if (!odds) return;

    const bet = {
      id: Date.now(),
      teams: `${matchInfo?.eventName || "Match"} - ${runner.name}`,
      market: `LAY ${market.marketName}`,
      odds: odds.toString(),
      stake: "0",
      potentialWin: "0",
      matchId: matchId,
      marketId: market.marketId,
      selectionId: runner.selectionId.toString(),
      marketName: market.marketName,
      runnerName: runner.name,
    };

    addToBetSlip(bet);
  };

  // ============ RENDER STATES ============
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
          {/* <p className="text-xs text-gray-600 mt-2">ID: {matchId}</p> */}
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

  // 4. SUCCESS - Show markets
  return (
    <div className="px-2 py-1">
      {/* Markets */}
      <div className="space-y-2 sm:space-y-3 md:space-y-4  bg-gray-900 rounded-lg">
        {
          markets.map((market) =>
            market.bettingType == "ODDS"
            && (
              <div
                key={market.marketId}
                className="bg-gray-800 rounded-lg border border-gray-700"
              >
                {/* Market Title */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-b border-gray-700 bg-gray-900/50">
                  <h3 className="font-semibold text-white text-xs sm:text-sm md:text-base truncate pr-1">
                    {market.marketName}
                  </h3>
                  <div className="justify-self-end font-semibold uppercase tracking-wide bg-green-900 text-white text-xs p-1 px-2 rounded-t-lg">
                    Back
                  </div>
                  <div className="font-semibold uppercase tracking-wide bg-[#39111A] text-white text-xs p-1 px-2 rounded-t-lg w-fit">
                    Lay
                  </div>
                </div>

                {/* Runners */}
                <div className="divide-y divide-gray-700">
                  {market.runners.map((runner: any, idx: number) => (
                    <div key={runner.selectionId} className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5 justify-between items-center">
                      {/* Runner Name */}
                      <div className="min-w-0 pr-1">
                        <span className="text-white font-semibold text-xs sm:text-sm md:text-base truncate block">
                          {runner.name}
                        </span>
                      </div>

                      {/* Back Column */}
                      <div className="flex flex-col items-end">
                        <div className="gap-1 sm:gap-1.5 md:gap-2 flex justify-end items-center">
                          {/* Show real back odds */}
                          {runner.back && runner.back.length > 0 && (
                            [...runner.back].reverse().map((backItem: any, backIdx: number) => (
                              <button
                                key={backIdx}
                                onClick={() =>
                                  handleBackClick(market, runner, backItem.price)
                                }
                                className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                              >
                                <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                  {backItem.price}
                                </span>
                                <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                  {formatAmount(backItem.size)}
                                </span>
                              </button>
                            ))
                          )}
                          {/* Show empty boxes for missing odds (max 3 total) */}
                          {Array.from({ length: Math.max(0, 3 - (runner.back?.length || 0)) }).map((_, emptyIdx: number) => (
                            <button
                              key={`empty-back-${emptyIdx}`}
                              className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                              disabled
                            >
                              <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                -
                              </span>
                              <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                -
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lay Column */}
                      <div className="flex flex-col items-start">
                        <div className="gap-1 sm:gap-1.5 md:gap-2 flex justify-start items-center">
                          {/* Show real lay odds */}
                          {runner.lay && runner.lay.length > 0 && (
                            runner.lay.map((layItem: any, layIdx: number) => (
                              <button
                                key={layIdx}
                                onClick={() =>
                                  handleLayClick(market, runner, layItem.price)
                                }
                                className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                              >
                                <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                  {layItem.price}
                                </span>
                                <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                  {formatAmount(layItem.size)}
                                </span>
                              </button>
                            ))
                          )}
                          {/* Show empty boxes for missing odds (max 3 total) */}
                          {Array.from({ length: Math.max(0, 3 - (runner.lay?.length || 0)) }).map((_, emptyIdx: number) => (
                            <button
                              key={`empty-lay-${emptyIdx}`}
                              className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                              disabled
                            >
                              <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                -
                              </span>
                              <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                -
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        }

        <div className="bg-gray-800 rounded-lg border border-gray-700" >

          {/* Market Title */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border-b border-gray-700 bg-gray-900/50">
            <h3 className="font-semibold text-white text-xs sm:text-sm md:text-base truncate pr-1">
              Fancy
            </h3>
            <div className="justify-self-end font-semibold uppercase tracking-wide bg-[#39111A] text-white text-xs p-1 px-2 rounded-t-lg w-fit">
              NO
            </div>
            <div className="w-fit font-semibold uppercase tracking-wide bg-green-900 text-white text-xs p-1 px-2 rounded-t-lg">
              YES
            </div>
          </div>

          {
            markets.map((market) =>
              market.bettingType == "LINE"
              && (
                <div
                  key={market.marketId}
                  className="bg-gray-800 border-b border-gray-700"
                >
                  {/* Runners */}
                  <div className="divide-y divide-gray-700">
                    {market.runners.map((runner: any, idx: number) => (
                      <div key={runner.selectionId} className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5 justify-between items-center">
                        {/* Runner Name */}
                        <div className="min-w-0 pr-1">
                          <span className="text-white font-medium text-xs sm:text-sm md:text-base truncate block">
                            {market.marketName}
                          </span>
                        </div>

                        {/* Back Column */}
                        <div className="flex flex-col items-end">
                          <div className="gap-1 sm:gap-1.5 md:gap-2 flex justify-end items-center">
                            {/* Show real back odds */}
                            {runner.back && runner.back.length > 0 ? (
                              runner.back.map((backItem: any, backIdx: number) => (
                                <button
                                  key={backIdx}
                                  onClick={() =>
                                    handleBackClick(market, runner, backItem.price)
                                  }
                                  className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                                >
                                  <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                    {backItem.price}
                                  </span>
                                  <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                    {formatAmount(backItem.size)}
                                  </span>
                                </button>
                              ))
                            ) :

                              <button
                                className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                                disabled
                              >
                                <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                  -
                                </span>
                                <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                  -
                                </span>
                              </button>
                            }
                          </div>
                        </div>

                        {/* Lay Column */}
                        <div className="flex flex-col items-start">
                          <div className="gap-1 sm:gap-1.5 md:gap-2 flex justify-start items-center">
                            {/* Show real lay odds */}
                            {runner.lay && runner.lay.length > 0 ? (
                              runner.lay.map((layItem: any, layIdx: number) => (
                                <button
                                  key={layIdx}
                                  onClick={() =>
                                    handleLayClick(market, runner, layItem.price)
                                  }
                                  className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                                >
                                  <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                    {layItem.price}
                                  </span>
                                  <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                    {formatAmount(layItem.size)}
                                  </span>
                                </button>
                              ))
                            ) :

                              <button
                                className="min-w-[32px] sm:min-w-[38px] md:min-w-[45px] lg:min-w-[52px] px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 flex flex-col items-center justify-center hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded sm:rounded-md md:rounded-lg cursor-pointer"
                                disabled
                              >
                                <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm leading-tight">
                                  -
                                </span>
                                <span className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                                  -
                                </span>
                              </button>
                            }

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
        </div>
      </div>
      {/* </div> */}
    </div>
  );
}
