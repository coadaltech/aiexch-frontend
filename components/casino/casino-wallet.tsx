"use client";

import { Wallet, TrendingDown } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useLedger } from "@/hooks/useUserQueries";
import { formatBalance } from "@/lib/format-balance";

/**
 * Casino wallet chips — BAL (available limit) + LIAB (exposure).
 *
 * Shown inside the casino pages' own toolbars. The normal exchange header
 * hides its balance/exposure on casino routes (see header.tsx), so this is
 * the in-page replacement matching the reference design.
 *
 * Reads the same `["ledger"]` query the header keeps fresh — the header stays
 * mounted on casino routes and updates that cache from the `ledger` WebSocket
 * (bet placed / settled), so these chips update live without their own poll.
 */
export function CasinoWallet({
  className = "",
  layout = "stack",
}: {
  className?: string;
  /** "stack" = two rows (desktop header); "inline" = one row (mobile header). */
  layout?: "stack" | "inline";
}) {
  const { isLoggedIn, user } = useAuth();
  const { data: ledger, isLoading } = useLedger(isLoggedIn && !user?.isDemo);

  // The `ledger` WebSocket that keeps BAL/EXP live is owned by MainLayout
  // (useLedgerLiveSync) — a component that stays mounted across route changes,
  // so the subscription never drops when entering/leaving a casino game. These
  // chips just read the ["ledger"] cache it keeps fresh.

  if (!isLoggedIn) return null;

  const bal = formatBalance(ledger?.finalLimit ?? "0.00").inr;
  const liab = formatBalance(ledger?.limitConsumed ?? "0.00").inr;

  const inline = layout === "inline";

  return (
    <div
      className={`flex items-start shrink-0 items-center gap-1.5 flex-col gap-2  ${className}`}
    >
      <div className="flex items-center gap-1.5 rounded-md bg-[#1a212b] px-2.5 py-1 ring-1 ring-emerald-500/30">
        <Wallet className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          Bal
        </span>
        <span className="text-xs font-bold tabular-nums text-emerald-300">
          {isLoading ? "…" : bal}
        </span>
      </div>
      <div className="flex items-center gap-1.5 rounded-md bg-[#1a212b] px-2.5 py-1 ring-1 ring-rose-500/30">
        <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          Exp
        </span>
        <span className="text-xs font-bold tabular-nums text-rose-300">
          {isLoading ? "…" : liab}
        </span>
      </div>
    </div>
  );
}
