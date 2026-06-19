"use client";

import { useRedeclareMarkets } from "@/hooks/useOwner";
import { usePermissions } from "@/contexts/PermissionContext";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

type RedeclareRow = {
  match_id: number;
  market_id: string;
  market_name: string | null;
  event_name: string | null;
  deleted_count: number;
  last_deleted_at: string | null;
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

function RedeclareContent() {
  const { data, isLoading } = useRedeclareMarkets(true);
  const rows: RedeclareRow[] = data?.data || [];
  const marketCount = data?.count ?? rows.length;
  const totalDeleted = rows.reduce((sum, r) => sum + (r.deleted_count || 0), 0);

  const handleRedeclare = (row: RedeclareRow) => {
    // No-op for now — wiring comes later.
    toast.message(
      `Redeclare requested for "${row.market_name || row.market_id}" (not yet implemented)`
    );
  };

  return (
    <div className="min-h-screen bg-[#efefef] p-3">
      <div className="mb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Redeclare</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Markets that had transactions deleted <span className="font-semibold">after</span> the
          result was declared. {marketCount > 0 ? (
            <>
              <span className="font-semibold text-red-600">{marketCount}</span> market(s) ·{" "}
              <span className="font-semibold text-red-600">{totalDeleted}</span> transaction(s)
              deleted.
            </>
          ) : (
            "None right now."
          )}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-gray-500 gap-2">
            <Spinner size={18} /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-base text-gray-500">
            No markets have transactions deleted after declare.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Event</th>
                  <th className="px-3 py-2 text-left">Market</th>
                  <th className="px-3 py-2 text-right">Deleted Txns</th>
                  <th className="px-3 py-2 text-left">Last Deleted</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={`${r.match_id}-${r.market_id}`} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {r.event_name || `Event ${r.match_id}`}
                      <div className="text-xs text-gray-400 font-mono">ID: {r.match_id}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {r.market_name || r.market_id}
                      <div className="text-xs text-gray-400 font-mono">{r.market_id}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                        {r.deleted_count}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {fmtDate(r.last_deleted_at)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleRedeclare(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Redeclare
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RedeclarePage() {
  const { hasAny } = usePermissions();
  const allowed = hasAny([
    "transaction_management.view",
    "transaction_management.delete",
  ]);
  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          You don't have permission to view this page.
        </div>
      </div>
    );
  }
  return <RedeclareContent />;
}
