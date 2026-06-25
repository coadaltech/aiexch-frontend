"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fromZonedTime } from "date-fns-tz";
import { Info, type LucideIcon } from "lucide-react";
import { useMatchesList, type MatchListItem } from "@/hooks/useSportsApi";
import { useLiveMultimarket } from "@/hooks/useLiveMultimarket";
import { formatLocal, getUserTimezone } from "@/lib/date-utils";

/**
 * TomExch sport section — a dark header bar (icon + title + See All) over match
 * rows with the match name, "Matched:" total and the 1 / X / 2 back/lay odds
 * grid. The DATA wiring (useMatchesList + useLiveMultimarket + the date-window
 * and runner-price mapping) mirrors the Diamond market table, so odds, live
 * updates and behaviour are identical — only the markup is TomExch.
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

/** Reference time label: "Today 21:30" / "Tomorrow 17:30" / "25 Jun 14:00". */
function formatWhen(dateString: string | null): { day: string; time: string } {
  if (!dateString) return { day: "", time: "" };
  try {
    const time = formatLocal(dateString, "HH:mm");
    const d = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    let day = formatLocal(dateString, "dd MMM");
    if (sameDay(d, today)) day = "Today";
    else if (sameDay(d, tomorrow)) day = "Tomorrow";
    return { day, time };
  } catch {
    return { day: "", time: "" };
  }
}

function formatMatched(v: unknown): string | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  if (!isFinite(n) || n <= 0) return null;
  return n.toLocaleString("en-IN");
}

/** Compact volume label: 318680 → "318.68K", 194 → "194". */
function formatSize(v: unknown): string {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  if (!isFinite(n) || n <= 0) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
  return String(Math.round(n));
}

type Cell = { price: number | null; size: number | null };

/** One rounded odds button — price on top, matched size below (blue / pink).
 *  Compact on phones (price only, smaller); full size + size line from sm up. */
function Price({ cell, side }: { cell: Cell; side: "back" | "lay" }) {
  const size = formatSize(cell.size);
  return (
    <div
      style={{
        background: side === "back" ? "var(--tx-back-grad)" : "var(--tx-lay-grad)",
      }}
      className={`flex h-9 w-10 shrink-0 flex-col items-center justify-center rounded-md leading-none tabular-nums sm:h-11 sm:w-[4.5rem] sm:rounded-lg ${
        cell.price == null ? "opacity-40" : ""
      }`}
    >
      <span className="text-[13px] font-bold text-[#163a5e] sm:text-base">
        {cell.price ?? ""}
      </span>
      {size && (
        <span className="mt-0.5 hidden text-[11px] font-medium text-[#3a5b78] sm:block">
          {size}
        </span>
      )}
    </div>
  );
}

/** A 1 / X / 2 column = a back+lay pair, each a rounded button with price + size. */
function OddsPair({ back, lay }: { back: Cell; lay: Cell }) {
  return (
    <div className="flex shrink-0 gap-1 sm:gap-1.5">
      <Price cell={back} side="back" />
      <Price cell={lay} side="lay" />
    </div>
  );
}

function MatchRow({
  match,
  sport,
  market,
}: {
  match: MatchListItem;
  sport: string;
  market: any | null;
}) {
  const runners: any[] = market?.runners ?? [];
  const empty: { back: Cell; lay: Cell } = {
    back: { price: null, size: null },
    lay: { price: null, size: null },
  };
  const priceAt = (i: number) => {
    const r = runners[i];
    if (!r) return empty;
    return {
      back: { price: r.back?.[0]?.price ?? null, size: r.back?.[0]?.size ?? null },
      lay: { price: r.lay?.[0]?.price ?? null, size: r.lay?.[0]?.size ?? null },
    };
  };
  const team1 = priceAt(0);
  const draw = runners.length >= 3 ? priceAt(1) : empty;
  const team2 = priceAt(runners.length >= 3 ? 2 : 1);
  const when = formatWhen(match.openDate);
  const matched = formatMatched(market?.totalMatched ?? (market as any)?.matched);

  return (
    <Link
      href={`/sports/${sport}/${match.seriesId}/${match.id}`}
      className="flex items-stretch border-b border-slate-200 bg-white transition-colors hover:bg-slate-50"
    >
      {/* Time / In-Play column — green In-Play badge, else a grey date/time box. */}
      <div
        className={`flex w-16 shrink-0 items-center justify-center self-stretch border-r border-slate-200 text-center sm:w-24 ${
          match.inPlay ? "bg-[#1b7a3d]" : "bg-[#f1f1f1]"
        }`}
      >
        {match.inPlay ? (
          <span className="text-[12px] font-semibold text-white sm:text-[13px]">In-Play</span>
        ) : (
          <span className="px-1 text-[11.5px] leading-tight text-[#333] sm:px-1.5 sm:text-[12.5px]">
            {when.day} {when.time}
          </span>
        )}
      </div>

      {/* Match name */}
      <div className="flex min-w-0 flex-1 items-center px-2 py-2 sm:px-3">
        <span className="truncate text-[13px] font-bold text-[var(--tx-link)] sm:text-[16px]">
          {match.name || "Untitled Match"}
        </span>
      </div>

      {/* Matched + odds */}
      <div className="flex shrink-0 items-center gap-1 pr-1.5 sm:gap-2 sm:pr-2">
        {matched && (
          <span className="hidden w-28 shrink-0 text-right text-[12px] leading-tight text-slate-500 md:block">
            Matched:
            <br />
            <span className="font-semibold text-slate-700">{matched}</span>
          </span>
        )}
        <div className="flex items-stretch gap-1 py-1.5 sm:gap-1.5">
          <OddsPair back={team1.back} lay={team1.lay} />
          <OddsPair back={draw.back} lay={draw.lay} />
          <OddsPair back={team2.back} lay={team2.lay} />
        </div>
        <Info className="hidden h-4 w-4 shrink-0 text-[var(--tx-link)] sm:block" />
      </div>
    </Link>
  );
}

