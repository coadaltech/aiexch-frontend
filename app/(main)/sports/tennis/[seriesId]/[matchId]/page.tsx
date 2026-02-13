// app/match/[matchId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { cn } from "@/lib/utils";

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { addToBetSlip } = useBetSlip();

  const { status, isConnected, markets } = useMarketWebSocket(matchId);

  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [hasReceivedFirstData, setHasReceivedFirstData] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);

  // Track data arrival and timeout
  useEffect(() => {
    if (markets.length > 0) {
      setHasReceivedFirstData(true);
      setConnectionTimeout(false);
      if (!matchInfo) {
        setMatchInfo({
          eventName: markets[0]?.eventName || "Match",
          sport: markets[0]?.sport || "Sport",
          startTime: markets[0]?.startTime || new Date().toISOString(),
        });
      }
    }
  }, [markets]);

  useEffect(() => {
    if (status === "error") {
      setConnectionTimeout(true);
    }
  }, [status]);

  useEffect(() => {
    if (isConnected && !hasReceivedFirstData) {
      const timeoutId = setTimeout(() => {
        if (!hasReceivedFirstData) {
          setConnectionTimeout(true);
        }
      }, 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, hasReceivedFirstData]);

  // Format odds helper function
  const formatOdds = (odds: any): string => {
    if (!odds) return "-";
    if (typeof odds === "object") {
      return odds.price ? `${odds.price}` : "-";
    }
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render different states
  const renderContent = () => {
    // 1. Not connected to WebSocket
    if (!isConnected && status !== "connecting") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center mb-5">
            <WifiOff className="text-red-400" size={36} />
          </div>
          <h2 className="text-xl font-semibold mb-3 text-gray-200">
            Connection Error
          </h2>
          <p className="text-gray-400 text-center max-w-md mb-6">
            Unable to connect to the live data feed. Please check if the server
            is running.
          </p>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 max-w-md">
            <p className="text-sm text-gray-300 mt-1">
              Match ID: <code className="ml-1 text-gray-200">{matchId}</code>
            </p>
          </div>
        </div>
      );
    }

    // 2. Connected but no data received yet
    if (!hasReceivedFirstData && !connectionTimeout) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t border-b border-gray-600"></div>
          </div>
          <h2 className="text-lg font-medium mb-2 text-gray-300">
            Connecting to market data...
          </h2>
          <p className="text-gray-500 text-sm">Establishing live connection</p>
        </div>
      );
    }

    // 3. Connection timeout
    if (connectionTimeout) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-amber-900/20 flex items-center justify-center mb-5">
            <AlertCircle className="text-amber-400" size={36} />
          </div>
          <h2 className="text-xl font-semibold mb-3 text-gray-200">
            No Market Data Available
          </h2>
          <p className="text-gray-400 text-center max-w-md mb-6">
            The match{" "}
            <span className="font-medium text-gray-300">{matchId}</span> may not
            have active markets or data is unavailable.
          </p>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Trophy className="text-gray-400" size={18} />
                <span className="font-medium text-gray-200">Match Details</span>
              </div>
              <div className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-medium">
                CONNECTED
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Match ID:</span>
                <span className="font-medium text-gray-200">{matchId}</span>
              </div>
              {matchInfo && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sport:</span>
                    <span className="text-gray-200">{matchInfo.sport}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Start Time:</span>
                    <span className="text-gray-200">
                      {formatDate(matchInfo.startTime)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 4. Connected and received data but markets array is empty
    if (hasReceivedFirstData && markets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-5">
            <BarChart3 className="text-gray-500" size={36} />
          </div>
          <h2 className="text-xl font-semibold mb-3 text-gray-200">
            No Active Markets
          </h2>
          <p className="text-gray-400 text-center max-w-md mb-2">
            There are currently no active markets for this match.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Markets will appear here when available
          </p>

          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={14} />
            <span className="text-xs">
              Last checked:{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      );
    }

    // 5. Has data - show markets
    return (
      <div className="space-y-6">
        {markets.map((market) => (
          <div
            key={market.marketId}
            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-100">
                  {market.marketName}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-400">
                    LIVE
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-700">
              {/* Runners */}
              {market.runners.map((runner: any, idx: number) => (
                <div key={runner.selectionId} className="px-4 py-4 flex justify-between">
                  {/* Runner Name */}
                  <div className="mb-3">
                    <span className="text-white font-semibold text-base">
                      {runner.name}
                    </span>
                  </div>

                  {/* Back and Lay Table */}
                  <div className="flex gap-6">
                    {/* Back Column */}
                    <div>
                      <div className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">
                        Back
                      </div>
                      <div className="gap-2 flex">
                        {runner.back && runner.back.length > 0 ? (
                          runner.back.map((backItem: any, backIdx: number) => (
                            <button
                              key={backIdx}
                              onClick={() =>
                                handleBackClick(market, runner, backItem.price)
                              }
                              className="w-25 h-full flex flex-col items-center justify-between px-3 py-2 hover:bg-green-900 transition-colors bg-green-900/70 border-none rounded-lg cursor-pointer"
                            >
                              <span className="text-white font-semibold text-md">
                                {backItem.price}
                              </span>
                              <span className="text-gray-300 text-xs">
                                {formatAmount(backItem.size)}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-gray-600 text-xs">
                            No back odds
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lay Column */}
                    <div>
                      <div className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">
                        Lay
                      </div>
                      <div className="gap-2 flex">
                        {runner.lay && runner.lay.length > 0 ? (
                          runner.lay.map((layItem: any, layIdx: number) => (
                            <button
                              key={layIdx}
                              onClick={() =>
                                handleLayClick(market, runner, layItem.price)
                              }
                              className={cn("w-25 h-full flex flex-col items-center justify-between px-3 py-2 hover:bg-[#39111A] transition-colors bg-[#39111A]/70 border-none rounded-lg cursor-pointer")}
                            >
                              <span className="text-white font-semibold text-sm">
                                {layItem.price}
                              </span>
                              <span className="text-gray-300 text-xs">
                                {formatAmount(layItem.size)}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-gray-600 text-xs">
                            No lay odds
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-gray-700 bg-gray-900/30">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Market ID: {market.marketId}</span>
                <span>{market.runners.length} runners</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Live Match
                </span>
                <ChevronRight size={12} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-300">
                  {matchId}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {matchInfo?.eventName || `Match ${matchId}`}
              </h1>
              {matchInfo && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{formatDate(matchInfo.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users size={14} />
                    <span>{matchInfo.sport}</span>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isConnected
                  ? "bg-green-900/30 text-green-400 border border-green-800/50"
                  : "bg-red-900/30 text-red-400 border border-red-800/50"
                }`}
            >
              {isConnected ? (
                <>
                  <Wifi size={14} />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>

          {isConnected && !hasReceivedFirstData && !connectionTimeout && (
            <div className="mb-6">
              <div className="flex items-center gap-3 text-sm text-blue-400 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-800/30">
                <Clock size={14} />
                <span>Establishing market connection...</span>
              </div>
            </div>
          )}
        </div>

        {renderContent()}

        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 py-2">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-gray-300">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="text-gray-600">•</div>
                <span className="text-gray-300">ID: {matchId}</span>
                {markets.length > 0 && (
                  <>
                    <div className="text-gray-600">•</div>
                    <span className="text-gray-300">
                      {markets.length} market{markets.length !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
              <div className="text-gray-500 text-sm">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
