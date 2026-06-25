"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fromZonedTime } from "date-fns-tz";
import { Tv, Dot } from "lucide-react";
import { useMatchesList, type MatchListItem } from "@/hooks/useSportsApi";
import { useLiveMultimarket } from "@/hooks/useLiveMultimarket";
import { formatLocal, getUserTimezone } from "@/lib/date-utils";

/**
 * DIAMOND market table — a pixel-faithful clone of the reference exchange grid
 * (Game | 1 | X | 2 with blue back / pink lay cells). The DATA wiring is copied
 * verbatim from components/sports/cricket-matches-list.tsx (useMatchesList +
 * useLiveMultimarket + the same caching / date-window / runner-price mapping) so
 * the odds, live updates and business behaviour are identical — only the markup
 * differs. No logic is changed; this is presentation only.
 */

const DATE_WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const EVENTS_CACHE_TTL_MS = 10 * 60 * 1000;
const ODDS_CACHE_TTL_MS = 2 * 60 * 1000;

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
    window.localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    /* best-effort */
  }
}

/** Reference format: "17/06/2026 14:00:00". */
function formatFullDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return formatLocal(dateString, "dd/MM/yyyy HH:mm:ss");
  } catch {
    return "";
  }
}

/** One price box — blue for back, pink for lay (the reference palette). */
function Price({ value, side }: { value: number | null; side: "back" | "lay" }) {
  return (
    <div
      className={`flex h-full min-h-9 flex-1 items-center justify-center text-[13px] font-bold tabular-nums text-slate-900 sm:text-base ${
        side === "back" ? "bg-[var(--dx-back)]" : "bg-[var(--dx-lay)]"
      }`}
    >
      {value ?? "-"}
    </div>
  );
}

/** A 1 / X / 2 column = a back+lay pair. Equal-width on mobile (the row stacks
 *  full-width), fixed-width on desktop (side-by-side with the match name). */
