"use client";

import { useState, useEffect } from "react";
import {
  useDeleteCustomMarket,
  useListCustomMarkets,
} from "@/hooks/useOwner";
import {
  EditCustomMarketModal,
  ManageMarketPriceModal,
} from "@/components/owner/custom-market-modals";

// ─── Spinner ───
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function CustomMarketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingMarket, setEditingMarket] = useState<any>(null);
  const [managingMarket, setManagingMarket] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const deleteCustom = useDeleteCustomMarket();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: customMarkets, isLoading } = useListCustomMarkets({
    search: debouncedSearch || undefined,
    status: statusFilter,
  });

  const handleDelete = (market: any) => {
    if (!confirm(`Delete custom market "${market.marketName}"?`)) return;
    deleteCustom.mutate(market.marketId);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Custom Market Management</h1>
        <p className="text-gray-600 mt-1">
          Manage prices and settings for existing custom markets. To create a new custom market, open the event under
          Sports Games → Competitions → Events → Market Management.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by market name, event name, team name, event ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "active", "inactive"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Markets List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={24} /></div>
      ) : !customMarkets || customMarkets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? "No custom markets found matching your search" : "No custom markets yet. Create one from the event's Market Management page."}
        </div>
      ) : (
        <div className="space-y-2">
          {customMarkets.map((market: any) => (
            <div key={market.marketId} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 text-sm">{market.marketName}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${market.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {market.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                      {market.marketType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Event: <span className="font-medium text-gray-600">{market.eventName}</span>
                    <span className="mx-1.5 text-gray-300">|</span>
                    Event ID: <span className="font-mono text-gray-600">{market.eventId}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Runners: {(market.runners || []).map((r: any) => r.name).join(", ")}
                    <span className="mx-1.5 text-gray-300">|</span>
                    Min: {market.minBet || "-"} / Max: {market.maxBet || "-"} / Delay: {market.betDelay ?? 0}s
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {/* <button onClick={() => setEditingMarket(market)}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">Edit</button> */}
                  <button onClick={() => setManagingMarket(market)}
                    className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium">Manage Prices</button>
                  {/* <button onClick={() => handleDelete(market)} disabled={deleteCustom.isPending}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50">Delete</button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {editingMarket && <EditCustomMarketModal market={editingMarket} onClose={() => setEditingMarket(null)} />}
      {managingMarket && <ManageMarketPriceModal market={managingMarket} onClose={() => setManagingMarket(null)} />}
    </div>
  );
}
