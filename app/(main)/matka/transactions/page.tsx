"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMatkaMyBets } from "@/hooks/useMatkaApi";
import { ArrowLeft, Receipt, Calendar } from "lucide-react";

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

export default function MatkaTransactionsPage() {
  const router = useRouter();
  const { data: transactions = [], isLoading } = useMatkaMyBets() as {
    data: MatkaTransaction[];
    isLoading: boolean;
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
            <p className="text-white/40 text-[10px] mt-0.5">
              Your bet history
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Transactions List */}
      {!isLoading && transactions.length > 0 && (
        <div className="p-4 space-y-2">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 font-bold text-sm">
                    {txn.shiftName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(txn.transactionDate)}</span>
                    <span>·</span>
                    <span>{formatTime(txn.addedDate)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-bold text-sm">
                    ₹{Number(txn.totalAmount).toFixed(2)}
                  </p>
                  {Number(txn.totalCommission) > 0 && (
                    <p className="text-gray-400 text-[10px] mt-0.5">
                      Comm: ₹{Number(txn.totalCommission).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
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
    </div>
  );
}
