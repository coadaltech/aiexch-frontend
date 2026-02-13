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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading match data...</p>
          <p className="text-xs text-gray-600 mt-2">ID: {matchId}</p>
        </div>
      </div>
    );
  }

  if (pageStatus === "no-data") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
    );
  }

  // 4. SUCCESS - Show markets
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {matchInfo?.eventName || `Match ${matchId}`}
          </h1>
          {matchInfo?.startTime && (
            <p className="text-gray-400 text-sm mt-1">
              {formatDate(matchInfo.startTime)}
            </p>
          )}
        </div>

        {/* Markets */}
        <div className="space-y-4">
          {
            markets.map((market) =>
              market.bettingType == "ODDS"
              && (
                <div
                  key={market.marketId}
                  className="bg-gray-800 rounded-lg border border-gray-700"
                >
                  {/* Market Title */}
                  <div className="grid grid-cols-3 gap-5 px-4 py-3 border-b border-gray-700 bg-gray-900/50">
                    <h3 className="font-semibold text-white">
                      {market.marketName}
                    </h3>
                    <div className="justify-self-end text-sm font-semibold text-green-400 mb-2 uppercase tracking-wide">
                      Back
                    </div>
                    <div className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide">
                      Lay
                    </div>
                    {/* <span className="text-xs text-green-400 px-2 py-1 bg-green-900/30 rounded-full"> */}
                    {/*   LIVE */}
                    {/* </span> */}
                  </div>

                  {/* Runners */}
                  <div className="divide-y divide-gray-700">
                    {market.runners.map((runner: any, idx: number) => (
                      <div key={runner.selectionId} className="px-2 py-1 grid grid-cols-3 gap-5 justify-between items-center">
                        {/* Runner Name */}
                        <div className="">
                          <span className="text-white font-semibold text-base">
                            {runner.name}
                          </span>
                        </div>

                        {/* Back Column */}
                        <div className="flex flex-col items-end">
                          <div className="gap-2 flex justify-center items-center">
                            {runner.back && runner.back.length > 0 ? (
                              runner.back.map((backItem: any, backIdx: number) => (
                                <button
                                  key={backIdx}
                                  onClick={() =>
                                    handleBackClick(market, runner, backItem.price)
                                  }
                                  className="w-25 h-full px-2 py-1 flex flex-col items-center justify-between hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded-lg cursor-pointer"
                                >
                                  <span className="text-white font-bold text-sm">
                                    {backItem.price}
                                  </span>
                                  <span className="text-gray-400 text-xs font-semibold">
                                    {formatAmount(backItem.size)}
                                  </span>
                                </button>
                              ))
                            ) : (

                              <button
                                className="w-full h-full text-sm flex flex-col items-center justify-between px-3 py-2 hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded-lg cursor-pointer"
                              >
                                No Back Odds
                              </button>

                            )}
                          </div>
                        </div>

                        {/* Lay Column */}
                        <div className="flex flex-col items-start">
                          <div className="gap-2 flex justify-center items-center">
                            {runner.lay && runner.lay.length > 0 ? (
                              runner.lay.map((layItem: any, layIdx: number) => (
                                <button
                                  key={layIdx}
                                  onClick={() =>
                                    handleLayClick(market, runner, layItem.price)
                                  }
                                  className="w-25 h-full px-2 py-1 flex flex-col items-center justify-between hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded-lg cursor-pointer"
                                >
                                  <span className="text-white font-bold text-sm">
                                    {layItem.price}
                                  </span>
                                  <span className="text-gray-400 text-xs font-semibold">
                                    {formatAmount(layItem.size)}
                                  </span>
                                </button>
                              ))
                            ) : (

                              <button
                                className="w-full h-full text-sm flex flex-col items-center justify-between px-3 py-2 hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded-lg cursor-pointer"
                              >
                                No lay Odds
                              </button>

                            )}
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
            <div className="grid grid-cols-3 gap-5 px-4 py-3 border-b border-gray-700 bg-gray-900/50">
              <h3 className="font-semibold text-white">
                Fancy
              </h3>
              <div className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide justify-self-end">
                NO
              </div>
              <div className="text-sm font-semibold text-green-400 mb-2 uppercase tracking-wide">
                YES
              </div>
              {/* <span className="text-xs text-green-400 px-2 py-1 bg-green-900/30 rounded-full"> */}
              {/*   LIVE */}
              {/* </span> */}
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
                        <div key={runner.selectionId} className="px-2 py-1 grid grid-cols-3 gap-5 justify-between items-center">
                          {/* Runner Name */}
                          <div className="">
                            <span className="text-white font-medium text-base">
                              {market.marketName}
                            </span>
                          </div>

                          {/* Back Column */}
                          <div className="flex flex-col items-end">
                            <div className="gap-2 flex justify-center items-center">
                              {runner.back && runner.back.length > 0 ? (
                                runner.back.map((backItem: any, backIdx: number) => (
                                  <button
                                    key={backIdx}
                                    onClick={() =>
                                      handleBackClick(market, runner, backItem.price)
                                    }
                                    className="w-25 h-full px-2 py-1 flex flex-col items-center justify-between hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded-lg cursor-pointer"
                                  >
                                    <span className="text-white font-bold text-sm">
                                      {backItem.price}
                                    </span>
                                    <span className="text-gray-400 text-xs font-semibold">
                                      {formatAmount(backItem.size)}
                                    </span>
                                  </button>
                                ))
                              ) : (

                                <button
                                  className="w-full h-full text-sm flex flex-col items-center justify-between px-3 py-2 hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded-lg cursor-pointer"
                                >
                                  No Back Odds
                                </button>

                              )}
                            </div>
                          </div>

                          {/* Lay Column */}
                          <div className="flex flex-col items-start">
                            <div className="gap-2 flex justify-center items-center">
                              {runner.lay && runner.lay.length > 0 ? (
                                runner.lay.map((layItem: any, layIdx: number) => (
                                  <button
                                    key={layIdx}
                                    onClick={() =>
                                      handleLayClick(market, runner, layItem.price)
                                    }
                                    className="w-25 h-full px-2 py-1 flex flex-col items-center justify-between hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded-lg cursor-pointer"
                                  >
                                    <span className="text-white font-bold text-sm">
                                      {layItem.price}
                                    </span>
                                    <span className="text-gray-400 text-xs font-semibold">
                                      {formatAmount(layItem.size)}
                                    </span>
                                  </button>
                                ))
                              ) : (

                                <button
                                  className="w-full h-full text-sm flex flex-col items-center justify-between px-3 py-2 hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded-lg cursor-pointer"
                                >
                                  No lay Odds
                                </button>

                              )}
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
      </div>
    </div>
  );
}
