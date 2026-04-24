"use client";

import { Pin } from "lucide-react";
import { useMultimarkets } from "@/hooks/useMultimarkets";
import { useAuth } from "@/contexts/AuthContext";

export interface PinParent {
  sportId: number | string;
  sportName: string;
  competitionId: number | string;
  competitionName: string;
  eventId: number | string;
  eventName: string;
  openDate?: string | null;
}

interface Props {
  parent: PinParent;
  market: { marketId: string; marketName: string; marketType?: string };
  className?: string;
}

/**
 * Pin icon rendered as a prefix inside each market header. Toggles the
 * market's presence in the caller's `/multimarket` page. Does nothing for
 * logged-out users (hidden).
 */
export function PinMarketButton({ parent, market, className = "" }: Props) {
  const { user } = useAuth();
  const { isPinned, toggle, isMutating } = useMultimarkets();

  if (!user) return null;
  const pinned = isPinned(market.marketId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle({
          sportId: parent.sportId,
          sportName: parent.sportName,
          competitionId: parent.competitionId,
          competitionName: parent.competitionName,
          eventId: parent.eventId,
          eventName: parent.eventName,
          openDate: parent.openDate ?? null,
          marketId: market.marketId,
          marketName: market.marketName,
          marketType: market.marketType || "ODDS",
        });
      }}
      disabled={isMutating}
      title={pinned ? "Unpin market" : "Pin to multimarket"}
      className={`inline-flex items-center justify-center h-5 w-5 rounded transition-colors disabled:opacity-60 disabled:cursor-wait text-amber-400 hover:text-amber-300 ${className}`}
    >
      <Pin
        className="h-3.5 w-3.5"
        fill={pinned ? "currentColor" : "none"}
        strokeWidth={pinned ? 0 : 2}
      />
    </button>
  );
}
