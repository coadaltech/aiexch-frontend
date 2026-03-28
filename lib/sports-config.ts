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
} as const;

export type SportSlug = keyof typeof SPORT_ROUTES;

export const SPORT_SLUGS: SportSlug[] = [
  "cricket",
  "tennis",
  "soccer",
  "horse-racing",
  "greyhound-racing",
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
