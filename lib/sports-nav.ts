import { SPORT_ROUTES } from "./sports-config";
import { OUR_MARKET_ITEMS, OUR_MARKET_EVENT_TYPE_IDS } from "./our-market";

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

/**
 * Sports that open a dedicated page instead of a competitions drill-down.
 * Racing (Horse 7 / Greyhound 4339) has no competition layer — it goes straight
 * to its events page, exactly like the Default theme's `SPECIAL_SPORT_HREFS`.
 */
const NO_DRILLDOWN_EVENT_TYPE_IDS = new Set(["7", "4339"]);

/**
 * Whether a sport should expand into a competition dropdown in the sidebar.
 * Coming-soon sports, the in-house "Our Market" verticals and racing all link
 * straight to their page; every other (live, regular) sport drills down.
 */
export function sportDrillsDown(sport: { id: string; isLive?: boolean }): boolean {
  if (sport.isLive === false) return false;
  const id = String(sport.id);
  if (OUR_MARKET_EVENT_TYPE_IDS.has(id)) return false;
  return !NO_DRILLDOWN_EVENT_TYPE_IDS.has(id);
}
