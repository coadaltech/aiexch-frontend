"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fromZonedTime } from "date-fns-tz";
import { useMatchesList, type MatchListItem } from "@/hooks/useSportsApi";
import { useLiveMultimarket } from "@/hooks/useLiveMultimarket";
import { formatLocal, getUserTimezone } from "@/lib/date-utils";

const EVENT_TYPE_CRICKET = "4";

// Shared width for one odds column (a back+lay pair, i.e. "1", "X" or "2").
// Header and rows BOTH use this token, so the column labels always line up with
// the price boxes beneath them at every breakpoint.
const ODDS_COL = "w-[4.75rem] sm:w-32 md:w-40";
// Width of the leading status/time column.
const TIME_COL = "w-14 sm:w-28 md:w-32";

// Date window: today + next 2 days (3-day window) in the user's local timezone.
const DATE_WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

// localStorage-backed cache so the list paints instantly on repeat visits.
// Events change slowly (new fixtures); odds change fast and stream over WS —
// we still seed `odds` from cache so rows aren't blank until the first WS tick.
const EVENTS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const ODDS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 min

type CachedEnvelope<T> = { data: T; savedAt: number };

function readCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEnvelope<T>;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const envelope: CachedEnvelope<T> = { data, savedAt: Date.now() };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // quota errors etc. — silently ignore, cache is best-effort
  }
}

const formatMatchTime = (dateString: string | null): { day: string; time: string } => {
  if (!dateString) return { day: "TBD", time: "" };
  try {
    const tz = getUserTimezone();
    const eventDay = formatLocal(dateString, "yyyy-MM-dd");
    const today = formatLocal(new Date(), "yyyy-MM-dd");
    const todayMs = fromZonedTime(`${today}T00:00:00`, tz).getTime();
    const eventMs = fromZonedTime(`${eventDay}T00:00:00`, tz).getTime();
    const diffDays = Math.round((eventMs - todayMs) / DAY_MS);

    let day: string;
    if (diffDays === 0) day = "Today";
    else if (diffDays === 1) day = "Tomorrow";
    else if (diffDays > 1 && diffDays < 7) day = formatLocal(dateString, "EEEE");
    else day = formatLocal(dateString, "dd MMM");

    return { day, time: formatLocal(dateString, "HH:mm") };
  } catch {
    return { day: "", time: "" };
  }
};

function OddsCell({ back, lay }: { back: number | null; lay: number | null }) {
  return (
    <div className={`${ODDS_COL} shrink-0 flex items-center gap-0.5 px-0.5 py-0.5 sm:gap-1.5 sm:px-1`}>
      <div className="flex-1 min-w-0 h-9 rounded bg-gradient-to-b from-back to-back-deep flex items-center justify-center text-[13px] sm:text-lg md:text-[16px] font-bold tabular-nums text-gray-900 leading-none">
        {back ?? "-"}
      </div>
      <div className="flex-1 min-w-0 h-9 rounded bg-gradient-to-b from-lay to-lay-deep flex items-center justify-center text-[13px] sm:text-lg md:text-[16px] font-bold tabular-nums text-gray-900 leading-none">
        {lay ?? "-"}
      </div>
    </div>
  );
}

// Extract the three displayed back/lay pairs (1 / X / 2) from a WS market.
// Live runners mirror the match-detail shape: back[] / lay[] arrays with a
// `price` on each level. Pure function so the memo comparator below can reuse
// it to diff prev vs. next prices without re-rendering the row.
function getDisplayPrices(market: any | null) {
  const runners: any[] = market?.runners ?? [];
  const priceAt = (index: number) => {
    const runner = runners[index];
    if (!runner) return { back: null, lay: null };
    return {
      back: runner.back?.[0]?.price ?? null,
      lay: runner.lay?.[0]?.price ?? null,
    };
  };
  return {
    team1: priceAt(0),
    draw: runners.length >= 3 ? priceAt(1) : { back: null, lay: null },
    team2: priceAt(runners.length >= 3 ? 2 : 1),
  };
}

