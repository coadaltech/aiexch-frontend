"use client";

import { useEffect } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";

import { qtechCasinoApi, casinoAceApi } from "@/lib/api";

/**
 * Casino game loading — split per provider so the lobby renders progressively.
 *
 * Ace games come from our own DB (fast); QTech games are proxied from the QT
 * Platform and loaded ONE page at a time (cursor pagination, cached 5 min
 * server-side) — the lobby pulls the next page on scroll / category change, so
 * the first paint is quick and there is no full-catalogue timeout. Fetching the
 * two providers as independent queries means the grid paints as soon as EITHER
 * resolves, instead of blocking on the slowest provider. Results are cached
 * aggressively so navigating back into the casino is instant.
 */

// ── Normalized game shape used by the grid ────────────────────────────────
export interface CasinoGame {
  key: string;
  source: "qtech" | "ace";
  href: string;
  name: string;
  provider: string;
  thumbnailUrl: string | null;
  cat: string; // category bucket key
}

export function bucketOf(name: string, category: string | null): string {
  const s = `${category ?? ""} ${name}`.toLowerCase();
  // Lightning-branded titles (Lightning Roulette/Dice/…) get their own tab, so
  // this must run before the roulette/table checks below.
  if (/lightning/.test(s)) return "LIGHTNING";
  if (/roulette/.test(s)) return "ROULETTE";
  if (/baccarat/.test(s)) return "BACCARAT";
  if (/black\s*jack/.test(s)) return "BLACKJACK";
  if (/dragon/.test(s)) return "DRAGONTIGER";
  if (/teen\s*patti/.test(s)) return "TEENPATTI";
  if (/andar|bahar/.test(s)) return "ANDARBAHAR";
  // Hold'em is split out from the general Poker bucket.
  if (/hold.?em/.test(s)) return "HOLDEM";
  if (/poker/.test(s)) return "POKER";
  if (/lottery|lotto|keno/.test(s)) return "LOTTERY";
  // Crash games are folded into the Instant Win bucket.
  if (/crash/.test(s)) return "INSTANTWIN";
  const parts = (category ?? "").toUpperCase().split("/");
  if (parts.some((p) => p.includes("LIVE"))) return "LIVECASINO";
  if (parts.some((p) => p.includes("SLOT"))) return "SLOTS";
  if (parts.some((p) => p.includes("TABLE"))) return "TABLE";
  if (parts.some((p) => p.includes("INSTANT") || p.includes("CRASH"))) return "INSTANTWIN";
  return "OTHER";
}

const ACE_KEY = ["casino-games", "ace"] as const;
const QTECH_KEY = ["casino-games", "qtech"] as const;

async function fetchAceGames(): Promise<CasinoGame[]> {
  const res = await casinoAceApi.listGames();
  return (res.data.games ?? []).map((g) => ({
    key: `ace:${g.externalId}`,
    source: "ace" as const,
    href: `/casino-ace/play/${g.externalId}`,
    name: g.name,
    provider: g.specialNote || "Ace",
    thumbnailUrl: g.thumbnailUrl,
    cat: "RVCASINO", // Ace (RV Gaming) catalogue → "RV Casino" tab
  }));
}

// How many games to request per QT page. Big enough to fill the first screen
// and seed the category tabs in one fast round-trip; the rest stream in as the
// user scrolls or switches category. Must mirror the backend's DEFAULT_PAGE_SIZE.
const QTECH_PAGE_SIZE = 200;

export interface QtechPage {
  games: CasinoGame[];
  totalCount: number;
  nextCursor: string | null;
}

// Fetch one cursor page of QT games and normalize it for the grid. `cursor` of
// null requests the first page.
async function fetchQtechPage(cursor: string | null): Promise<QtechPage> {
  const res = await qtechCasinoApi.listGames({
    size: QTECH_PAGE_SIZE,
    cursor: cursor ?? undefined,
  });
  const games = (res.data.games ?? []).map((g) => ({
    key: `qtech:${g.id}`,
    source: "qtech" as const,
    href: `/casino/play/${encodeURIComponent(g.id)}`,
    name: g.name,
    provider: g.provider || "QTech",
    thumbnailUrl: g.thumbnailUrl,
    cat: bucketOf(g.name, g.category),
  }));
  return {
    games,
    totalCount: res.data.totalCount ?? games.length,
    nextCursor: res.data.nextCursor ?? null,
  };
}

