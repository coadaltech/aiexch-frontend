import { SPORT_ROUTES } from "./sports-config";
import { OUR_MARKET_ITEMS } from "./our-market";

/**
 * Resolve the correct in-app route for a sport coming from the public
 * sports-list (the admin-controlled source every theme shares). This mirrors
 * the link logic the Default theme's header/sidebar already use, so a sport
 * links to the same place regardless of the active theme:
 *
 *  - Coming-soon sports (isLive === false) → the shared placeholder page.
 *  - "Our Market" verticals (Matka, Lottery, …) → their dedicated routes.
 *  - Everything else → /sports/<basePath>, where basePath comes from the
 *    shared SPORT_ROUTES config (falling back to a slug of the name).
 */

const BASE_PATH_BY_EVENT_TYPE: Record<string, string> = Object.fromEntries(
  Object.values(SPORT_ROUTES).map((c) => [c.eventTypeId, c.basePath]),
);

const OUR_MARKET_HREF_BY_ID: Record<string, string> = Object.fromEntries(
  OUR_MARKET_ITEMS.map((i) => [i.eventTypeId, i.href]),
);

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

export function sportHref(sport: {
  id: string;
  name: string;
  isLive?: boolean;
}): string {
  if (sport.isLive === false) {
    return `/sports/coming-soon?name=${encodeURIComponent(sport.name)}`;
  }
  return (
    OUR_MARKET_HREF_BY_ID[sport.id] ??
    `/sports/${BASE_PATH_BY_EVENT_TYPE[sport.id] ?? slugify(sport.name)}`
  );
}
