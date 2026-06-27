"use client";

import { getSportConfig, isValidSportSlug } from "@/lib/sports-config";
import { useSportsList } from "./useSportsList";

// Racing (Horse / Greyhound) uses a different page layout — flagged so callers
// can branch to the racing list.
const RACING_EVENT_TYPE_IDS = ["7", "4339"];
const DEFAULT_EMPTY = "No live matches at the moment.";

export type SportResolutionStatus =
  | "loading" // sports list still loading and slug isn't a known static route
  | "known" // matched a static SPORT_ROUTES slug (cricket/tennis/soccer/…)
  | "dynamic" // matched a provider sport from the live list by eventTypeId
  | "unknown"; // list loaded and nothing matched

export interface SportResolution {
  status: SportResolutionStatus;
  eventTypeId: string | null;
  title: string;
  emptyText: string;
  /** Static sports ship a poster image; dynamic ones don't (use a gradient). */
  poster: string | null;
  isRacing: boolean;
}

/**
 * Resolve a `/sports/[sport]` route param to a concrete sport.
 *
 * The static SPORT_ROUTES config only knows a handful of slugs (cricket,
 * tennis, soccer, racing, election). Sports the owner adds from the new provider
 * (basketball, etc.) are linked by their eventTypeId — e.g. `/sports/7522` — and
 * have no static entry, which is why those pages showed "Sport not found".
 *
 * This resolves in order:
 *   1) a known static slug → its config;
 *   2) otherwise treat the param as an eventTypeId and look it up in the live
 *      sports list (so any active provider sport just works);
 *   3) while the list is still loading, report "loading" so the page shows a
 *      spinner instead of flashing "not found";
 *   4) only when the list has loaded and nothing matches → "unknown".
 */
export function useResolvedSport(sport: string): SportResolution {
  const { data: sportsList, isLoading } = useSportsList();

  // 1) Known static slug.
  const config = getSportConfig(sport);
  if (config && isValidSportSlug(sport)) {
    return {
      status: "known",
      eventTypeId: config.eventTypeId,
      title: config.title,
      emptyText: config.emptyText,
      poster: config.poster,
      isRacing: RACING_EVENT_TYPE_IDS.includes(config.eventTypeId),
    };
  }

  // 2) Dynamic: the param is an eventTypeId for a provider sport. Match the live
  //    list by id (the header links these as /sports/<eventTypeId>).
  const fromList = sportsList?.find((s) => String(s.id) === String(sport));
  if (fromList) {
    const id = String(fromList.id);
    return {
      status: "dynamic",
      eventTypeId: id,
      title: fromList.name,
      emptyText: DEFAULT_EMPTY,
      poster: null,
      isRacing: RACING_EVENT_TYPE_IDS.includes(id),
    };
  }

  // 3) Still loading — don't flash "not found".
  if (isLoading || !sportsList) {
    return {
      status: "loading",
      eventTypeId: null,
      title: sport,
      emptyText: DEFAULT_EMPTY,
      poster: null,
      isRacing: false,
    };
  }

  // 4) Genuinely unknown.
  return {
    status: "unknown",
    eventTypeId: null,
    title: sport,
    emptyText: DEFAULT_EMPTY,
    poster: null,
    isRacing: false,
  };
}
