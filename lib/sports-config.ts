/**
 * Central config for all sports routes.
 * Single source of truth for sport slug → eventTypeId and display labels.
 */

export const SPORT_ROUTES = {
  cricket: {
    basePath: "cricket",
    eventTypeId: "4",
    title: "Cricket Series",
    emptyText: "No live cricket matches at the moment.",
    checkBackText: "Check back later for live action.",
    poster: "/cricket-cup.jpeg",
  },
  tennis: {
    basePath: "tennis",
    eventTypeId: "2",
    title: "Tennis Tournaments",
    emptyText: "No live tennis matches at the moment.",
    checkBackText: "Check back later for live action.",
    poster: "/tennis-poster.png",
  },
  soccer: {
    basePath: "soccer",
    eventTypeId: "1",
    title: "Soccer Leagues",
    emptyText: "No live soccer matches at the moment.",
    checkBackText: "Check back later for live action.",
    poster: "/football-poster.jpeg",
  },
  "horse-racing": {
    basePath: "horse-racing",
    eventTypeId: "7",
    title: "Horse Racing",
    emptyText: "No live horse racing at the moment.",
    checkBackText: "Check back later for live action.",
    poster: "/horseracing-poster.jpeg",
  },
  "greyhound-racing": {
    basePath: "greyhound-racing",
    eventTypeId: "4339",
    title: "Greyhound Racing",
    emptyText: "No live greyhound racing at the moment.",
    checkBackText: "Check back later for live action.",
    poster: "/greyhound-poster.jpeg",
  },
  "politics": {
    basePath: "politics",
    eventTypeId: "500",
    title: "Election",
    emptyText: "No live elections at the moment.",
    checkBackText: "Check back later for live action.",
    poster: "/greyhound-poster.jpeg",
  },
} as const;

/**
 * User-facing display-name overrides keyed by eventTypeId. The backend may
 * still send a legacy name (e.g. "Politics", "Bombay Bazar"); these take
 * precedence for any label shown to users so a rename needs no data migration.
 */
export const SPORT_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "500": "Election", // was "Politics"
  "1005": "Bombay Bazar", // was "Bombay Bazar"
};

/** Resolve the display name for a sport, applying any override. */
export function getSportDisplayName(
  eventTypeId: string | number | undefined | null,
  fallbackName: string,
): string {
  const key = String(eventTypeId ?? "");
  return SPORT_DISPLAY_NAME_OVERRIDES[key] ?? fallbackName;
}

/**
 * Sports whose sidebar event list should NOT be date-filtered — every event is
 * shown regardless of its open date. Keyed by eventTypeId.
 */
export const SPORTS_WITHOUT_DATE_FILTER = new Set<string>([
  "4", // Cricket
  "500", // Election (politics)
]);

export type SportSlug = keyof typeof SPORT_ROUTES;

export const SPORT_SLUGS: SportSlug[] = [
  "cricket",
  "tennis",
  "soccer",
  "horse-racing",
  "greyhound-racing",
  "politics"
];

export function getSportConfig(sport: string): (typeof SPORT_ROUTES)[SportSlug] | null {
  if (sport in SPORT_ROUTES) {
    return SPORT_ROUTES[sport as SportSlug];
  }
  return null;
}

export function getEventTypeIdBySport(sport: string): string | null {
  const config = getSportConfig(sport);
  return config?.eventTypeId ?? null;
}

export function isValidSportSlug(sport: string): sport is SportSlug {
  return sport in SPORT_ROUTES;
}
