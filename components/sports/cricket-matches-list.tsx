"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSeries } from "@/hooks/useSportsApi";
import { sportsApi } from "@/lib/api";

const EVENT_TYPE_CRICKET = "4";

// Date window: today + next 2 days (3-day window) in IST.
const DATE_WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

// localStorage-backed cache so the list paints instantly on repeat visits.
// Events change slowly (new fixtures), odds change fast — separate TTLs.
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

const formatToIST = (dateString: string | null): string => {
  if (!dateString) return "TBD";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
};

interface FlatMatch {
  id: string;
  name: string;
  openDate: string | null;
  status: string;
  inPlay: boolean;
  seriesId: string;
  seriesName: string;
  defaultMarketId: string | null;
}

function useBetCounts(matchIds: string[]) {
  return useQuery({
    queryKey: ["bet-counts", matchIds.join(",")],
    queryFn: async () => {
      if (matchIds.length === 0) return {} as Record<string, number>;
      const res = await sportsApi.getBetCounts(matchIds);
      return (res.data?.data ?? {}) as Record<string, number>;
    },
    enabled: matchIds.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/**
 * For each match call getMarketsWithOdds(eventTypeId, eventId) — the same
 * endpoint the match detail page uses, so we know it works.
 * We then pick the market whose marketId matches defaultMarketId (falling back
 * to the first market if no exact match), and store only that market's runners.
 */
function useMatchOdds(
  matches: Array<{ id: string; defaultMarketId: string }>,
  eventTypeId: string
) {
  return useQuery({
    queryKey: [
      "match-list-odds",
      eventTypeId,
      matches.map((m) => m.id).join(","),
    ],
    queryFn: async () => {
      if (matches.length === 0) return {} as Record<string, any>;

      const results = await Promise.allSettled(
        matches.map(async ({ id, defaultMarketId }) => {
          const res = await sportsApi.getMarketsWithOdds(eventTypeId, id);
          const markets: any[] = res.data?.data ?? res.data ?? [];

          // Pick the market whose marketId matches the stored defaultMarketId.
          // Fall back to the first market in the list if no exact match.
          const market =
            markets.find((m: any) => m.marketId === defaultMarketId) ??
            markets[0] ??
            null;

          return { id, market };
        })
      );

      const map: Record<string, any> = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.market) {
          map[result.value.id] = result.value.market;
        }
      }
      return map;
    },
    enabled: matches.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    placeholderData: (prev: Record<string, any> | undefined) => prev,
  });
}

function OddsCell({ back, lay }: { back: number | null; lay: number | null }) {
  return (
    <div className="flex shrink-0">
      <div className="w-24 bg-gradient-to-b from-back to-back-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
        {back ?? "-"}
      </div>
      <div className="w-24 bg-gradient-to-b from-lay to-lay-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
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
  match: FlatMatch;
  sport: string;
  market: any | null; // one market object from getMarketsWithOdds
  betCount?: number;
}) {
  // getMarketsWithOdds runners have back[]/lay[] arrays same as match detail page
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
      className="block bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center">
        <div className="flex-1 min-w-0 py-1.5 px-3 flex items-center">
          <span className="text-[16px] font-bold text-black whitespace-nowrap shrink-0">
            {formatToIST(match.openDate)}
          </span>
          <span className="text-gray-300 shrink-0">·</span>
          
          <span className="text-gray-300 shrink-0 hidden sm:inline">·</span>
          <h4 className="text-[16px] mr-2 font-bold text-black truncate min-w-0">
            {match.name}
          </h4>
          <span className="text-[12px] mr-1 bg-[#4090e0]/80 text-white px-1 py-0.5 rounded font-medium shrink-0">
            O
          </span>
          {match.inPlay ? (
            <span className="flex items-center gap-0.5 shrink-0">
              <span className="w-2.5 h-2.5 bg-[#84c2f1] rounded-full animate-pulse" />
              <span className="text-[18px] text-[#142969] font-bold">LIVE</span>
            </span>
          ) : (
            <span />
          )}
          {betCount != null && betCount > 0 && (
            <span className="relative ml-56 shrink-0 group">
              <span className="text-[14px] text-black bg-yellow-500 p-1 font-medium whitespace-nowrap cursor-default">
                {betCount}
              </span>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                {betCount} matched bets
              </span>
            </span>
          )}
        </div>

        <OddsCell back={team1.back} lay={team1.lay} />

        <div className="hidden sm:flex shrink-0">
          <div className="w-24 bg-gradient-to-b from-back to-back-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
            {draw.back ?? "-"}
          </div>
          <div className="w-24 bg-gradient-to-b from-lay to-lay-deep text-center py-1.5 text-sm sm:text-base font-bold text-gray-900 border-l border-white/30 leading-tight">
            {draw.lay ?? "-"}
          </div>
        </div>

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
}: {
  sport?: string;
  eventTypeId?: string;
  maxMatches?: number;
  emptyText?: string;
  showHeader?: boolean;
}) {
  const { data: seriesData = [], isLoading: seriesLoading } =
    useSeries(eventTypeId);

  // Cache keys scoped per event type so cricket/football/etc. don't collide.
  const eventsCacheKey = `cml:events:v1:${eventTypeId}`;
  const oddsCacheKey = `cml:odds:v1:${eventTypeId}`;

  // Hydrate cached events/odds after mount (avoids SSR hydration mismatch).
  // First paint may be empty on the very first visit; second paint (same tick
  // on the client) renders with cached data — effectively instant.
  const [cachedEvents, setCachedEvents] = useState<FlatMatch[] | null>(null);
  const [cachedOddsMap, setCachedOddsMap] = useState<Record<string, any>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const events = readCache<FlatMatch[]>(eventsCacheKey, EVENTS_CACHE_TTL_MS);
    const odds = readCache<Record<string, any>>(oddsCacheKey, ODDS_CACHE_TTL_MS);
    setCachedEvents(events);
    setCachedOddsMap(odds ?? {});
    setHydrated(true);
  }, [eventsCacheKey, oddsCacheKey]);

  // Date window: today 00:00 IST through end of (today + 2 days) IST.
  // Recomputed once per mount — changes at most once per day.
  const { startOfTodayIST, endOfWindowIST } = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const start = new Date(`${todayStr}T00:00:00+05:30`).getTime();
    return {
      startOfTodayIST: start,
      endOfWindowIST: start + DATE_WINDOW_DAYS * DAY_MS,
    };
  }, []);

  // Politics events often have old/fixed openDates — show them all.
  const isPolitics = eventTypeId === "500";

  const liveMatches: FlatMatch[] = useMemo(() => {
    const matches: FlatMatch[] = [];

    for (const series of seriesData) {
      if (!series.matches) continue;

      for (const match of series.matches) {
        const defaultMarketId: string | null =
          match.defaultMarketId ?? match.event?.defaultMarketId ?? null;
        if (!defaultMarketId) continue;

        const openDate: string | null =
          match.openDate ?? match.event?.openDate ?? null;
        const inPlay: boolean = match.inPlay ?? false;

        if (!isPolitics && openDate) {
          const t = new Date(openDate).getTime();
          if (!isNaN(t) && (t < startOfTodayIST || t >= endOfWindowIST)) {
            continue;
          }
        }

        matches.push({
          id: match.id ?? match.event?.id,
          name: match.name ?? match.event?.name ?? "Unknown",
          openDate,
          status: match.status ?? "UNKNOWN",
          inPlay,
          seriesId: series.id,
          seriesName: series.name,
          defaultMarketId,
        });
      }
    }

    return matches.sort((a, b) => {
      if (a.inPlay && !b.inPlay) return -1;
      if (!a.inPlay && b.inPlay) return 1;
      const dateA = a.openDate ? new Date(a.openDate).getTime() : Infinity;
      const dateB = b.openDate ? new Date(b.openDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [seriesData, startOfTodayIST, endOfWindowIST, isPolitics]);

  // Persist live events once they arrive so the next visit paints instantly.
  useEffect(() => {
    if (liveMatches.length > 0) writeCache(eventsCacheKey, liveMatches);
  }, [liveMatches, eventsCacheKey]);

  // Prefer live data; fall back to cache so the list renders with no skeleton.
  const allMatches: FlatMatch[] =
    liveMatches.length > 0 ? liveMatches : cachedEvents ?? [];

  // Pre-slice candidates BEFORE firing per-match odds requests so we make at
  // most a bounded number of parallel calls per section instead of one per
  // event. We fetch a small buffer over maxMatches so that events without
  // live prices can be dropped and we still fill the slot.
  const oddsCandidates = useMemo(() => {
    const bufferedLimit = maxMatches ? maxMatches * 2 : allMatches.length;
    return allMatches.slice(0, bufferedLimit);
  }, [allMatches, maxMatches]);

  const oddsInput = useMemo(
    () =>
      oddsCandidates.map((m) => ({
        id: m.id,
        defaultMarketId: m.defaultMarketId!,
      })),
    [oddsCandidates]
  );

  const matchIds = useMemo(() => oddsCandidates.map((m) => m.id), [oddsCandidates]);

  const { data: liveMarketMap = {}, isLoading: oddsLoading } = useMatchOdds(
    oddsInput,
    eventTypeId
  );
  const { data: betCountMap = {} } = useBetCounts(matchIds);

  // Persist live odds so repeat visits skip the odds round-trip on first paint.
  useEffect(() => {
    if (Object.keys(liveMarketMap).length > 0) {
      writeCache(oddsCacheKey, liveMarketMap);
    }
  }, [liveMarketMap, oddsCacheKey]);

  // Prefer live odds; fall back to cached odds for instant render.
  const marketMap: Record<string, any> =
    Object.keys(liveMarketMap).length > 0 ? liveMarketMap : cachedOddsMap;

  // Keep only events that actually have at least one real price, then cap
  // to maxMatches. Filtering first ensures the section fills up from the
  // buffered candidate pool rather than leaving empty slots.
  const visibleMatches = oddsCandidates
    .filter((m) => {
      const market = marketMap[m.id];
      if (!market) return false;
      const runners: any[] = market.runners ?? [];
      return runners.some(
        (r: any) => r.back?.[0]?.price != null || r.lay?.[0]?.price != null
      );
    })
    .slice(0, maxMatches ?? undefined);

  // Only show the skeleton on the very first visit (no cache yet) while the
  // network requests are still outstanding. Once we have anything to render —
  // live or cached — skip the skeleton entirely so the list feels instant.
  const hasAnythingToShow = visibleMatches.length > 0;
  const stillFetchingFirstTime =
    !hydrated || seriesLoading || (oddsLoading && Object.keys(marketMap).length === 0);

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

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-sm">
      {showHeader && (
        <div className="flex items-center bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-[10px] sm:text-xs font-bold font-condensed tracking-wider">
          <div className="flex-1 py-2.5 px-3" />
          <div className="w-48 text-center py-2.5">1</div>
          <div className="w-48 text-center py-2.5 hidden sm:block">X</div>
          <div className="w-48 text-center py-2.5">2</div>
        </div>
      )}

      <div className="divide-y divide-gray-100 border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
        {visibleMatches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            sport={sport}
            market={marketMap[match.id] ?? null}
            betCount={betCountMap[match.id]}
          />
        ))}
      </div>
    </div>
  );
}