const SHARED_OPTS = {
  staleTime: 5 * 60 * 1000, // matches the backend cache window
  gcTime: 30 * 60 * 1000, // keep in memory so re-entry is instant
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

const QTECH_INFINITE_OPTS = {
  queryKey: QTECH_KEY,
  queryFn: ({ pageParam }: { pageParam: string | null }) => fetchQtechPage(pageParam),
  initialPageParam: null as string | null,
  // Returning undefined tells react-query there are no more pages (hasNextPage=false).
  getNextPageParam: (last: QtechPage) => last.nextCursor ?? undefined,
  ...SHARED_OPTS,
} as const;

// ── Client-local instant paint ────────────────────────────────────────────
// React-query's cache is in-memory, so a full page refresh starts empty and the
// lobby would flash a skeleton while it re-fetches. To make the first ~200 games
// appear INSTANTLY on refresh / re-entry, we persist the first loaded page to
// localStorage and seed it into the query cache on mount. The grid paints from
// it immediately, then react-query revalidates in the background (and any further
// pages re-load on scroll). Purely client-side — no extra backend load.
type QtechInfinite = InfiniteData<QtechPage, string | null>;
const QTECH_LS_KEY = "casino:qtech:first-page:v1";
const QTECH_LS_MAX_AGE = 24 * 60 * 60 * 1000; // ignore a seed older than a day

function loadQtechSeed(): QtechInfinite | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QTECH_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; pages: QtechPage[] };
    if (!parsed?.pages?.length || !parsed.pages[0]?.games?.length) return null;
    if (Date.now() - parsed.at > QTECH_LS_MAX_AGE) return null;
    // Seed only the first page; getNextPageParam derives the cursor for page 2.
    return { pages: [parsed.pages[0]], pageParams: [null] };
  } catch {
    return null;
  }
}

function saveQtechSeed(data: { pages: QtechPage[] }) {
  if (typeof window === "undefined" || !data.pages.length) return;
  try {
    // Persist just the first page — enough to paint the lobby, small enough to
    // stay well under the localStorage quota.
    window.localStorage.setItem(
      QTECH_LS_KEY,
      JSON.stringify({ at: Date.now(), pages: [data.pages[0]] }),
    );
  } catch {
    /* quota exceeded / serialization issue — non-fatal, just skip the seed */
  }
}

export function useAceGames() {
  return useQuery({ queryKey: ACE_KEY, queryFn: fetchAceGames, ...SHARED_OPTS });
}

export function useQtechGames() {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery(QTECH_INFINITE_OPTS);

  // Paint instantly from the persisted first page. Done in a mount effect (not
  // `initialData`) so the server render and the first client render match — no
  // hydration mismatch — while the seed still lands in the same frame, before
  // any network response. The query was already revalidating from mount, so
  // fresh data replaces the seed as soon as it arrives. Skipped when the
  // in-memory cache already has games (SPA back-navigation is already instant).
  useEffect(() => {
    const existing = queryClient.getQueryData<QtechInfinite>(QTECH_KEY);
    if (existing?.pages?.length) return;
    const seed = loadQtechSeed();
    if (seed) queryClient.setQueryData<QtechInfinite>(QTECH_KEY, seed);
  }, [queryClient]);

  // Keep the seed current for next time whenever fresh data arrives.
  useEffect(() => {
    if (query.data?.pages?.length) saveQtechSeed(query.data);
  }, [query.data]);

  return query;
}

/** Warm the lobby cache ahead of navigation (e.g. on app idle). No-ops while fresh. */
export function prefetchCasinoGames(queryClient: QueryClient) {
  queryClient.prefetchInfiniteQuery(QTECH_INFINITE_OPTS);
}
