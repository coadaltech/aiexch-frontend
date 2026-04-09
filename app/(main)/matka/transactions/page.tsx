"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useMatkaMyBets,
  useMatkaShifts,
  useDeleteMatka,
  usePlaceMatka,
  useMatkaTransaction,
  MatkaTransactionFull,
} from "@/hooks/useMatkaApi";
import { matkaApi } from "@/lib/api";
import {
  ArrowLeft,
  Receipt,
  Calendar,
  Copy,
  Eye,
  Pencil,
  Trash2,
  Plus,
  LayoutGrid,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { TransactionViewModal } from "./TransactionViewModal";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface MatkaTransaction {
  id: string;
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  transactionDate: string;
  totalAmount: string;
  totalCommission: string;
  finalAmount: string;
  addedDate: string;
  copyReferenceShiftId?: string | null;
  copyReferenceShiftName?: string | null;
  whitelabelId?: string | null;
}

const TODAY = new Date().toISOString().split("T")[0];

// ── Bet Slip Panel (right side) ───────────────────────────────────────────
function BetSlipPanel({
  transactionId,
  onClose,
}: {
  transactionId: string;
  onClose: () => void;
}) {
  const { data: txn, isLoading } = useMatkaTransaction(transactionId);

  return (
    <div className="w-[240px] flex-shrink-0 border-l border-gray-300 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white px-3 py-2 flex items-center justify-between">
        <div>
          <p className="font-bold text-xs uppercase tracking-wide truncate max-w-[160px]">
            {txn?.shiftName ?? "Bet Slip"}
          </p>
          {txn && (
            <p className="text-white/60 text-[10px]">{formatDate(txn.transactionDate)}</p>
          )}
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Column headers */}
      <div className="flex bg-[#e8edf5] text-[#142969] text-[10px] font-bold border-b border-gray-300">
        <span className="flex-1 px-2 py-1 text-center">NUMBER</span>
        <span className="w-20 px-2 py-1 text-right">AMOUNT</span>
      </div>

      {/* Bet rows */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : txn?.details?.length ? (
          <table className="w-full text-xs">
            <tbody>
              {txn.details.map((d, idx) => (
                <tr
                  key={d.id}
                  className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <td className="px-2 py-1.5 font-bold text-gray-900 text-center">{d.number}</td>
                  <td className="px-2 py-1.5 text-[#142969] font-semibold text-right">
                    ₹{Number(d.amount).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-400 text-xs py-8">No details</p>
        )}
      </div>

      {/* Total footer */}
      {txn && (
        <div className="bg-red-700 text-white text-center text-xs font-bold py-1.5">
          Total: ₹{Number(txn.totalAmount).toFixed(2)}
        </div>
      )}
    </div>
  );
}

// ── Copy to Shifts Modal ──────────────────────────────────────────────────
function CopyToShiftsModal({
  txn,
  onClose,
}: {
  txn: MatkaTransaction;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  // derive unique shifts from today's data as the shift list
  // Also use the public shifts endpoint for all active shifts
  const [shiftsForCopy, setShiftsForCopy] = useState<{ id: string; name: string }[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);

  // Load active shifts list on mount
  useEffect(() => {
    matkaApi.getShifts(today).then((res) => {
      const data = res.data?.data ?? [];
      setShiftsForCopy(data.filter((s: any) => s.id !== txn.shiftId));
      setLoadingShifts(false);
    }).catch(() => setLoadingShifts(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [placing, setPlacing] = useState(false);
  const placeMutation = usePlaceMatka();

  const toggleShift = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one shift");
      return;
    }
    setPlacing(true);
    try {
      const res = await matkaApi.getTransaction(txn.id);
      const srcTxn = res.data?.data as MatkaTransactionFull;
      if (!srcTxn?.details?.length) {
        toast.error("No bet data found");
        return;
      }
      const bets = srcTxn.details.map((d) => ({
        number: d.number,
        numberType: d.numberType,
        amount: Number(d.amount),
      }));

      await Promise.all(
        Array.from(selected).map((sid) =>
          placeMutation.mutateAsync({
            shiftId: sid,
            bets,
            copyReferenceShiftId: txn.shiftId,
          })
        )
      );

      toast.success(`Copied to ${selected.size} shift(s)!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to copy bets");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Copy to Shifts</p>
            <p className="text-white/60 text-[11px]">From: {txn.shiftName}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift list */}
        <div className="flex-1 max-h-72 overflow-auto">
          {loadingShifts ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : shiftsForCopy.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No other active shifts available
            </p>
          ) : (
            <>
              {/* Select all */}
              <label className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected.size === shiftsForCopy.length}
                  onChange={() => {
                    if (selected.size === shiftsForCopy.length) {
                      setSelected(new Set());
                    } else {
                      setSelected(new Set(shiftsForCopy.map((s) => s.id)));
                    }
                  }}
                  className="h-4 w-4 rounded accent-[#142969]"
                />
                <span className="text-xs font-semibold text-gray-700">Select All</span>
              </label>
              {shiftsForCopy.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleShift(s.id)}
                    className="h-4 w-4 rounded accent-[#142969]"
                  />
                  <span className="text-sm text-gray-800">{s.name}</span>
                </label>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-2">
          <span className="text-xs text-gray-500 flex-1">
            {selected.size} shift(s) selected
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={placing || selected.size === 0}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#142969] hover:bg-[#1a3578] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? "Copying..." : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function MatkaTransactionsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [filterShiftId, setFilterShiftId] = useState<string>("");

  const { data: transactions = [], isLoading } = useMatkaMyBets({ status }) as {
    data: MatkaTransaction[];
    isLoading: boolean;
  };
  const deleteMutation = useDeleteMatka();

  // Jantri view modal (grid)
  const [jantriViewId, setJantriViewId] = useState<string | null>(null);
  // Bet slip panel (right side)
  const [betSlipId, setBetSlipId] = useState<string | null>(null);
  // Copy modal
  const [copyTxn, setCopyTxn] = useState<MatkaTransaction | null>(null);

  // Load all active shifts for the dropdown (independent of the transaction list)
  const { data: allShifts = [] } = useMatkaShifts();

  const filtered = useMemo(() => {
    if (!filterShiftId) return transactions;
    return transactions.filter((t) => t.shiftId === filterShiftId);
  }, [transactions, filterShiftId]);

  const handleDelete = (txn: MatkaTransaction) => {
    if (!window.confirm(`Delete bet on ${txn.shiftName}? This cannot be undone.`)) return;
    deleteMutation.mutate(txn.id, {
      onSuccess: () => toast.success("Transaction deleted"),
      onError: () => toast.error("Failed to delete transaction"),
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] border-b border-[#1e4088]/40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/matka")}
          className="text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-1 h-5 bg-[#84c2f1] rounded-full" />
          <div>
            <h1 className="text-white font-bold text-sm font-condensed tracking-wide">
              MATKA TRANSACTIONS
            </h1>
            <p className="text-white/40 text-[10px] mt-0.5">Your bet history</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 flex-wrap">
        {/* Shift filter */}
        <div className="relative">
          <select
            value={filterShiftId}
            onChange={(e) => setFilterShiftId(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-[#142969] cursor-pointer min-w-[140px]"
          >
            <option value="">-- ALL SHIFTS --</option>
            {allShifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Active / Inactive toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300 text-xs font-semibold">
          <button
            onClick={() => { setStatus("active"); setFilterShiftId(""); }}
            className={`px-3 py-1.5 transition-colors ${
              status === "active"
                ? "bg-[#142969] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => { setStatus("inactive"); setFilterShiftId(""); }}
            className={`px-3 py-1.5 border-l border-gray-300 transition-colors ${
              status === "inactive"
                ? "bg-[#142969] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Inactive
          </button>
        </div>

        <span className="text-xs text-gray-400 ml-auto">
          {status === "active" ? "Today's bets" : "Previous bets"}
        </span>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Transaction list */}
        <div className="flex-1 overflow-auto">
          {/* Loading */}
          {isLoading && (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* List */}
          {!isLoading && filtered.length > 0 && (
            <div className="p-3 space-y-1.5">
              {filtered.map((txn) => {
                const isToday = txn.transactionDate === TODAY;
                const isViewing = betSlipId === txn.id;
                return (
                  <div
                    key={txn.id}
                    className={`bg-white rounded-lg border shadow-sm px-3 py-2 flex flex-col gap-1 ${
                      isViewing ? "border-[#142969] ring-1 ring-[#142969]/20" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Left: shift name + date */}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-semibold text-sm leading-tight truncate">
                          {txn.shiftName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDate(txn.transactionDate)}</span>
                          <span>·</span>
                          <span>{formatTime(txn.addedDate)}</span>
                        </div>
                        {/* Copy reference tag */}
                        {txn.copyReferenceShiftId && (
                          <div className="mt-1 inline-flex items-center gap-1 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 text-[10px] text-blue-600 font-medium">
                            <Copy className="w-2.5 h-2.5" />
                            Copied from: {txn.copyReferenceShiftName ?? txn.copyReferenceShiftId.slice(0, 8)}
                          </div>
                        )}
                      </div>

                      {/* Right: amount + buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {/* Amount */}
                        <div className="text-right mr-1">
                          <p className="text-gray-900 font-bold text-sm leading-tight">
                            ₹{Number(txn.totalAmount).toFixed(2)}
                          </p>
                          {Number(txn.totalCommission) > 0 && (
                            <p className="text-gray-400 text-[10px]">
                              Comm: ₹{Number(txn.totalCommission).toFixed(2)}
                            </p>
                          )}
                        </div>

                        {/* Copy → opens shift selection modal */}
                        <button
                          onClick={() => setCopyTxn(txn)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>

                        {/* View → bet slip panel */}
                        <button
                          onClick={() => setBetSlipId(isViewing ? null : txn.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium ${
                            isViewing
                              ? "bg-green-600 text-white"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>

                        {/* Edit — today only */}
                        {isToday && (
                          <button
                            onClick={() => router.push(`/matka/${txn.shiftId}?edit=${txn.id}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-xs font-medium"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        )}

                        {/* Delete — today only */}
                        {isToday && (
                          <button
                            onClick={() => handleDelete(txn)}
                            disabled={deleteMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-14 h-14 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mb-3">
                <Receipt className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">No transactions found</p>
              <p className="text-gray-300 text-xs mt-1">
                {status === "active"
                  ? "No bets placed today"
                  : "No previous bets found"}
              </p>
            </div>
          )}
        </div>

        {/* Bet Slip side panel */}
        {betSlipId && (
          <BetSlipPanel transactionId={betSlipId} onClose={() => setBetSlipId(null)} />
        )}
      </div>

      {/* Bottom Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] text-xs flex-wrap">
        <div className="flex-1" />
        {/* Add */}
        <button
          onClick={() => router.push("/matka")}
          className="flex items-center gap-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add (F2)
        </button>
        {/* Jantri View */}
        <button
          onClick={() => {
            if (!betSlipId) {
              toast.info("Select a transaction first (click View)");
              return;
            }
            setJantriViewId(betSlipId);
          }}
          className="flex items-center gap-1.5 bg-[#e6a020] hover:bg-[#d09018] text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Jantri View (F3)
        </button>
      </div>

      {/* Jantri View Modal (grid view) */}
      <TransactionViewModal
        open={!!jantriViewId}
        onClose={() => setJantriViewId(null)}
        transactionId={jantriViewId}
      />

      {/* Copy to Shifts Modal */}
      {copyTxn && (
        <CopyToShiftsModal txn={copyTxn} onClose={() => setCopyTxn(null)} />
      )}
    </div>
  );
}
