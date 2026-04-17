"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLiveMarketsBets, useLiveMarketsBetLog } from "@/hooks/useOwner";
import { ArrowLeft, Info, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MARKET_TYPE_LABELS: Record<number, string> = {
  0: "Match Odds",
  1: "Tied Match",
  2: "Complete Match",
  3: "Bookmaker",
  4: "Fancy",
};

function fmtNum(v: string | number | null | undefined) {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? "0.00" : n.toFixed(2);
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

// ── Transaction Log Modal ─────────────────────────────────────────────────────
function TransactionLogModal({
  transactionId,
  onClose,
}: {
  transactionId: string;
  onClose: () => void;
}) {
  const { data: log, isLoading, isError } = useLiveMarketsBetLog(transactionId);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Transaction Log</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-center py-8 text-sm text-red-500">Failed to load log.</p>
        )}

        {!isLoading && !isError && !log && (
          <p className="text-center py-8 text-sm text-gray-400">
            No log entry found for this transaction.
          </p>
        )}

        {log && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <LogRow label="IP Address"     value={log.ip_address} />
            <LogRow label="Country"        value={log.country} />
            <LogRow label="City"           value={log.city} />
            <LogRow label="Device Type"    value={log.device_type} />
            <LogRow label="Device Brand"   value={log.device_brand} />
            <LogRow label="Device Model"   value={log.device_model} />
            <LogRow label="Browser"        value={log.browser} />
            <LogRow label="Browser Ver."   value={log.browser_version} />
            <LogRow label="OS"             value={log.os} />
            <LogRow label="OS Version"     value={log.os_version} />
            <LogRow label="Logged At"      value={fmtDate(log.added_date)} />
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400">User Agent</p>
              <p className="font-medium text-gray-900 text-xs break-all">
                {log.user_agent ?? "—"}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LogRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 truncate">{value ?? "—"}</span>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AllBetsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AllBetsContent />
    </Suspense>
  );
}

type Filters = {
  user: string;
  whitelabel: string;
  market: string;
  marketType: string;  // "" | "0".."4"
  selection: string;
  type: string;        // "" | "back" | "lay"
};

const EMPTY_FILTERS: Filters = {
  user: "", whitelabel: "", market: "", marketType: "",
  selection: "", type: "",
};

function AllBetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const [logBetId, setLogBetId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const { data: bets, isLoading, isError, isFetching, refetch } =
    useLiveMarketsBets(matchId);

  const betList: any[] = Array.isArray(bets) ? bets : [];

  // Unique values for dropdown filters — derived from the current bet list.
  const uniqueWhitelabels = useMemo(
    () => Array.from(new Set(betList.map((b) => b.whitelabel_name).filter(Boolean))).sort(),
    [betList],
  );
  const uniqueMarkets = useMemo(
    () => Array.from(new Set(betList.map((b) => b.market_name).filter(Boolean))).sort(),
    [betList],
  );
  const uniqueSelections = useMemo(
    () => Array.from(new Set(betList.map((b) => b.selection_name).filter(Boolean))).sort(),
    [betList],
  );
  const uniqueMarketTypes = useMemo(
    () => Array.from(new Set(betList.map((b) => b.market_type).filter((v) => v !== null && v !== undefined))),
    [betList],
  );

  const filteredBets = useMemo(() => {
    const userQ = filters.user.trim().toLowerCase();

    return betList.filter((bet) => {
      if (userQ && !String(bet.user_name ?? "").toLowerCase().includes(userQ)) return false;
      if (filters.whitelabel && bet.whitelabel_name !== filters.whitelabel) return false;
      if (filters.market     && bet.market_name     !== filters.market)     return false;
      if (filters.selection  && bet.selection_name  !== filters.selection)  return false;
      if (filters.marketType !== "" && Number(bet.market_type) !== Number(filters.marketType)) return false;
      if (filters.type === "back" && Number(bet.bet_type) !== 0) return false;
      if (filters.type === "lay"  && Number(bet.bet_type) !== 1) return false;
      return true;
    });
  }, [betList, filters]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const columns = [
    { key: "user",        label: "Username",    width: "min-w-[110px]" },
    { key: "whitelabel",  label: "Whitelabel",  width: "min-w-[110px]" },
    { key: "market",      label: "Market",      width: "min-w-[140px]" },
    { key: "market_type", label: "Market Type", width: "min-w-[100px]" },
    { key: "selection",   label: "Selection",   width: "min-w-[120px]" },
    { key: "stake",       label: "Stake",       width: "min-w-[80px]"  },
    { key: "odds",        label: "Odds",        width: "min-w-[70px]"  },
    { key: "pot_return",  label: "Pot. Return", width: "min-w-[100px]" },
    { key: "placed",      label: "Placed At",   width: "min-w-[150px]" },
    { key: "info",        label: "",            width: "w-[56px]"      },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-xl font-bold">All Bets</h1>
          {betList.length > 0 && (
            <span className="text-xs bg-[#174b73] text-white px-2 py-0.5 rounded-full">
              {filteredBets.length === betList.length
                ? betList.length
                : `${filteredBets.length} / ${betList.length}`}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {!matchId && (
        <div className="text-center py-16 text-gray-400">
          No match specified.
        </div>
      )}

      {matchId && isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {matchId && isError && !isLoading && (
        <div className="text-center py-16 text-red-500">
          Failed to load bets.{" "}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {matchId && !isLoading && !isError && betList.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No bets placed on this match yet.
        </div>
      )}

      {matchId && betList.length > 0 && (
        <>
          {/* ── Filter bar ───────────────────────────────────────────── */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 text-[11px] bg-[#174b73] text-white px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </h2>
              <button
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              <FilterField label="Username">
                <input
                  type="text"
                  value={filters.user}
                  onChange={(e) => setFilter("user", e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#174b73]"
                />
              </FilterField>

              <FilterField label="Whitelabel">
                <select
                  value={filters.whitelabel}
                  onChange={(e) => setFilter("whitelabel", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#174b73] bg-white"
                >
                  <option value="">All</option>
                  {uniqueWhitelabels.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Market">
                <select
                  value={filters.market}
                  onChange={(e) => setFilter("market", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#174b73] bg-white"
                >
                  <option value="">All</option>
                  {uniqueMarkets.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Market Type">
                <select
                  value={filters.marketType}
                  onChange={(e) => setFilter("marketType", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#174b73] bg-white"
                >
                  <option value="">All</option>
                  {uniqueMarketTypes.map((v) => (
                    <option key={String(v)} value={String(v)}>
                      {MARKET_TYPE_LABELS[v as number] ?? String(v)}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Selection">
                <select
                  value={filters.selection}
                  onChange={(e) => setFilter("selection", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#174b73] bg-white"
                >
                  <option value="">All</option>
                  {uniqueSelections.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Type">
                <select
                  value={filters.type}
                  onChange={(e) => setFilter("type", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#174b73] bg-white"
                >
                  <option value="">All</option>
                  <option value="back">Back</option>
                  <option value="lay">Lay</option>
                </select>
              </FilterField>

            </div>
          </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#174b73] text-white">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "px-3 py-2.5 text-left font-semibold whitespace-nowrap",
                        c.width
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBets.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-10 text-gray-400 text-sm">
                      No bets match the current filters.
                    </td>
                  </tr>
                )}
                {filteredBets.map((bet) => {
                  const isBack    = bet.bet_type === 0;
                  const stake     = parseFloat(bet.stake ?? 0);
                  const odds      = parseFloat(bet.odds ?? 0);
                  const potReturn = parseFloat(bet.potential_return ?? 0);
                  return (
                    <tr
                      key={bet.id}
                      className={cn(
                        "border-t border-gray-100 transition-colors hover:brightness-95",
                        isBack ? "bg-blue-300 text-gray-800" : "bg-pink-300 text-gray-800"
                      )}
                    >
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">
                        {bet.user_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {bet.whitelabel_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {bet.market_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {MARKET_TYPE_LABELS[bet.market_type] ?? bet.market_type ?? "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {bet.selection_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">
                        ₹{fmtNum(stake)}
                      </td>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">
                        {odds.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        ₹{fmtNum(potReturn)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {fmtDate(bet.matched_at)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => setLogBetId(bet.id)}
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-black/10 transition-colors"
                          aria-label="Transaction log"
                          title="Transaction log"
                        >
                          <Info className="h-4 w-4 text-gray-700" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {logBetId && (
        <TransactionLogModal
          transactionId={logBetId}
          onClose={() => setLogBetId(null)}
        />
      )}
    </div>
  );
}
