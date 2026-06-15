"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { qtechCasinoApi, casinoAceApi } from "@/lib/api";

/**
 * Casino game loading — split per provider so the lobby renders progressively.
 *
 * Ace games come from our own DB (fast); QTech games are proxied from the QT
 * Platform (slower, up to ~500 games, cached 5 min server-side). Fetching them
 * as two independent queries means the grid paints as soon as EITHER resolves,
 * instead of blocking on the slowest provider. Results are cached aggressively
 * so navigating back into the casino is instant.
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
  if (/roulette/.test(s)) return "ROULETTE";
  if (/baccarat/.test(s)) return "BACCARAT";
  if (/black\s*jack/.test(s)) return "BLACKJACK";
  if (/dragon/.test(s)) return "DRAGONTIGER";
  if (/teen\s*patti/.test(s)) return "TEENPATTI";
  if (/andar|bahar/.test(s)) return "ANDARBAHAR";
  if (/poker|hold.?em/.test(s)) return "POKER";
  if (/lottery|lotto|keno/.test(s)) return "LOTTERY";
  if (/crash/.test(s)) return "CRASH";
  const parts = (category ?? "").toUpperCase().split("/");
  if (parts.some((p) => p.includes("LIVE"))) return "LIVECASINO";
  if (parts.some((p) => p.includes("SLOT"))) return "SLOTS";
  if (parts.some((p) => p.includes("TABLE"))) return "TABLE";
  if (parts.some((p) => p.includes("INSTANT"))) return "INSTANTWIN";
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

async function fetchQtechGames(): Promise<CasinoGame[]> {
  const res = await qtechCasinoApi.listGames();
  return (res.data.games ?? []).map((g) => ({
    key: `qtech:${g.id}`,
    source: "qtech" as const,
    href: `/casino/play/${encodeURIComponent(g.id)}`,
    name: g.name,
    provider: g.provider || "QTech",
    thumbnailUrl: g.thumbnailUrl,
    cat: bucketOf(g.name, g.category),
  }));
}

const SHARED_OPTS = {
  staleTime: 5 * 60 * 1000, // matches the backend cache window
  gcTime: 30 * 60 * 1000, // keep in memory so re-entry is instant
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

export function useAceGames() {
  return useQuery({ queryKey: ACE_KEY, queryFn: fetchAceGames, ...SHARED_OPTS });
}

export function useQtechGames() {
  return useQuery({ queryKey: QTECH_KEY, queryFn: fetchQtechGames, ...SHARED_OPTS });
}

/** Warm the lobby cache ahead of navigation (e.g. on app idle). No-ops while fresh. */
export function prefetchCasinoGames(queryClient: QueryClient) {
  queryClient.prefetchQuery({ queryKey: QTECH_KEY, queryFn: fetchQtechGames, ...SHARED_OPTS });
}