// True when a market carries at least one real back/lay price. Used to decide
// whether a live frame is worth swapping in over a row's last-known odds.
function hasUsablePrices(market: any | null): boolean {
  const runners: any[] = market?.runners ?? [];
  return runners.some(
    (r: any) => r?.back?.[0]?.price != null || r?.lay?.[0]?.price != null
  );
}

function MatchRowImpl({
  match,
  sport,
  market,
  betCount,
}: {
  match: MatchListItem;
  sport: string;
  market: any | null; // one market object from the WS multimarket stream
  betCount?: number;
}) {
  const { team1, draw, team2 } = getDisplayPrices(market);

  return (
    <Link
      href={`/sports/${sport}/${match.seriesId}/${match.id}`}
      className="block bg-white hover:bg-gray-50 transition-colors "
    >
      <div className="flex items-stretch min-h-[2.25rem] max-h-14">
        {/* Status / time badge — In-Play for live, stacked day+time otherwise */}
        {(() => {
          const t = formatMatchTime(match.openDate);
          return (
            <div className={`${TIME_COL} shrink-0 flex flex-col items-center justify-center text-center mr-1`}>
              {match.inPlay ? (
                <span className="bg-[#1f7a47] text-white px-1.5 py-1 rounded text-xs sm:text-xs font-bold leading-none">
                  In-Play
                </span>
              ) : (
                <div className="flex flex-col sm:flex-row sm:gap-1 leading-tight text-xs sm:text-xs md:text-sm font-bold text-black whitespace-nowrap">
                  <span>{t.day}</span>
                  {t.time && <span className="text-black mt-0.5 sm:mt-0">{t.time}</span>}
                </div>
              )}
            </div>
          );
        })()}

        {/* Event name — wraps cleanly on small screens */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1">
          <h4 className="text-xs sm:text-xs md:text-sm font-semibold md:font-bold text-black break-words min-w-0 leading-snug">
            {match.name?.length > 50 ? match.name.slice(0, 50) + "..." : match.name || "Untitled Match"}
            </h4>
          {betCount != null && betCount > 0 && (
            <span className="relative shrink-0 group ml-auto">
              <span className="text-[12px] sm:text-xs text-black bg-yellow-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap cursor-default">
                {betCount}
              </span>
              <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                {betCount} matched bets
              </span>
            </span>
          )}
        </div>

        <OddsCell back={team1.back} lay={team1.lay} />
        <OddsCell back={draw.back} lay={draw.lay} />
        <OddsCell back={team2.back} lay={team2.lay} />
      </div>
    </Link>
  );
}

// A row only re-renders when ITS OWN event fields or ITS OWN displayed prices
// change. Without this, every parent re-render (each WS odds tick streams a new
// `oddsByMarketId` object, and every navigation/refetch rebuilds the match
// array) would re-render every row — event name, time cell and all — making the
// whole list visibly "rebuild". We diff the structural fields plus the three
// back/lay pairs so unchanged rows stay mounted and untouched; only the cells
// whose odds actually moved repaint.
const MatchRow = memo(MatchRowImpl, (prev, next) => {
  if (
    prev.match.id !== next.match.id ||
    prev.match.name !== next.match.name ||
    prev.match.openDate !== next.match.openDate ||
    prev.match.inPlay !== next.match.inPlay ||
    prev.sport !== next.sport ||
    prev.betCount !== next.betCount
  ) {
    return false;
  }
  const a = getDisplayPrices(prev.market);
  const b = getDisplayPrices(next.market);
  return (
    a.team1.back === b.team1.back &&
    a.team1.lay === b.team1.lay &&
    a.draw.back === b.draw.back &&
    a.draw.lay === b.draw.lay &&
    a.team2.back === b.team2.back &&
    a.team2.lay === b.team2.lay
  );
});

// True when two event records render identically — i.e. nothing the row cares
// about changed. Used to decide whether a refetched event can keep its existing
// object identity (so the row never re-renders) or must be swapped in.
function sameEvent(a: MatchListItem, b: MatchListItem): boolean {
  return (
    a.name === b.name &&
    a.openDate === b.openDate &&
    a.status === b.status &&
    a.inPlay === b.inPlay &&
    a.defaultMarketId === b.defaultMarketId &&
    a.betCount === b.betCount &&
    a.seriesId === b.seriesId
  );
}

// Reconcile a freshly fetched event list against the current stable list:
//  • events still present keep their EXISTING object identity (unless a tracked
//    field changed), so unchanged rows never re-render;
//  • genuinely new events are added;
//  • events no longer returned drop out;
//  • if the result is element-for-element identical to `prev`, we return `prev`
//    itself so the reference is stable and nothing downstream recomputes.
// This is what makes a refetch a no-op when the backend returns the same data —
// the list syncs new events in without rebuilding.
function reconcileEvents(
  prev: MatchListItem[],
  fresh: MatchListItem[],
): MatchListItem[] {
  const prevById = new Map(prev.map((e) => [e.id, e]));
  let changed = fresh.length !== prev.length;
  const next = fresh.map((m, i) => {
    const old = prevById.get(m.id);
    const chosen = old && sameEvent(old, m) ? old : m;
    if (prev[i] !== chosen) changed = true;
    return chosen;
  });
  return changed ? next : prev;
}

export function CricketMatchesList({
  sport = "cricket",
  eventTypeId = EVENT_TYPE_CRICKET,
  seriesId,
  maxMatches,
  emptyText,
  showHeader = true,
  wrapper,
}: {
  sport?: string;
  eventTypeId?: string;
  // When provided, only matches belonging to this series are shown — used by
  // the series page to reuse this list scoped to a single series/tournament.
  seriesId?: string;
  maxMatches?: number;
  emptyText?: string;
  showHeader?: boolean;
  // When provided, the list renders its visible content inside `wrapper(...)`.
  // If there are no visible matches the entire section (wrapper + content) is
  // omitted — used on the homepage so sport sections with zero matches are
  // hidden completely rather than rendering empty chrome.
  wrapper?: (content: React.ReactNode) => React.ReactNode;
}) {
  // Flat list from the SQL function (structural data only — no odds).
  const { data: liveMatches = [], isLoading: matchesLoading } =
    useMatchesList(eventTypeId);

  // Cache keys scoped per event type (and per series when scoped) so
  // cricket/football/etc. — and a series view vs. the full sport list — don't
  // collide.
  const cacheScope = seriesId ? `${eventTypeId}:${seriesId}` : eventTypeId;
  const eventsCacheKey = `cml:events:v2:${cacheScope}`;
  const oddsCacheKey = `cml:odds:v2:${cacheScope}`;

  // Hydrate cached events/odds after mount (avoids SSR hydration mismatch).
  // First paint may be empty on the very first visit; second paint (same tick
  // on the client) renders with cached data — effectively instant.
  const [cachedEvents, setCachedEvents] = useState<MatchListItem[] | null>(null);
  const [cachedOddsMap, setCachedOddsMap] = useState<Record<string, any>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const events = readCache<MatchListItem[]>(eventsCacheKey, EVENTS_CACHE_TTL_MS);
    const odds = readCache<Record<string, any>>(oddsCacheKey, ODDS_CACHE_TTL_MS);
    setCachedEvents(events);
    setCachedOddsMap(odds ?? {});
    setHydrated(true);
  }, [eventsCacheKey, oddsCacheKey]);

  // Date window: today 00:00 → end of (today + 2 days) in the user's local
  // timezone. Recomputed once per mount — changes at most once per day.
  const { startOfTodayIST, endOfWindowIST } = useMemo(() => {
    const tz = getUserTimezone();
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
    const start = fromZonedTime(`${todayStr}T00:00:00`, tz).getTime();
    return {
      startOfTodayIST: start,
      endOfWindowIST: start + DATE_WINDOW_DAYS * DAY_MS,
    };
  }, []);

  // Politics events often have old/fixed openDates — show them all.
  const isPolitics = eventTypeId === "500";

  // Apply the date window filter. SQL already sorted (inPlay desc, openDate
  // asc), so no re-sort needed — but filtering must happen here because the
  // window is in IST which the DB doesn't know about.
  const filteredMatches: MatchListItem[] = useMemo(() => {
    // Scope to a single series when the caller asks for it.
    const scoped = seriesId
      ? liveMatches.filter((m) => String(m.seriesId) === String(seriesId))
      : liveMatches;
    if (!isPolitics) {
      return scoped.filter((m) => {
        if (!m.openDate) return true;
        const t = new Date(m.openDate).getTime();
        if (isNaN(t)) return true;
        return t >= startOfTodayIST && t < endOfWindowIST;
      });
    }
    return scoped;
  }, [liveMatches, startOfTodayIST, endOfWindowIST, isPolitics, seriesId]);

  // Stable event list. Instead of swapping in a brand-new array on every fetch
  // (which gives every match a new object identity and churns the whole list),
  // we keep one accumulated list and sync into it: new events are added,
  // existing events keep their identity, and a refetch that returns the same
  // data is a no-op. This is what stops the list from rebuilding on each visit /
  // refresh / background refetch — it only changes when the data truly changes.
  const [eventStore, setEventStore] = useState<MatchListItem[]>([]);

  // Seed once from cache (post-hydrate) so the list paints instantly on a cold
  // load before the network responds. Only seeds while still empty so it never
  // clobbers freshly-synced live data.
  useEffect(() => {
    if (!cachedEvents || cachedEvents.length === 0) return;
    setEventStore((prev) => (prev.length === 0 ? cachedEvents : prev));
  }, [cachedEvents]);

  // Sync fresh fetches into the stable list (add new, keep existing, drop gone).
  useEffect(() => {
    if (filteredMatches.length === 0) return;
    setEventStore((prev) => reconcileEvents(prev, filteredMatches));
  }, [filteredMatches]);

  // Persist the stable list so the next visit paints from it instantly.
  useEffect(() => {
    if (eventStore.length > 0) writeCache(eventsCacheKey, eventStore);
  }, [eventStore, eventsCacheKey]);

  const allMatches: MatchListItem[] = eventStore;

  // Pre-slice candidates BEFORE subscribing to the WS so we open at most a
  // bounded number of per-event pipes per section. The visible list is now
  // exactly these events (we no longer drop price-less events), so subscribe to
  // precisely the rows we render — no over-subscription buffer needed.
  const oddsCandidates = useMemo(() => {
    return maxMatches ? allMatches.slice(0, maxMatches) : allMatches;
  }, [allMatches, maxMatches]);

  // Build the {eventId, marketId} list for the WebSocket subscription —
  // same shape the /multimarket page uses.
  const liveItems = useMemo(
    () =>
      oddsCandidates.map((m) => ({
        eventId: String(m.id),
        marketId: m.defaultMarketId,
      })),
    [oddsCandidates]
  );

  // WebSocket stream: keyed by marketId (not matchId) — the backend only sends
  // updates for the markets we subscribed to. Each frame carries ONLY the
  // markets that just changed (a delta), not a full snapshot of every row.
  const { oddsByMarketId } = useLiveMultimarket(liveItems, eventTypeId);

  // Sticky "last-known-good" odds store, keyed by marketId. This is the single
  // source of truth the rows render from, and it solves both bugs at once:
  //
  //  • Flicker — we NEVER blank a market. A frame only overwrites a market's
  //    entry when it actually carries prices; an empty/suspended frame (which
  //    the feed sends transiently, and which ended matches send) is ignored, so
  //    good odds never drop to "-" and back.
  //  • Ended matches — the store only ever GAINS a market once that market has
  //    streamed real prices. A match that never streams usable odds (i.e. it has
  //    ended; the provider stopped pricing it) never enters the store, so the
  //    visibility filter below keeps it out of the list entirely.
  //
  // The store is append/refresh-only within a session, so the visible set grows
  // smoothly as matches gain odds and never reshuffles or shrinks per tick.
  const [oddsStore, setOddsStore] = useState<Record<string, any>>({});

  // Seed the store from cache once (post-hydrate) so repeat visits paint real
  // odds instantly instead of waiting for the first WS roundtrip. Cache is
  // already TTL-bounded (stale entries are dropped on read), so this can't
  // resurrect long-dead matches.
  useEffect(() => {
    setOddsStore((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [marketId, market] of Object.entries(cachedOddsMap)) {
        if (!next[marketId] && hasUsablePrices(market)) {
          next[marketId] = market;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cachedOddsMap]);

  // Fold live frames into the store, but only when they carry real prices and
  // the market's object actually changed. The WS hook preserves object identity
  // for markets that didn't tick, so the `!== prev` guard means a tick for one
  // market doesn't churn the whole store (or rewrite the cache) for the rest.
  useEffect(() => {
    setOddsStore((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [marketId, market] of Object.entries(oddsByMarketId)) {
        if (hasUsablePrices(market) && next[marketId] !== market) {
          next[marketId] = market;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [oddsByMarketId]);

  const marketMap = oddsStore;

  // Persist the sticky store so the next visit seeds with last-seen good prices.
  useEffect(() => {
    if (Object.keys(oddsStore).length > 0) writeCache(oddsCacheKey, oddsStore);
  }, [oddsStore, oddsCacheKey]);

  // Visible list = events that have real odds, in the stable backend order
  // (inPlay desc, openDate asc). Membership comes from the sticky store, so it
  // only grows as matches gain prices — it never flickers per tick, and ended
  // matches (no usable odds) are excluded. New priced events simply slot into
  // their place; nothing reshuffles.
  const visibleMatches = useMemo(
    () =>
      oddsCandidates
        .filter((m) => hasUsablePrices(oddsStore[m.defaultMarketId]))
        .slice(0, maxMatches ?? undefined),
    [oddsCandidates, oddsStore, maxMatches]
  );

  const hasAnythingToShow = visibleMatches.length > 0;

  // Homepage mode: caller passes a `wrapper`. The section appears once at least
  // one match in it has real odds, and stays put thereafter — we never paint a
  // section full of priceless/ended rows just to hide them a tick later.
  if (wrapper) {
    if (!hasAnythingToShow) return null;
  } else {
    // Standalone mode (sport listing pages etc.): keep the previous behavior —
    // skeleton on first fetch, empty state fallback.
    const stillFetchingFirstTime =
      !hydrated || matchesLoading || Object.keys(marketMap).length === 0;

    if (!hasAnythingToShow && stillFetchingFirstTime) {
      return (
        <div className="space-y-1">
          {[...Array(Math.min(maxMatches ?? 4, 4))].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      );
    }

    if (!hasAnythingToShow) {
      if (emptyText) {
        return (
          <div className="py-8 text-center">
            <p className="text-gray-500 text-sm">{emptyText}</p>
            <p className="text-gray-400 text-xs mt-1">
              Check back later for live action.
            </p>
          </div>
        );
      }
      return null;
    }
  }

  const listBody = (
    <div className="w-full rounded-lg overflow-hidden shadow-sm">
      {showHeader && (
        <div className="flex items-center bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] text-[10px] sm:text-xs font-bold font-condensed tracking-wider">
          <div className="flex-1 py-2.5 px-3" />
          <div className={`${ODDS_COL} shrink-0 text-center py-2.5`}>1</div>
          <div className={`${ODDS_COL} shrink-0 text-center py-2.5`}>X</div>
          <div className={`${ODDS_COL} shrink-0 text-center py-2.5`}>2</div>
        </div>
      )}

      <div className="divide-y divide-gray-100 bg-white border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
        {visibleMatches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            sport={sport}
            market={marketMap[match.defaultMarketId] ?? null}
            betCount={match.betCount}
          />
        ))}
      </div>
    </div>
  );

  return wrapper ? <>{wrapper(listBody)}</> : listBody;
}
