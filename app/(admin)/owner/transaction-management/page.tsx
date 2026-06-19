"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ownerApi } from "@/lib/api";
import { usePermissions } from "@/contexts/PermissionContext";
import { toast } from "sonner";

// ─── Types ───
type EventResult = {
  eventId: string;
  name: string;
  seriesName?: string;
  sportName?: string;
};

type Txn = {
  id: string;
  match_id: number;
  market_id: string;
  market_name: string | null;
  market_type: number;
  selection_id: number;
  selection_name: string | null;
  bet_type: number;
  stake: string;
  odds: string;
  status: string;
  settled_amount: string | null;
  matched_at: string | null;
  added_date: string | null;
  user_name: string | null;
  user_id: string;
  potential_return: string | null;
  run: number | null;
};

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function fmtDate(s: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

const BET_TYPE_LABEL = (t: number) => (t === 1 ? "LAY" : "BACK");

function TransactionManagementContent() {
  const { has } = usePermissions();
  const canDelete = has("transaction_management.delete");

  // ── Event search ──
  const [eventQuery, setEventQuery] = useState("");
  const [eventResults, setEventResults] = useState<EventResult[]>([]);
  const [searchingEvents, setSearchingEvents] = useState(false);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResult | null>(null);

  // ── Market filter (client-side, applied to the loaded transactions) ──
  const [marketFilter, setMarketFilter] = useState(""); // "" = all markets

  // ── Filters ──
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [source, setSource] = useState<"live" | "declare">("live");

  // ── Results ──
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Delete modal ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [remark, setRemark] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Debounced event search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = eventQuery.trim();
    if (q.length < 2 || (selectedEvent && selectedEvent.name === q)) {
      setEventResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        setSearchingEvents(true);
        const res = await ownerApi.searchEvents(q);
        setEventResults(res.data?.data || []);
        setShowEventDropdown(true);
      } catch {
        setEventResults([]);
      } finally {
        setSearchingEvents(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [eventQuery, selectedEvent]);

  const pickEvent = (ev: EventResult) => {
    setSelectedEvent(ev);
    setEventQuery(ev.name);
    setShowEventDropdown(false);
    setMarketFilter("");
    setTxns([]);
    setLoaded(false);
    setSelected(new Set());
  };

  const loadTransactions = async () => {
    if (!selectedEvent) {
      toast.error("Select an event first");
      return;
    }
    setLoading(true);
    setSelected(new Set());
    setMarketFilter("");
    try {
      const res = await ownerApi.getManagedTransactions({
        matchId: selectedEvent.eventId,
        from: fromDate || undefined,
        to: toDate || undefined,
        source,
      });
      setTxns(res.data?.data || []);
      setLoaded(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load transactions");
      setTxns([]);
    } finally {
      setLoading(false);
    }
  };

  // Distinct markets present in the loaded transactions — powers the filter.
  const distinctMarkets = useMemo(() => {
    const map = new Map<string, string>(); // marketId → marketName
    for (const t of txns) {
      const id = String(t.market_id);
      if (!map.has(id)) map.set(id, t.market_name || id);
    }
    return [...map.entries()].map(([marketId, marketName]) => ({ marketId, marketName }));
  }, [txns]);

  // Transactions after applying the market filter.
  const filteredTxns = useMemo(() => {
    if (!marketFilter) return txns;
    return txns.filter((t) => String(t.market_id) === marketFilter);
  }, [txns, marketFilter]);

  const allSelected =
    filteredTxns.length > 0 && filteredTxns.every((t) => selected.has(t.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const t of filteredTxns) next.delete(t.id);
      } else {
        for (const t of filteredTxns) next.add(t.id);
      }
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedTotal = useMemo(() => {
    let stake = 0;
    for (const t of txns) {
      if (selected.has(t.id)) stake += parseFloat(t.stake || "0");
    }
    return stake;
  }, [txns, selected]);

  const confirmDelete = async () => {
    if (!remark.trim()) {
      toast.error("A delete reason is required");
      return;
    }
    setDeleting(true);
    try {
      const ids = [...selected];
      const res = await ownerApi.deleteManagedTransactions({
        transactionIds: ids,
        remark: remark.trim(),
        source,
      });
      const deleted = res.data?.data?.deleted ?? ids.length;
      toast.success(`${deleted} transaction(s) marked as deleted`);
      // Drop deleted rows from the table.
      setTxns((prev) => prev.filter((t) => !selected.has(t.id)));
      setSelected(new Set());
      setRemark("");
      setShowDeleteModal(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to delete transactions");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efefef] p-3">
      <div className="mb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Transaction Management
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Revert a market by marking its transactions as deleted (soft-delete).
          Rows are kept in the database with the reason you provide and exposure
          is released automatically.
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Event search */}
          <div className="relative">
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              Event
            </label>
            <input
              type="text"
              value={eventQuery}
              onChange={(e) => {
                setEventQuery(e.target.value);
                setSelectedEvent(null);
              }}
              onFocus={() => eventResults.length && setShowEventDropdown(true)}
              placeholder="Search event by name or ID..."
              className="w-full px-2 py-1.5 text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchingEvents && (
              <span className="absolute right-2 top-8 text-gray-400">
                <Spinner size={14} />
              </span>
            )}
            {showEventDropdown && eventResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                {eventResults.map((ev) => (
                  <button
                    key={ev.eventId}
                    onClick={() => pickEvent(ev)}
                    className="block w-full text-left px-3 py-2 text-base hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-800 truncate">{ev.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {ev.seriesName ? `${ev.seriesName} · ` : ""}ID: {ev.eventId}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* From / To */}
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              From (date &amp; time)
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2 py-1.5 text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              To (date &amp; time)
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2 py-1.5 text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          {/* Source toggle */}
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600 font-semibold">Source:</span>
            <div className="inline-flex rounded overflow-hidden border border-gray-300">
              <button
                onClick={() => setSource("live")}
                className={`px-3 py-1 ${source === "live" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              >
                Live
              </button>
              <button
                onClick={() => setSource("declare")}
                className={`px-3 py-1 border-l border-gray-300 ${source === "declare" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              >
                Declared
              </button>
            </div>
          </div>

          <button
            onClick={loadTransactions}
            disabled={loading}
            className="px-4 py-1.5 text-base bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading && <Spinner size={14} />}
            Load Transactions
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {loaded && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-base text-gray-700">
                <span className="font-semibold">{filteredTxns.length}</span> transaction(s)
                {marketFilter && (
                  <span className="text-gray-400"> of {txns.length}</span>
                )}
                {selected.size > 0 && (
                  <span className="ml-2 text-blue-700">
                    · {selected.size} selected · stake {selectedTotal.toFixed(2)}
                  </span>
                )}
              </div>
              {/* Filter by market (id or name) */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-600">Market:</span>
                <select
                  value={marketFilter}
                  onChange={(e) => setMarketFilter(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[260px]"
                >
                  <option value="">All markets ({txns.length})</option>
                  {distinctMarkets.map((m) => (
                    <option key={m.marketId} value={m.marketId}>
                      {m.marketName} ({m.marketId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={selected.size === 0}
                className="px-3 py-1.5 text-base bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                Delete Selected ({selected.size})
              </button>
            )}
          </div>

          {filteredTxns.length === 0 ? (
            <div className="p-8 text-center text-base text-gray-500">
              No transactions found for this event and time range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-2 py-2 text-left">User</th>
                    <th className="px-2 py-2 text-left">Market</th>
                    <th className="px-2 py-2 text-left">Selection</th>
                    <th className="px-2 py-2 text-left">Type</th>
                    <th className="px-2 py-2 text-right">Stake</th>
                    <th className="px-2 py-2 text-right">Odds</th>
                    <th className="px-2 py-2 text-right">P. Return</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTxns.map((t) => {
                    const isSel = selected.has(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={isSel ? "bg-red-50" : "hover:bg-gray-50"}
                      >
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleOne(t.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-1.5 font-medium text-gray-800">
                          {t.user_name || "-"}
                        </td>
                        <td className="px-2 py-1.5 text-gray-600 max-w-[160px] truncate">
                          {t.market_name || t.market_id}
                        </td>
                        <td className="px-2 py-1.5 text-gray-600 max-w-[160px] truncate">
                          {t.selection_name || t.selection_id}
                          {t.run != null && t.market_type === 4 ? ` @ ${t.run}` : ""}
                        </td>
                        <td className="px-2 py-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                              t.bet_type === 1
                                ? "bg-pink-100 text-pink-700"
                                : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {BET_TYPE_LABEL(t.bet_type)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">{t.stake}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{t.odds}</td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {t.potential_return ?? "-"}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">
                          {fmtDate(t.added_date || t.matched_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Delete {selected.size} transaction(s)
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              These transactions will be marked as deleted (not removed) and the
              affected users' exposure will be recalculated. This reason is
              stored on each transaction and is also set as the
              <span className="font-semibold"> market notice</span> shown to
              users on the match page for each affected market.
            </p>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              Reason / Remark <span className="text-red-500">*</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={500}
              rows={3}
              autoFocus
              placeholder="e.g. 'Wrong odds pushed on this market — reverting all bets'"
              className="w-full px-2 py-1.5 text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 resize-y"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-3 py-1.5 text-base bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting || !remark.trim()}
                className="px-3 py-1.5 text-base bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <Spinner size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionManagementPage() {
  const { hasAny } = usePermissions();
  const allowed = hasAny([
    "transaction_management.view",
    "transaction_management.delete",
  ]);
  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="rounded-md border border-border bg-card p-6 text-center text-base text-muted-foreground">
          You don't have permission to manage transactions.
        </div>
      </div>
    );
  }
  return <TransactionManagementContent />;
}
