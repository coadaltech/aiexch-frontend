// app/match/[matchId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";

interface RunnerOdds {
  price: number | null;
  size: number | null;
  line: number | null;
}

interface Runner {
  selectionId: string;
  name: string;
  status: string;
  back: RunnerOdds | null;
  lay: RunnerOdds | null;
}

interface MarketCondition {
  allowUnmatchBet: boolean;
  betDelay: number;
  betLock: boolean;
  marketId: string;
  maxBet: number;
  maxProfit: number;
  minBet: number;
  mtp: number;
  potLimit: number;
  volume: number;
}

interface Market {
  marketId: string;
  marketName: string;
  marketType: string;
  status: string;
  inPlay: boolean;
  bettingType: string;
  marketCondition: MarketCondition;
  runners: Runner[];
}

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // 1. Fetch initial data via HTTP API
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/sports/getMarketWithOdds/${matchId}`,
      );
      const result = await response.json();
      console.log("API Response:", result);

      if (result.success) {
        // Transform data to handle null values safely
        const safeMarkets = result.data.map((market: any) => ({
          ...market,
          runners: market.runners.map((runner: any) => ({
            ...runner,
            back: runner.back || null,
            lay: runner.lay || null,
          })),
        }));

        setMarkets(safeMarkets);
        console.log("Initial data loaded:", safeMarkets.length, "markets");
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Component mounted for match:", matchId);

    // Step 1: Get initial data
    fetchInitialData();

    // Step 2: Connect to WebSocket for live updates
    const socket = io("http://localhost:3003", {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ WebSocket connecteddd");
      setSocketConnected(true);

      // Subscribe to this match
      socket.emit("subscribe-markets", matchId);
      console.log(`📡 Subscribed to match: ${matchId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
      setSocketConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setSocketConnected(false);
    });

    // Listen for live updates
    socket.on("market-update", (data) => {
  console.log("⏱️ Update time:", new Date(data.timestamp).toLocaleTimeString());
      console.log("Live data:", data);

      if (data.eventId === matchId) {
        // Transform live data too
        const safeMarkets = data.markets.map((market: any) => ({
          ...market,
          runners: market.runners.map((runner: any) => ({
            ...runner,
            back: runner.back || null,
            lay: runner.lay || null,
          })),
        }));

        console.log("🔄 Updating markets with live data");
        setMarkets(safeMarkets);
      }
    });

    // Cleanup
    return () => {
      console.log("Cleaning up socket connection");
      socket.disconnect();
    };
  }, [matchId]);

  const formatPrice = (price: number | null) => {
    return price ? price.toFixed(2) : "-";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600";
      case "SUSPENDED":
        return "text-yellow-600";
      case "REMOVED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading market data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Match Markets
              </h1>
              <p className="text-gray-600 mt-1">Event ID: {matchId}</p>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`flex items-center ${socketConnected ? "text-green-600" : "text-red-600"}`}
              >
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${socketConnected ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span className="text-sm font-medium">
                  {socketConnected ? "Live Connected" : "Disconnected"}
                </span>
              </div>

              <button
                onClick={fetchInitialData}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Markets Grid */}
        {markets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Markets Available
            </h3>
            <p className="text-gray-500">
              There are no active markets for this event.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {markets.map((market) => (
              <div
                key={market.marketId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Market Header */}
                <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">
                      {market.marketName}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${market.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {market.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Type: {market.marketType}
                    </span>
                    <span
                      className={`px-2 py-1 rounded ${market.inPlay ? "bg-red-100 text-red-800" : "bg-gray-100"}`}
                    >
                      {market.inPlay ? "In Play" : "Pre-match"}
                    </span>
                  </div>
                </div>

                {/* Market Condition Stats */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-gray-500">Min Bet</div>
                      <div className="font-bold text-gray-800">
                        ₹{market.marketCondition?.minBet || 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-500">Max Bet</div>
                      <div className="font-bold text-gray-800">
                        ₹
                        {(market.marketCondition?.maxBet || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-500">
                        Max Profit
                      </div>
                      <div className="font-bold text-gray-800">
                        ₹
                        {(
                          market.marketCondition?.maxProfit || 0
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Runners List */}
                <div className="divide-y divide-gray-100">
                  {market.runners.map((runner) => (
                    <div
                      key={runner.selectionId}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">
                              {runner.name}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getStatusColor(runner.status)} bg-opacity-10 ${runner.status === "ACTIVE" ? "bg-green-100" : runner.status === "SUSPENDED" ? "bg-yellow-100" : "bg-red-100"}`}
                            >
                              {runner.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {runner.selectionId}
                        </div>
                      </div>

                      {/* Odds Display */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Back Odds */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-green-700">
                              BACK
                            </span>
                            <span className="text-xs text-green-600">
                              Size: {runner.back?.size || 0}
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">
                              {formatPrice(runner.back?.price || null)}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              {runner.back?.line
                                ? `Line: ${runner.back.line}`
                                : "No Line"}
                            </div>
                          </div>
                          <button
                            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!runner.back?.price}
                          >
                            {runner.back?.price
                              ? `Back @ ${formatPrice(runner.back.price)}`
                              : "No Odds"}
                          </button>
                        </div>

                        {/* Lay Odds */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-red-700">
                              LAY
                            </span>
                            <span className="text-xs text-red-600">
                              Size: {runner.lay?.size || 0}
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-700">
                              {formatPrice(runner.lay?.price || null)}
                            </div>
                            <div className="text-xs text-red-600 mt-1">
                              {runner.lay?.line
                                ? `Line: ${runner.lay.line}`
                                : "No Line"}
                            </div>
                          </div>
                          <button
                            className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!runner.lay?.price}
                          >
                            {runner.lay?.price
                              ? `Lay @ ${formatPrice(runner.lay.price)}`
                              : "No Odds"}
                          </button>
                        </div>
                      </div>

                      {/* Market Info */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            Bet Delay: {market.marketCondition?.betDelay || 0}s
                          </span>
                          <span>
                            Volume: {market.marketCondition?.volume || 0}
                          </span>
                          <span>MTP: {market.marketCondition?.mtp || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Market Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Market ID: {market.marketId}</span>
                    <span>Last Updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connection Status Bar */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${socketConnected ? "animate-pulse bg-green-500" : "bg-red-500"}`}
              ></div>
              <div>
                <p className="font-medium text-gray-700">
                  WebSocket Connection
                </p>
                <p className="text-sm text-gray-500">
                  {socketConnected
                    ? "Connected to live updates server"
                    : "Disconnected - manual refresh required"}
                </p>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Markets: </span>
              <span className="font-semibold text-blue-600">
                {markets.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
