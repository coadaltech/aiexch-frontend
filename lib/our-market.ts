/**
 * "Our Market" — the special in-house game verticals (Matka, Bombay Bazar,
 * Jambo, Lottery, Skill Games). Shown as a dedicated sidebar section in EVERY
 * theme (Default / Diamond / Betfair … and any future theme), with their correct
 * dedicated routes.
 *
 * Single source of truth: every theme's sidebar imports this list to render the
 * section, and excludes these `eventTypeId`s from the generic "All Sports" list
 * so the games never appear twice (or with the wrong `/sports/...` href).
 *
 * A future theme gets the section for free: import `OUR_MARKET_ITEMS`, render a
 * section, and filter the sports list with `OUR_MARKET_EVENT_TYPE_IDS`.
 */
export interface OurMarketItem {
  label: string;
  href: string;
  /** The sport's eventTypeId in the public sports list (used to de-dupe). */
  eventTypeId: string;
}

export const OUR_MARKET_ITEMS: OurMarketItem[] = [
  { label: "Matka", href: "/matka", eventTypeId: "1001" },
  { label: "Bombay Bazar", href: "/bombay-bazar", eventTypeId: "1005" },
  { label: "Jambo", href: "/jambo", eventTypeId: "1004" },
  { label: "Lottery", href: "/lotry", eventTypeId: "1002" },
  { label: "Skill Games", href: "/skil-games", eventTypeId: "1003" },
];

/** eventTypeIds to exclude from the generic sports list (shown in Our Market). */
export const OUR_MARKET_EVENT_TYPE_IDS = new Set(
  OUR_MARKET_ITEMS.map((i) => i.eventTypeId)
);

/** Lowercased names, as a secondary de-dupe key if a sport id ever differs. */
export const OUR_MARKET_NAMES = new Set(
  OUR_MARKET_ITEMS.map((i) => i.label.toLowerCase())
);
