"use client";

import { useEffect, useMemo, useState } from "react";
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
    <div className={`${ODDS_COL} shrink-0 flex items-center gap-0.5 px-0.5 py-1 sm:gap-1.5 sm:px-1`}>
      <div className="flex-1 min-w-0 h-9 rounded bg-gradient-to-b from-back to-back-deep flex items-center justify-center text-[13px] sm:text-lg md:text-[16px] font-bold tabular-nums text-gray-900 leading-none">
        {back ?? "-"}
      </div>
      <div className="flex-1 min-w-0 h-9 rounded bg-gradient-to-b from-lay to-lay-deep flex items-center justify-center text-[13px] sm:text-lg md:text-[16px] font-bold tabular-nums text-gray-900 leading-none">
        {lay ?? "-"}
      </div>
    </div>
  );
}

function MatchRow({
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
  // Live runners from the WS stream mirror the shape the match-detail page
  // uses: back[] / lay[] arrays with a `price` on each level.
  const runners: any[] = market?.runners ?? [];

  const getRunnerPrice = (index: number) => {
    const runner = runners[index];
    if (!runner) return { back: null, lay: null };
    return {
      back: runner.back?.[0]?.price ?? null,
      lay: runner.lay?.[0]?.price ?? null,
    };
  };

  const team1 = getRunnerPrice(0);
  const draw =
    runners.length >= 3 ? getRunnerPrice(1) : { back: null, lay: null };
  const team2 = getRunnerPrice(runners.length >= 3 ? 2 : 1);

  return (
    <Link
      href={`/sports/${sport}/${match.seriesId}/${match.id}`}
      className="block bg-white hover:bg-gray-50 transition-colors m-0.5"
    >
      <div className="flex items-stretch min-h-[2.75rem] max-h-16">
        {/* Status / time badge — In-Play for live, stacked day+time otherwise */}
        {(() => {
          const t = formatMatchTime(match.openDate);
          return (
            <div className={`${TIME_COL} shrink-0 flex flex-col items-center justify-center text-center`}>
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
        <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5">
          <h4 className="text-base sm:text-lg md:text-[16px] font-bold text-[var(--header-primary)] break-words min-w-0 leading-snug">
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

export function CricketMatchesList({
  sport = "cricket",
  eventTypeId = EVENT_TYPE_CRICKET,
  maxMatches,
  emptyText,
  showHeader = true,
  wrapper,
}: {
  sport?: string;
  eventTypeId?: string;
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

  // Cache keys scoped per event type so cricket/football/etc. don't collide.
  const eventsCacheKey = `cml:events:v2:${eventTypeId}`;
  const oddsCacheKey = `cml:odds:v2:${eventTypeId}`;

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
    if (!isPolitics) {
      return liveMatches.filter((m) => {
        if (!m.openDate) return true;
        const t = new Date(m.openDate).getTime();
        if (isNaN(t)) return true;
        return t >= startOfTodayIST && t < endOfWindowIST;
      });
    }
    return liveMatches;
  }, [liveMatches, startOfTodayIST, endOfWindowIST, isPolitics]);

  // Persist live events once they arrive so the next visit paints instantly.
  useEffect(() => {
    if (filteredMatches.length > 0) writeCache(eventsCacheKey, filteredMatches);
  }, [filteredMatches, eventsCacheKey]);

  // Prefer live data; fall back to cache so the list renders with no skeleton.
  const allMatches: MatchListItem[] =
    filteredMatches.length > 0 ? filteredMatches : cachedEvents ?? [];

  // Pre-slice candidates BEFORE subscribing to the WS so we open at most a
  // bounded number of per-event pipes per section. We subscribe to a small
  // buffer over maxMatches so events without live prices can be dropped and
  // we still fill the slot.
  const oddsCandidates = useMemo(() => {
    const bufferedLimit = maxMatches ? maxMatches * 2 : allMatches.length;
    return allMatches.slice(0, bufferedLimit);
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
  // updates for the markets we subscribed to.
  const { oddsByMarketId } = useLiveMultimarket(liveItems, eventTypeId);

  // Persist live odds so repeat visits seed rows with last-seen prices before
  // the first WS tick lands.
  useEffect(() => {
    if (Object.keys(oddsByMarketId).length > 0) {
      writeCache(oddsCacheKey, oddsByMarketId);
    }
  }, [oddsByMarketId, oddsCacheKey]);

  // Prefer live WS odds; fall back to cached odds for instant render.
  const marketMap: Record<string, any> =
    Object.keys(oddsByMarketId).length > 0 ? oddsByMarketId : cachedOddsMap;

  // Prefer events with live prices; fall back to events without prices yet so
  // the section paints immediately on first load (rows render with "-" until
  // the WS tick lands and React re-renders with real odds in place).
  const matchesWithPrices = oddsCandidates.filter((m) => {
    const market = marketMap[m.defaultMarketId];
    if (!market) return false;
    const runners: any[] = market.runners ?? [];
    return runners.some(
      (r: any) => r.back?.[0]?.price != null || r.lay?.[0]?.price != null
    );
  });

  const visibleMatches = (
    matchesWithPrices.length > 0 ? matchesWithPrices : oddsCandidates
  ).slice(0, maxMatches ?? undefined);

  const hasAnythingToShow = visibleMatches.length > 0;

  // Homepage mode: caller passes a `wrapper`. Render as soon as the event
  // list is available — odds rows show "-" until WS data arrives, then update
  // in place. This is much faster than waiting for the WS roundtrip before
  // the section becomes visible.
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
