// app/match/[matchId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
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

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [markets, setMarkets] = useState<any[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [hasReceivedFirstData, setHasReceivedFirstData] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (socketConnected && markets.length === 0 && !hasReceivedFirstData) {
        setConnectionTimeout(true);
      }
    }, 10000);

    const socket = io("http://localhost:3003", {
      transports: ["websocket", "polling"],
      timeout: 5000,
    });

    console.log("🔌 Connecting to WebSocket at localhost:3003...");

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      setSocketConnected(true);
      setConnectionTimeout(false);
      socket.emit("subscribe-markets", matchId);
      console.log(`📡 Subscribed to match: ${matchId}`);
      clearTimeout(timeoutId);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setSocketConnected(false);
      setConnectionTimeout(true);
    });

    socket.on("market-update", (data) => {
      console.log("📊 Received market update for:", data.eventId);

      if (data.eventId === matchId) {
        console.log(`✅ Match ${matchId} update received`,data);
        setHasReceivedFirstData(true);
        setConnectionTimeout(false);
        setMarkets(data.markets);

        if (data.markets.length > 0 && !matchInfo) {
          setMatchInfo({
            eventName: data.markets[0]?.eventName || "Match",
            sport: data.markets[0]?.sport || "Sport",
            startTime: data.markets[0]?.startTime || new Date().toISOString(),
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket");
      setSocketConnected(false);
    });

    return () => {
      clearTimeout(timeoutId);
      socket.disconnect();
    };
  }, [matchId]);

  // Format odds helper function
  const formatOdds = (odds: any): string => {
    if (!odds) return "-";
    if (typeof odds === "object") {
      return odds.price ? `${odds.price}` : "-";
    }
    return odds.toString();
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
    if (!socketConnected) {
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
            <p className="text-sm text-gray-300">
              Connection URL:{" "}
              <code className="ml-1 text-gray-200">ws://localhost:3003</code>
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Match ID: <code className="ml-1 text-gray-200">{matchId}</code>
            </p>
          </div>
        </div>
      );
    }

    // 2. Connected but no data received yet (show for max 3 seconds)
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

    // 3. Connection timeout - connected but no data for a while
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
            {/* Market Header */}
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

            {/* Market Runners */}
            <div className="divide-y divide-gray-700">
              {/* Table Header */}
              <div className="px-6 py-3 bg-gray-900/30 grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Runner
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center block">
                    Back
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center block">
                    Lay
                  </span>
                </div>
              </div>

              {/* Runners List */}
              {market.runners.map((runner: any, index: number) => {
                const backPrice = formatOdds(runner.back);
                const layPrice = formatOdds(runner.lay);

                return (
                  <div
                    key={runner.selectionId}
                    className="px-6 py-4 hover:bg-gray-750 transition-colors grid grid-cols-12 gap-4 items-center"
                  >
                    {/* Runner Name */}
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded text-sm font-medium text-gray-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-gray-200 truncate block">
                          {runner.name}
                        </span>
                      </div>
                    </div>

                    {/* Back Odds */}
                    <div className="col-span-3">
                      <button className="w-full bg-green-900/20 hover:bg-green-900/30 border border-green-800/30 rounded-lg px-3 py-2 text-center transition-colors">
                        <div className="text-xs text-green-400 mb-1">Back</div>
                        <div className="text-lg font-bold text-white">
                          {backPrice}
                        </div>
                        {runner.back?.size && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            ₹{runner.back.size}
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Lay Odds */}
                    <div className="col-span-3">
                      <button className="w-full bg-red-900/20 hover:bg-red-900/30 border border-red-800/30 rounded-lg px-3 py-2 text-center transition-colors">
                        <div className="text-xs text-red-400 mb-1">Lay</div>
                        <div className="text-lg font-bold text-white">
                          {layPrice}
                        </div>
                        {runner.lay?.size && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            ₹{runner.lay.size}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Market Footer */}
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
        {/* Header */}
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                socketConnected
                  ? "bg-green-900/30 text-green-400 border border-green-800/50"
                  : "bg-red-900/30 text-red-400 border border-red-800/50"
              }`}
            >
              {socketConnected ? (
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

          {/* Connection Status */}
          {socketConnected && !hasReceivedFirstData && !connectionTimeout && (
            <div className="mb-6">
              <div className="flex items-center gap-3 text-sm text-blue-400 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-800/30">
                <Clock size={14} />
                <span>Establishing market connection...</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {renderContent()}

        {/* Stats Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 py-2">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-gray-300">
                    {socketConnected ? "Connected" : "Disconnected"}
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