export function TomexchMarketSection({
  title,
  icon: Icon,
  sport,
  eventTypeId,
  seeAllHref,
  maxMatches = 4,
}: {
  title: string;
  icon: LucideIcon;
  sport: string;
  eventTypeId: string;
  seeAllHref: string;
  maxMatches?: number;
}) {
  const { data: liveMatches = [] } = useMatchesList(eventTypeId);

  const eventsCacheKey = `tx:events:v1:${eventTypeId}`;
  const oddsCacheKey = `tx:odds:v1:${eventTypeId}`;

  const [cachedEvents, setCachedEvents] = useState<MatchListItem[] | null>(null);
  const [cachedOddsMap, setCachedOddsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    setCachedEvents(readCache<MatchListItem[]>(eventsCacheKey, EVENTS_CACHE_TTL_MS));
    setCachedOddsMap(readCache<Record<string, any>>(oddsCacheKey, ODDS_CACHE_TTL_MS) ?? {});
  }, [eventsCacheKey, oddsCacheKey]);

  const { startMs, endMs } = useMemo(() => {
    const tz = getUserTimezone();
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
    const start = fromZonedTime(`${todayStr}T00:00:00`, tz).getTime();
    return { startMs: start, endMs: start + DATE_WINDOW_DAYS * DAY_MS };
  }, []);

  const isPolitics = eventTypeId === "500";
  const filteredMatches = useMemo(() => {
    const base = isPolitics
      ? liveMatches
      : liveMatches.filter((m) => {
          if (!m.openDate) return true;
          const t = new Date(m.openDate).getTime();
          if (isNaN(t)) return true;
          return t >= startMs && t < endMs;
        });
    return base;
  }, [liveMatches, startMs, endMs, isPolitics]);

  useEffect(() => {
    if (filteredMatches.length > 0) writeCache(eventsCacheKey, filteredMatches);
  }, [filteredMatches, eventsCacheKey]);

  const allMatches =
    filteredMatches.length > 0 ? filteredMatches : cachedEvents ?? [];

  // Subscribe to a buffer (2× the slot count) so events without live prices can
  // be dropped and a slot still filled — exactly how the Default theme's list
  // works, so odds populate for every sport (incl. Soccer), not just Cricket.
  const oddsCandidates = useMemo(() => {
    const bufferedLimit = maxMatches ? maxMatches * 2 : allMatches.length;
    return allMatches.slice(0, bufferedLimit);
  }, [allMatches, maxMatches]);

  const liveItems = useMemo(
    () =>
      oddsCandidates.map((m) => ({
        eventId: String(m.id),
        marketId: m.defaultMarketId,
      })),
    [oddsCandidates],
  );
  const { oddsByMarketId } = useLiveMultimarket(liveItems, eventTypeId);

  useEffect(() => {
    if (Object.keys(oddsByMarketId).length > 0) writeCache(oddsCacheKey, oddsByMarketId);
  }, [oddsByMarketId, oddsCacheKey]);

  const marketMap =
    Object.keys(oddsByMarketId).length > 0 ? oddsByMarketId : cachedOddsMap;

  // Prefer events that actually have live prices; fall back to the candidates so
  // the section still paints (rows show "-" until the first WS tick lands).
  const matchesWithPrices = oddsCandidates.filter((m) => {
    const market = marketMap[m.defaultMarketId];
    if (!market) return false;
    const runners: any[] = market.runners ?? [];
    return runners.some(
      (r: any) => r.back?.[0]?.price != null || r.lay?.[0]?.price != null,
    );
  });

  const visibleMatches = (
    matchesWithPrices.length > 0 ? matchesWithPrices : oddsCandidates
  ).slice(0, maxMatches);

  if (visibleMatches.length === 0) return null;

  return (
    <section className="mx-2 mb-2 overflow-hidden rounded-t-xl border border-slate-200 shadow-sm">
      {/* Section header bar */}
      <div className="flex items-center justify-between bg-[var(--tx-section)] px-3 py-2 text-white">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <Icon className="h-4 w-4" />
          {title}
        </h2>
        <Link
          href={seeAllHref}
          className="flex items-center gap-0.5 text-[13px] font-semibold text-white/90 hover:text-white"
        >
          See All ›
        </Link>
      </div>

      {/* Mobile-only column labels (Coming Up · 1 / X / 2), right-anchored to line
          up with each row's odds. Desktop keeps the inline layout without it. */}
      <div className="flex items-center border-b border-slate-200 bg-slate-100 text-[12px] font-bold text-slate-600 sm:hidden">
        <span className="flex-1 px-2 py-1">Coming Up</span>
        <div className="flex shrink-0 gap-1 pr-1.5">
          <span className="w-[5.25rem] py-1 text-center">1</span>
          <span className="w-[5.25rem] py-1 text-center">X</span>
          <span className="w-[5.25rem] py-1 text-center">2</span>
        </div>
      </div>

      <div>
        {visibleMatches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            sport={sport}
            market={marketMap[match.defaultMarketId] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
