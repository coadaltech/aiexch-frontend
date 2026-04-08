"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMatkaMyBets,
  useDeleteMatka,
} from "@/hooks/useMatkaApi";
import { ArrowLeft, Receipt, Calendar, Copy, Eye, Pencil, Trash2 } from "lucide-react";
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
}

const TODAY = new Date().toISOString().split("T")[0];

export default function MatkaTransactionsPage() {
  const router = useRouter();
  const { data: transactions = [], isLoading } = useMatkaMyBets() as {
    data: MatkaTransaction[];
    isLoading: boolean;
  };
  const deleteMutation = useDeleteMatka();

  const [viewId, setViewId] = useState<string | null>(null);

  const handleCopy = (txn: MatkaTransaction) => {
    sessionStorage.setItem("matka_clipboard", JSON.stringify({ transactionId: txn.id, shiftId: txn.shiftId }));
    toast.success("Copied!");
  };

  const handleDelete = (txn: MatkaTransaction) => {
    if (!window.confirm(`Delete bet on ${txn.shiftName}? This cannot be undone.`)) return;
    deleteMutation.mutate(txn.id, {
      onSuccess: () => toast.success("Transaction deleted"),
      onError: () => toast.error("Failed to delete transaction"),
    });
  };

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] border-b border-[#1e4088]/40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/matka")}
          className="text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-[#84c2f1] rounded-full" />
          <div>
            <h1 className="text-white font-bold text-sm font-condensed tracking-wide">
              MATKA TRANSACTIONS
            </h1>
            <p className="text-white/40 text-[10px] mt-0.5">Your bet history</p>
          </div>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Transactions list */}
      {!isLoading && transactions.length > 0 && (
        <div className="p-3 space-y-1.5">
          {transactions.map((txn) => {
            const isToday = txn.transactionDate === TODAY;
            return (
              <div
                key={txn.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm px-3 py-2 flex items-center gap-3"
              >
                {/* Left: shift name + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm leading-tight truncate">{txn.shiftName}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>{formatDate(txn.transactionDate)}</span>
                    <span>·</span>
                    <span>{formatTime(txn.addedDate)}</span>
                  </div>
                </div>

                {/* Right: amount + buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Amount */}
                  <div className="text-right mr-1">
                    <p className="text-gray-900 font-bold text-sm leading-tight">₹{Number(txn.totalAmount).toFixed(2)}</p>
                    {Number(txn.totalCommission) > 0 && (
                      <p className="text-gray-400 text-[10px]">Comm: ₹{Number(txn.totalCommission).toFixed(2)}</p>
                    )}
                  </div>

                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(txn)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>

                  {/* View */}
                  <button
                    onClick={() => setViewId(txn.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-xs font-medium"
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
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && transactions.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-14 h-14 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mb-3">
            <Receipt className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">No transactions yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Place bets on shifts to see your history
          </p>
        </div>
      )}

      {/* View modal */}
      <TransactionViewModal
        open={!!viewId}
        onClose={() => setViewId(null)}
        transactionId={viewId}
      />
    </div>
  );
}
