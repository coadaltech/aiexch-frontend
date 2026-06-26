"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSeries } from "@/hooks/useSportsApi";
import type { Series, Match } from "@/components/sports/types";
import { SPORTS_WITHOUT_DATE_FILTER } from "@/lib/sports-config";
import { sportHref } from "@/lib/sports-nav";

/**
 * Headless drill-down logic shared by every theme's sidebar so a sport opens the
 * same competition → match dropdown regardless of the active theme (this mirrors
 * the Default theme's `SportAccordionItem`). Themes only provide the markup; all
 * fetching, filtering, sorting and expand state lives here.
 */

export interface DrilldownMatch {
  id: string;
  name: string;
  team1?: string;
  team2?: string;
}

export interface DrilldownSeries {
  id: string;
  name: string;
  matches: DrilldownMatch[];
}

/** Filter to upcoming events, sort by start time and split team names — the
 *  exact rules the Default sidebar applies under each competition. */
function processMatches(series: Series, eventTypeId: string): DrilldownMatch[] {
  if (!series.matches || series.matches.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seriesNameLower = series.name?.toLowerCase().trim() || "";
  // Cricket & Election show every event regardless of date.
  const skipDateFilter = SPORTS_WITHOUT_DATE_FILTER.has(eventTypeId);

  const upcoming = series.matches.filter((match: Match) => {
    if (skipDateFilter) return true;
    const matchName = (match.event?.name || (match as any).name || "")
      .toLowerCase()
      .trim();
    if (seriesNameLower && matchName === seriesNameLower) return true;
    const openDate = match.event?.openDate || (match as any).openDate;
    if (!openDate) return true;
    return new Date(openDate) >= today;
  });

  const sorted = [...upcoming].sort((a: Match, b: Match) => {
    const dateA = new Date(a.event?.openDate || (a as any).openDate || 0).getTime();
    const dateB = new Date(b.event?.openDate || (b as any).openDate || 0).getTime();
    return dateA - dateB;
  });

  return sorted.map((match: Match) => {
    const id =
      match.event?.id || (match as any).id || (match as any).bfid || "";
    const name =
      match.event?.name ||
      (match as any).name ||
      (match as any).eventName ||
      (match as any).matchName ||
      (match as any).selections ||
      "Unknown Match";
    const parts = name.split(/ v | vs /i);
    return { id: String(id), name, team1: parts[0]?.trim(), team2: parts[1]?.trim() };
  });
}

export function useSportDrilldown(sport: {
  id: string;
  name: string;
  isLive?: boolean;
}) {
  const pathname = usePathname();
  const base = sportHref(sport); // e.g. "/sports/cricket"

  const isActive = pathname === base || pathname.startsWith(`${base}/`);

  const [expanded, setExpanded] = useState(false);
  const [openSeries, setOpenSeries] = useState<string[]>([]);

  // Open the sport when its page is the current route.
  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const { data: seriesData = [], isLoading } = useSeries(sport.id, expanded);

  const series: DrilldownSeries[] = useMemo(
    () =>
      (seriesData as Series[]).map((s) => ({
        id: s.id,
        name: s.name,
        matches: processMatches(s, sport.id),
      })),
    [seriesData, sport.id],
  );

  // Open the competition that matches the current route.
  useEffect(() => {
    if (!expanded || series.length === 0) return;
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "sports" && segments.length >= 3) {
      const seriesId = segments[2];
      setOpenSeries((prev) =>
        prev.includes(seriesId) ? prev : [...prev, seriesId],
      );
    }
  }, [expanded, series, pathname]);

  const toggle = useCallback(() => setExpanded((e) => !e), []);
  const toggleSeries = useCallback(
    (id: string) =>
      setOpenSeries((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );

  return {
    expanded,
    toggle,
    isActive,
    isLoading,
    series,
    openSeries,
    toggleSeries,
    competitionHref: (seriesId: string) => `${base}/${seriesId}`,
    matchHref: (seriesId: string, matchId: string) =>
      `${base}/${seriesId}/${matchId}`,
    isSeriesActive: (seriesId: string) =>
      isActive && pathname.includes(`/${seriesId}`),
    isMatchActive: (matchId: string) => pathname.includes(`/${matchId}`),
  };
}
