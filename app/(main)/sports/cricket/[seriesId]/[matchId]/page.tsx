// app/match/[matchId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import { useBetSlip } from "@/contexts/BetSlipContext";


const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL
if (!SOCKET_URL) {
  console.warn("NEXT_PUBLIC_SOCKET_URL is not defined. Defaulting to ws://localhost:3003");
}

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { addToBetSlip } = useBetSlip();

  const [markets, setMarkets] = useState<any[]>([]);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [status, setStatus] = useState<
    "connecting" | "connected" | "no-data" | "error" | "success"
  >("connecting");

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 5000,
    });

    socket.on("connect", () => {
      console.log("✅ Connected");
      setStatus("connected");
      socket.emit("subscribe-markets", matchId);

      timeoutId = setTimeout(() => {
        if (markets.length === 0) {
          setStatus("no-data");
        }
      }, 4000);
    });

    socket.on("market-update", (data) => {
      if (data.eventId === matchId) {
        clearTimeout(timeoutId);

        if (data.markets.length > 0) {
          setMarkets(data.markets);
          setMatchInfo({
            eventName: data.markets[0]?.eventName || "Match",
            sport: data.markets[0]?.sport || "Cricket",
            startTime: data.markets[0]?.startTime,
          });
          setStatus("success");
        } else {
          setStatus("no-data");
        }
      }
    });

    socket.on("connect_error", () => {
      setStatus("error");
    });

    socket.on("disconnect", () => {
      setStatus("connecting");
    });

    return () => {
      clearTimeout(timeoutId);
      socket.disconnect();
    };
  }, [matchId]);

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
  if (status === "error") {
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

  if (status === "connecting" || status === "connected") {
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

  if (status === "no-data") {
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
          {markets.map((market) => (
            <div
              key={market.marketId}
              className="bg-gray-800 rounded-lg border border-gray-700"
            >
              {/* Market Title */}
              <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">
                    {market.marketName}
                  </h3>
                  <span className="text-xs text-green-400 px-2 py-1 bg-green-900/30 rounded-full">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Runners */}
              <div className="divide-y divide-gray-700">
                {market.runners.map((runner: any, idx: number) => (
                  <div key={runner.selectionId} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 w-6">
                          {idx + 1}
                        </span>
                        <span className="text-white font-medium">
                          {runner.name}
                        </span>
                      </div>

                      {/* Odds */}
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleBackClick(market, runner, runner.back?.price)
                          }
                          disabled={!runner.back?.price}
                          className={`w-24 rounded-lg p-2 transition-colors ${runner.back?.price
                            ? "bg-green-900/30 hover:bg-green-900/50 border border-green-800/30"
                            : "bg-gray-800/50 border border-gray-700 cursor-not-allowed opacity-50"
                            }`}
                        >
                          <div className="text-xs text-green-400">BACK</div>
                          <div className="text-lg font-bold text-white">
                            {formatOdds(runner.back)}
                          </div>
                        </button>
                        <button
                          onClick={() =>
                            handleLayClick(market, runner, runner.lay?.price)
                          }
                          disabled={!runner.lay?.price}
                          className={`w-24 rounded-lg p-2 transition-colors ${runner.lay?.price
                            ? "bg-red-900/30 hover:bg-red-900/50 border border-red-800/30"
                            : "bg-gray-800/50 border border-gray-700 cursor-not-allowed opacity-50"
                            }`}
                        >
                          <div className="text-xs text-red-400">LAY</div>
                          <div className="text-lg font-bold text-white">
                            {formatOdds(runner.lay)}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Volume/Size indicator (optional) */}
                    {(runner.back?.size || runner.lay?.size) && (
                      <div className="flex justify-end mt-1 gap-4 text-xs text-gray-500">
                        {runner.back?.size && (
                          <span>Vol: ₹{runner.back.size}</span>
                        )}
                        {runner.lay?.size && (
                          <span>Vol: ₹{runner.lay.size}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
