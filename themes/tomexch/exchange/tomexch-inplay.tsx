"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Radio,
  Trophy,
  Volleyball,
  CircleDot,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { TomexchMarketSection } from "./tomexch-market-table";

/**
 * TomExch IN-PLAY content — the same live-odds match sections the TomExch home
 * page uses (TomexchMarketSection), but filtered to matches currently in play.
 * One self-hiding section per admin-enabled sport; a single empty state shows
 * once every section reports it has nothing live. Presentation/wiring reuse
 * only — odds, live updates and bet behaviour are identical to the home rows.
 */

interface SportSection {
  eventTypeId: string;
  title: string;
  slug: string;
  icon: LucideIcon;
}

// Same main sports the home page surfaces, in the same order — each gated by
// the admin sports list below.
const SECTIONS: SportSection[] = [
  { eventTypeId: "4", title: "Cricket", slug: "cricket", icon: Trophy },
  { eventTypeId: "1", title: "Soccer", slug: "soccer", icon: Volleyball },
  { eventTypeId: "2", title: "Tennis", slug: "tennis", icon: CircleDot },
  { eventTypeId: "500", title: "Election", slug: "politics", icon: Flag },
];

export function TomexchInPlay() {
  const { data: sports = [] } = useLiveSportsList();

  const activeIds = useMemo(
    () => new Set(sports.map((s) => String(s.id))),
    [sports],
  );

  // Until the list loads, render every section optimistically — each one
  // self-empties when it has no live matches, so showing all costs nothing.
  const visibleSections =
    activeIds.size === 0
      ? SECTIONS
      : SECTIONS.filter((s) => activeIds.has(s.eventTypeId));

  // Track which sports actually have live rows so a single accurate empty state
  // can show when everything is quiet. Stable per-sport setter → no effect churn.
  const [contentBySport, setContentBySport] = useState<Record<string, boolean>>(
    {},
  );
  const handleHasContent = useCallback((eventTypeId: string, has: boolean) => {
    setContentBySport((prev) =>
      prev[eventTypeId] === has ? prev : { ...prev, [eventTypeId]: has },
    );
  }, []);

  const anyContent = Object.values(contentBySport).some(Boolean);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--tx-bg)]">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
        {/* Page header — live blinking dot + title. */}
        <div className="flex items-center gap-2.5 bg-[var(--tx-section)] px-3 py-2.5 text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <Radio className="h-4.5 w-4.5" />
          <h1 className="text-[15px] font-bold tracking-wide">IN-PLAY</h1>
          <span className="text-[12px] font-medium text-white/70">
            Live events across all sports
          </span>
        </div>

        <div className="pt-2">
          {visibleSections.map((s) => (
            <TomexchMarketSection
              key={s.eventTypeId}
              title={s.title}
              icon={s.icon}
              sport={s.slug}
              eventTypeId={s.eventTypeId}
              seeAllHref={`/sports/${s.slug}`}
              maxMatches={20}
              inPlayOnly
              onHasContent={(has) => handleHasContent(s.eventTypeId, has)}
            />
          ))}
        </div>

        {/* Empty state — only once every section has reported "no content", so we
            never flash it before the live data paints. */}
        {!anyContent && (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tx-section)]/10">
              <Radio className="h-6 w-6 text-[var(--tx-section)]" />
            </div>
            <p className="font-semibold text-slate-700">
              No live events right now
            </p>
            <p className="mt-1 text-sm text-slate-400">
              In-play matches will appear here the moment they go live.
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
