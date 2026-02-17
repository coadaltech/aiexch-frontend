"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { addToBetSlip } = useBetSlip();

  const { status, isConnected, markets } = useMarketWebSocket(matchId);

  console.log(markets)
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [pageStatus, setPageStatus] = useState<
    "connecting" | "connected" | "no-data" | "error" | "success"
  >("connecting");

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
                                    {layItem.price}
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
                              {runner.back && runner.back.length > 0 ? (
                                runner.back.map(
                                  (backItem: any, backIdx: number) => (
                                    <button
                                      key={backIdx}
                                      onClick={() =>
                                        handleBackClick(
                                          market,
                                          runner,
                                          backItem.price
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
                          </div>
                          <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                            <div className="gap-1 flex justify-start items-center flex-wrap min-w-0">
                              {runner.lay && runner.lay.length > 0 ? (
                                runner.lay.map(
                                  (layItem: any, layIdx: number) => (
                                    <button
                                      key={layIdx}
                                      onClick={() =>
                                        handleLayClick(
                                          market,
                                          runner,
                                          layItem.price
                                        )
                                      }
                                      className={`${oddsBtnClass} hover:bg-green-900 transition-colors bg-green-900/70 w-20`}
                                    >
                                      <span className={oddsPriceClass}>
                                        {layItem.price}
                                      </span>
                                      <span className={oddsSizeClass}>
                                        {formatAmount(layItem.size)}
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
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