function OddsPair({ back, lay }: { back: number | null; lay: number | null }) {
  return (
    <div className="flex flex-1 sm:w-40 sm:flex-none">
      <Price value={back} side="back" />
      <Price value={lay} side="lay" />
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
  market: any | null;
  betCount?: number;
}) {
  const runners: any[] = market?.runners ?? [];
  const priceAt = (i: number) => {
    const r = runners[i];
    if (!r) return { back: null, lay: null };
    return { back: r.back?.[0]?.price ?? null, lay: r.lay?.[0]?.price ?? null };
  };
  const team1 = priceAt(0);
  const draw = runners.length >= 3 ? priceAt(1) : { back: null, lay: null };
  const team2 = priceAt(runners.length >= 3 ? 2 : 1);

  return (
    <Link
      href={`/sports/${sport}/${match.seriesId}/${match.id}`}
      // Stacked on phones (name on top, odds below); side-by-side from sm up.
      className="block border-b border-slate-200 bg-[#f4f5f7] transition-colors hover:bg-[#e9eef4] sm:flex sm:items-stretch"
    >
      {/* Game name + date + status icons */}
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 pt-2 pb-1 sm:py-2">
        <span className="truncate text-sm font-medium text-slate-800 sm:text-[15px]">
          {match.name || "Untitled Match"}
          {match.openDate && (
            <span className="text-slate-500"> / {formatFullDate(match.openDate)}</span>
          )}
        </span>
        {betCount != null && betCount > 0 && (
          <span className="shrink-0 rounded bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-slate-900">
            {betCount}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 pl-2 text-slate-500">
          {match.inPlay && (
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" title="In-Play" />
          )}
          {match.inPlay && <Tv className="h-4 w-4 text-slate-600" />}
          <span className="rounded bg-slate-100 px-1 text-[10px] font-bold text-slate-500">f</span>
          <span className="rounded bg-slate-100 px-1 text-[10px] font-bold text-slate-500">BM</span>
        </span>
      </div>

      {/* Mobile-only 1 / X / 2 column labels (the desktop table header is hidden
          on phones, so each stacked row carries its own labels). */}
      <div className="flex gap-px px-1 text-center text-[13px] font-bold text-slate-600 sm:hidden">
        <span className="flex-1">1</span>
        <span className="flex-1">X</span>
        <span className="flex-1">2</span>
      </div>

      {/* Odds columns — full-width stacked on mobile, fixed columns on desktop. */}
      <div className="flex items-stretch gap-px px-1 pb-1.5 sm:shrink-0 sm:px-0 sm:pr-1 sm:pb-0">
        <OddsPair back={team1.back} lay={team1.lay} />
        <OddsPair back={draw.back} lay={draw.lay} />
        <OddsPair back={team2.back} lay={team2.lay} />
      </div>
    </Link>
  );
}

export function DiamondMarketTable({
  sport,
  eventTypeId,
}: {
  sport: string;
  eventTypeId: string;
}) {
  const { data: liveMatches = [], isLoading: matchesLoading } = useMatchesList(eventTypeId);

  const eventsCacheKey = `cml:events:v2:${eventTypeId}`;
  const oddsCacheKey = `cml:odds:v2:${eventTypeId}`;

  const [cachedEvents, setCachedEvents] = useState<MatchListItem[] | null>(null);
  const [cachedOddsMap, setCachedOddsMap] = useState<Record<string, any>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCachedEvents(readCache<MatchListItem[]>(eventsCacheKey, EVENTS_CACHE_TTL_MS));
    setCachedOddsMap(readCache<Record<string, any>>(oddsCacheKey, ODDS_CACHE_TTL_MS) ?? {});
    setHydrated(true);
  }, [eventsCacheKey, oddsCacheKey]);

  const { startMs, endMs } = useMemo(() => {
    const tz = getUserTimezone();
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
    const start = fromZonedTime(`${todayStr}T00:00:00`, tz).getTime();
    return { startMs: start, endMs: start + DATE_WINDOW_DAYS * DAY_MS };
  }, []);

  const isPolitics = eventTypeId === "500";
  const filteredMatches = useMemo(() => {
    if (isPolitics) return liveMatches;
    return liveMatches.filter((m) => {
      if (!m.openDate) return true;
      const t = new Date(m.openDate).getTime();
      if (isNaN(t)) return true;
      return t >= startMs && t < endMs;
    });
  }, [liveMatches, startMs, endMs, isPolitics]);

  useEffect(() => {
    if (filteredMatches.length > 0) writeCache(eventsCacheKey, filteredMatches);
  }, [filteredMatches, eventsCacheKey]);

  const allMatches = filteredMatches.length > 0 ? filteredMatches : cachedEvents ?? [];

  const liveItems = useMemo(
    () => allMatches.map((m) => ({ eventId: String(m.id), marketId: m.defaultMarketId })),
    [allMatches]
  );
  const { oddsByMarketId } = useLiveMultimarket(liveItems, eventTypeId);

  useEffect(() => {
    if (Object.keys(oddsByMarketId).length > 0) writeCache(oddsCacheKey, oddsByMarketId);
  }, [oddsByMarketId, oddsCacheKey]);

  const marketMap =
    Object.keys(oddsByMarketId).length > 0 ? oddsByMarketId : cachedOddsMap;

  if (!hydrated && matchesLoading) {
    return (
      <div className="space-y-1 p-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    );
  }

  if (allMatches.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        No matches available right now. Check back later.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header: Game | 1 | X | 2 — desktop only; phones use per-row labels. */}
      <div className="hidden items-stretch border-b border-slate-300 bg-[#e8eaed] text-[13px] font-bold text-slate-600 sm:flex">
        <div className="flex-1 px-3 py-2">Game</div>
        <div className="flex shrink-0 items-stretch gap-px pr-1">
          <div className="flex w-40 items-center justify-center">1</div>
          <div className="flex w-40 items-center justify-center">X</div>
          <div className="flex w-40 items-center justify-center">2</div>
        </div>
      </div>

      {/* Rows */}
      <div>
        {allMatches.map((match) => (
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
}
