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

    console.log("Connecting to WebSocket at localhost:3003...");

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setSocketConnected(true);
      setConnectionTimeout(false);
      socket.emit("subscribe-markets", matchId);
      console.log(`Subscribed to match: ${matchId}`);
      clearTimeout(timeoutId);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setSocketConnected(false);
      setConnectionTimeout(true);
    });

    socket.on("market-update", (data) => {
      console.log("Received market update for:", data.eventId);

      if (data.eventId === matchId) {
        console.log(`Match ${matchId} update received`, data);
        setHasReceivedFirstData(true);
        setConnectionTimeout(false);
        setMarkets(data.markets);

        if (data.markets.length > 0 && !matchInfo) {
          setMatchInfo({
            eventName: data.markets[0]?.eventName || "Match",
            sport: data.markets[0]?.sport || "Greyhound Racing",
            startTime: data.markets[0]?.startTime || new Date().toISOString(),
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
      setSocketConnected(false);
    });

    return () => {
      clearTimeout(timeoutId);
      socket.disconnect();
    };
  }, [matchId]);

  const formatOdds = (odds: any): string => {
    if (!odds) return "-";
    if (typeof odds === "object") {
      return odds.price ? `${odds.price}` : "-";
    }
    return odds.toString();
  };

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

  const renderContent = () => {
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

    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white mb-1">
            {matchInfo?.eventName || `Match ${matchId}`}
          </h2>
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Trophy size={14} />
            <span>{matchInfo?.sport || "Greyhound Racing"}</span>
            {matchInfo?.startTime && (
              <>
                <span className="mx-1">|</span>
                <Calendar size={14} />
                <span>{formatDate(matchInfo.startTime)}</span>
              </>
            )}
          </div>
        </div>

        {markets.length === 0 ? (
          <div className="bg-gray-800/50 p-8 rounded-lg border border-gray-700 text-center">
            <BarChart3 className="mx-auto mb-4 text-gray-500" size={40} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No markets available
            </h3>
            <p className="text-gray-400">
              This match does not have any active betting markets.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => (
              <div
                key={market.marketId}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
              >
                <div className="bg-gray-900/50 px-4 py-3 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        {market.marketName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Market ID: {market.marketId}
                      </p>
                    </div>
                    {market.inPlay && (
                      <span className="px-2 py-0.5 bg-red-600/80 text-white text-xs rounded">
                        LIVE
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  {market.runners?.length > 0 ? (
                    <div className="space-y-2">
                      {market.runners.map((runner: any) => (
                        <div
                          key={runner.selectionId}
                          className="flex items-center justify-between p-2 bg-gray-900/30 rounded"
                        >
                          <div className="text-sm text-gray-200">
                            {runner.runnerName || runner.name}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-gray-400">Back</div>
                            <div className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-sm font-medium min-w-[48px] text-center">
                              {formatOdds(runner.back?.[0])}
                            </div>
                            <div className="text-xs text-gray-400">Lay</div>
                            <div className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-sm font-medium min-w-[48px] text-center">
                              {formatOdds(runner.lay?.[0])}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">No runners</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">{renderContent()}</div>
    </div>
  );
}
