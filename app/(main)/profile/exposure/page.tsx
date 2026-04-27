"use client";

import { ArrowLeft, AlertCircle, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExposureUsage, type ExposureUsageRow } from "@/hooks/useUserQueries";
import { formatBalance } from "@/lib/format-balance";

function rowLabels(row: ExposureUsageRow) {
  if (row.intFlag === 1) {
    return {
      eventLabel: row.shiftName || "Matka Shift",
      marketLabel: "Matka",
    };
  }
  return {
    eventLabel: row.eventName || "—",
    marketLabel: row.marketName || "—",
  };
}

export default function ExposureUsagePage() {
  const router = useRouter();
  const { data: rows = [], isLoading, isError } = useExposureUsage();

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-2">
      <div className="pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 lg:mb-4">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <TrendingDown className="w-5 h-5 text-rose-500 shrink-0" />
            <h1 className="text-gray-900 font-bold text-base sm:text-lg truncate">
              Exposure Usage
            </h1>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 rounded bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="bg-white rounded-lg border border-rose-200 shadow-sm p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
            <p className="text-gray-800 font-semibold">
              Could not load exposure
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Please try again in a moment.
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center">
            <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No active exposure</p>
            <p className="text-gray-400 text-sm mt-1">
              Place a bet to see your exposure usage here.
            </p>
          </div>
        )}

        {/* Data — table on sm+, cards on mobile */}
        {!isLoading && !isError && rows.length > 0 && (
          <>
            {/* Mobile: card list */}
            <div className="sm:hidden space-y-2">
              {rows.map((row, i) => {
                const { eventLabel, marketLabel } = rowLabels(row);
                const amt = Math.abs(parseFloat(row.limitUse || "0"));
                return (
                  <div
                    key={`${row.marketId ?? row.shiftId ?? i}`}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                          Event
                        </p>
                        <p className="text-sm font-bold text-gray-900 break-words">
                          {eventLabel}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mt-2">
                          Market
                        </p>
                        <p className="text-sm font-medium text-gray-700 break-words">
                          {marketLabel}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                          Exposure
                        </p>
                        <p className="text-base font-bold text-rose-600">
                          ₹{formatBalance(String(amt)).inr}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#142969] text-white text-[13px] font-bold uppercase tracking-wide">
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">
                      Event
                    </th>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap">
                      Market
                    </th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">
                      Exposure
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const { eventLabel, marketLabel } = rowLabels(row);
                    const amt = Math.abs(parseFloat(row.limitUse || "0"));
                    const zebra = i % 2 === 0 ? "bg-white" : "bg-gray-50";
                    return (
                      <tr
                        key={`${row.marketId ?? row.shiftId ?? i}`}
                        className={`${zebra} text-gray-800 border-t border-gray-100 hover:bg-blue-50/40 transition-colors`}
                      >
                        <td className="px-3 py-2.5 text-[14px] font-bold align-top">
                          <span className="block break-words">
                            {eventLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[14px] font-medium text-gray-700 align-top">
                          <span className="block break-words">
                            {marketLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[14px] font-bold text-right text-rose-600 whitespace-nowrap align-top">
                          ₹{formatBalance(String(amt)).inr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
