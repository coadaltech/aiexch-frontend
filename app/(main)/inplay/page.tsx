"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Flag,
  Radio,
  Target,
  Trophy,
  Volleyball,
} from "lucide-react";
import { CricketMatchesList } from "@/components/sports/cricket-matches-list";
import { useSportsList } from "@/hooks/useSportsList";
import { SPORT_ROUTES } from "@/lib/sports-config";

/* eventTypeId → its route config (sport slug / basePath). Built once from the
   shared SPORT_ROUTES so a single source of truth drives both the URL slug and
   the eventTypeId we subscribe to. */
const ROUTE_BY_EVENT_TYPE: Record<
  string,
  (typeof SPORT_ROUTES)[keyof typeof SPORT_ROUTES]
> = Object.fromEntries(
  Object.values(SPORT_ROUTES).map((c) => [c.eventTypeId, c]),
);

/* Sports that render as a 1 / X / 2 match-odds list (exactly what the home page
   uses CricketMatchesList for). Racing (7, 4339) is a many-runner WIN market
   that doesn't fit this 3-column layout, and manual sports (matka/lottery/…)
   carry no live odds — both are intentionally excluded here. */
const INPLAY_SUPPORTED_EVENT_TYPES = new Set(["4", "1", "2", "500"]);

const ICON_BY_EVENT_TYPE: Record<string, React.ElementType> = {
  "4": Trophy, // Cricket
  "1": Volleyball, // Football / Soccer
  "2": Target, // Tennis
  "500": Flag, // Election
};

export default function InPlayPage() {
  const { data: sportsList } = useSportsList();

  // Active, in-play-capable sports in the owner-defined order. Falls back to a
  // sensible default set on the very first paint (before the list resolves) so
  // the page renders its sections instantly — each section self-hides until it
  // actually has live, priced matches, so showing all of them costs nothing.
  const sports = useMemo(() => {
    const source =
      sportsList && sportsList.length > 0
        ? sportsList
            .filter(
              (s) =>
                s.isActive &&
                s.isLive &&
                INPLAY_SUPPORTED_EVENT_TYPES.has(String(s.id)),
            )
            .map((s) => ({ id: String(s.id), name: s.name }))
        : [...INPLAY_SUPPORTED_EVENT_TYPES].map((id) => ({
            id,
            name: ROUTE_BY_EVENT_TYPE[id]?.title ?? "Sport",
          }));

    return source
      .map((s) => {
        const route = ROUTE_BY_EVENT_TYPE[s.id];
        if (!route) return null;
        return {
          eventTypeId: s.id,
          sport: route.basePath,
          name: s.name,
          icon: ICON_BY_EVENT_TYPE[s.id] ?? Activity,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [sportsList]);

  // Track which sports actually have something to show so we can render a
  // single, accurate empty state when everything is quiet. CricketMatchesList
  // reports this via onHasContent; we keep a stable per-sport setter so the
  // callback identity never changes (no effect churn).
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
    <div className="w-full min-w-0 bg-[#efefef] min-h-full pb-6">
      {/* Page header */}
      <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2.5 border-b border-[#1e4088]/50">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ddc84] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#3ddc84]" />
        </span>
        <Radio className="h-5 w-5" />
        <h1 className="text-base sm:text-lg font-bold font-condensed tracking-wide">
          IN-PLAY
        </h1>
        <span className="text-[10px] sm:text-xs font-medium text-[var(--header-text)]/70">
          Live events across all sports
        </span>
      </div>

      {/* One self-hiding section per sport. Each paints instantly from its
          local cache and streams odds over the shared WebSocket — no spinners,
          no per-section loading. Sections with no live matches render nothing. */}
      {sports.map((s) => {
        const Icon = s.icon;
        return (
          <CricketMatchesList
            key={s.eventTypeId}
            sport={s.sport}
            eventTypeId={s.eventTypeId}
            inPlayOnly
            showHeader={false}
            onHasContent={(has) => handleHasContent(s.eventTypeId, has)}
            wrapper={(content) => (
              <div className="mt-4">
                <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] text-[var(--header-text)] mx-0 sm:mx-4 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-[#1e4088]/50">
                  <div className="flex items-center justify-between py-2 pl-3 pr-0 sm:px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-6 bg-[var(--header-secondary)] rounded-full" />
                      <Icon className="h-4 w-4" />
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold font-condensed tracking-wide uppercase">
                          {s.name}
                        </h2>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--header-secondary)] text-[var(--header-text)]">
                          LIVE
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-white text-[10px] sm:text-xs font-bold font-condensed tracking-wider">
                      <div className="w-16 sm:w-40 md:w-48 text-center">1</div>
                      <div className="w-16 sm:w-40 md:w-48 text-center">X</div>
                      <div className="w-16 sm:w-40 md:w-48 text-center">2</div>
                    </div>
                  </div>
                  <div>{content}</div>
                </div>
              </div>
            )}
          />
        );
      })}

      {/* Empty state — only shown once every section has reported "no content".
          Until the first section reports in, this stays hidden so we never
          flash "no events" before the live data paints. */}
      {!anyContent && (
        <div className="flex flex-col items-center justify-center text-center px-6 py-20">
          <div className="w-14 h-14 rounded-full bg-[var(--header-primary)]/10 flex items-center justify-center mb-4">
            <Radio className="h-6 w-6 text-[var(--header-primary)]" />
          </div>
          <p className="text-gray-700 font-semibold">No live events right now</p>
          <p className="text-gray-400 text-sm mt-1">
            In-play matches will appear here the moment they go live.
          </p>
        </div>
      )}
    </div>
  );
}
