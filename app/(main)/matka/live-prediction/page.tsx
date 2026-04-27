"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { useMatkaDeclaredHistoryPublic } from "@/hooks/useMatkaApi";
import { formatLocalDateTime } from "@/lib/date-utils";

function formatDateTime(dateStr: string) {
  return formatLocalDateTime(dateStr, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatkaLivePredictionPage() {
  const router = useRouter();
  const { data: declaredHistory = [], isLoading } =
    useMatkaDeclaredHistoryPublic(50);

  return (
    <div className="flex flex-col  bg-gray-50">
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
              DECLARED RESULTS
            </h1>
            <p className="text-white/40 text-[10px] mt-0.5">
              History of previously declared matka numbers
            </p>
          </div>
        </div>
      </div>

      {/* Declared history list */}
      <div className="flex-1 overflow-auto bg-white ">
        <div className="sticky top-0 bg-[#e8edf5] text-[#142969] text-[11px] font-bold border-b border-gray-300 flex items-center">
          <History className="w-3 h-3 ml-3 mr-1.5" />
          <span className="flex-1 px-1 py-2">Previous Declared Numbers</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : declaredHistory.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No declarations yet.
          </div>
        ) : (
          declaredHistory.map((h) => (
            <div
              key={h.id}
              className="flex items-center border-b border-gray-100 text-xs px-4 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium truncate">
                  {h.shift_name ?? "—"}
                </p>
                <p className="text-[10px] text-gray-400">
                  {formatDateTime(h.declared_at)}
                </p>
              </div>
              <span className="ml-2 inline-flex items-center justify-center min-w-[34px] h-7 rounded bg-[#142969] text-white text-xs font-bold">
                {h.runs}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
