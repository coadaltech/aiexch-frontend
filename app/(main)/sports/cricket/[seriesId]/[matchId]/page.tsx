// app/match/[matchId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [markets, setMarkets] = useState<any[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // ✅ Connect to WebSocket on port 3003
    const socket = io("http://localhost:3003", {
      transports: ["websocket", "polling"],
    });

    console.log("🔌 Connecting to WebSocket at localhost:3003...");

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      setSocketConnected(true);

      // Subscribe to this match
      socket.emit("subscribe-markets", matchId);
      console.log(`📡 Subscribed to match: ${matchId}`);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setSocketConnected(false);
    });

    socket.on("market-update", (data) => {
      console.log("📊 Received market update for:", data.eventId);

      if (data.eventId === matchId) {
        console.log(`✅ Match ${matchId} update received`);
        setMarkets(data.markets);
      }
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [matchId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Match ID: {matchId}
        <span
          className={`ml-2 text-sm ${socketConnected ? "text-green-500" : "text-red-500"}`}
        >
          {socketConnected ? "🟢 Live" : "🔴 Offline"}
        </span>
      </h1>

      {!socketConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            <strong>Note:</strong> WebSocket on port 3003 | HTTP API on port
            3001
          </p>
        </div>
      )}

      {markets.length === 0 ? (
        <div className="text-center py-8">
          {socketConnected ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Waiting for market data...</p>
              <p className="text-sm text-gray-400 mt-2">
                Backend will send data when available
              </p>
            </>
          ) : (
            <>
              <p className="text-red-500">Not connected to WebSocket</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure WebSocket server is running on port 3003
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {markets.map((market) => (
            <div key={market.marketId} className="border p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">{market.marketName}</h3>
              <div className="space-y-2">
                {market.runners.map((runner: any) => (
                  <div
                    key={runner.selectionId}
                    className="flex justify-between items-center border-b py-2"
                  >
                    <span>{runner.name}</span>
                    <div className="flex gap-6">
                      <span className="text-green-600 font-bold">
                        Back: {runner.back || "-"}
                      </span>
                      <span className="text-red-600 font-bold">
                        Lay: {runner.lay || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
