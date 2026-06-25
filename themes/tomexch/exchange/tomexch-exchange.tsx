"use client";

import { useMemo } from "react";
import { Trophy, Volleyball, CircleDot, Flag, type LucideIcon } from "lucide-react";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { TomexchBanner } from "./tomexch-banner";
import { TomexchQuickAccess } from "./tomexch-quick-access";
import {
  TomexchRacingStrip,
  HORSE_RACING_COUNTRIES,
  GREYHOUND_COUNTRIES,
} from "./tomexch-racing-strip";
import { TomexchMarketSection } from "./tomexch-market-table";

/**
 * TomExch exchange HOME content — the reference main column: the admin-managed
 * home banners (shared with the Default theme, in the reference carousel style),
 * the Today's Horse / Greyhound racing strips, then a live odds section per main
 * sport. Sections only render for sports the owner has enabled (admin-driven via
 * the public sports list), so a disabled sport disappears here too. All data
 * comes from existing hooks — presentation only.
 */

interface SportSection {
  eventTypeId: string;
  title: string;
  slug: string;
  icon: LucideIcon;
}

// Main sports surfaced as home sections (in this order), each gated by the
// admin sports list below.
const SECTIONS: SportSection[] = [
  { eventTypeId: "4", title: "Cricket", slug: "cricket", icon: Trophy },
  { eventTypeId: "1", title: "Soccer", slug: "soccer", icon: Volleyball },
  { eventTypeId: "2", title: "Tennis", slug: "tennis", icon: CircleDot },
  { eventTypeId: "500", title: "Election", slug: "politics", icon: Flag },
];

export function TomexchExchange() {
  const { data: sports = [] } = useLiveSportsList();

  const activeIds = useMemo(
    () => new Set(sports.map((s) => String(s.id))),
    [sports],
  );

  // Until the list loads, show the sections optimistically (matches the Default
  // home, which also renders them and lets each section self-empty).
  const visibleSections =
    activeIds.size === 0
      ? SECTIONS
      : SECTIONS.filter((s) => activeIds.has(s.eventTypeId));

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--tx-bg)]">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
        {/* Same admin-configured home banners as the Default theme, in the
            reference carousel style (arrows + dots). */}
        <div className="py-2">
          <TomexchBanner />
        </div>

        {/* Mobile-only: Exchange/Casino tabs + sport quick-access grid (same as
            the Default theme's mobile home). */}
        <TomexchQuickAccess />

        <TomexchRacingStrip
          title="Today's Horse Racing"
          emoji="🐎"
          href="/sports/horse-racing"
          countries={HORSE_RACING_COUNTRIES}
        />
        <TomexchRacingStrip
          title="Today's Greyhound Racing"
          emoji="🐕"
          href="/sports/greyhound-racing"
          countries={GREYHOUND_COUNTRIES}
        />

        {visibleSections.map((s) => (
          <TomexchMarketSection
            key={s.eventTypeId}
            title={s.title}
            icon={s.icon}
            sport={s.slug}
            eventTypeId={s.eventTypeId}
            seeAllHref={`/sports/${s.slug}`}
            maxMatches={4}
          />
        ))}

        <div className="h-4" />
      </div>
    </div>
  );
}
