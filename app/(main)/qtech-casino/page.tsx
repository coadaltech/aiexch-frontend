"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeftRight,
  CircleDot,
  Club,
  Dices,
  Diamond,
  Flame,
  Gamepad2,
  Gem,
  LayoutGrid,
  Layers,
  Play,
  RefreshCw,
  Rocket,
  Search,
  Spade,
  Star,
  Ticket,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { qtechCasinoApi, casinoAceApi } from "@/lib/api";

/**
 * Unified Live Casino lobby.
 *
 * One page that shows games from BOTH providers — QTech (live data from QT
 * Platform) and Ace (our DB) — merged and split into casino categories via a
 * top category bar (reference-style). Each tile launches the right provider's
 * real-money game page (authed; the user's wallet balance shows inside QT).
 */

// ── Normalized game shape used by the grid ────────────────────────────────
interface CasinoGame {
  key: string;
  source: "qtech" | "ace";
  href: string;
  name: string;
  provider: string;
  thumbnailUrl: string | null;
  cat: string; // category bucket key
}

// Ordered category catalogue. Only buckets that actually have games are shown.
const CATS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "LIVECASINO", label: "Live Casino", icon: Spade },
  { key: "ROULETTE", label: "Roulette", icon: CircleDot },
  { key: "TEENPATTI", label: "Teen Patti", icon: Layers },
  { key: "ANDARBAHAR", label: "Andar Bahar", icon: Layers },
  { key: "DRAGONTIGER", label: "Dragon Tiger", icon: Flame },
  { key: "BACCARAT", label: "Baccarat", icon: Diamond },
  { key: "BLACKJACK", label: "Black Jack", icon: Club },
  { key: "POKER", label: "Poker", icon: Club },
  { key: "TABLE", label: "Table Games", icon: Dices },
  { key: "SLOTS", label: "Slots", icon: Gem },
  { key: "INSTANTWIN", label: "Instant Win", icon: Zap },
  { key: "CRASH", label: "Crash", icon: Rocket },
  { key: "LOTTERY", label: "Lottery", icon: Ticket },
  { key: "OTHER", label: "Other", icon: Gamepad2 },
];
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.key, c.label]));

function bucketOf(name: string, category: string | null): string {
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

export default function LiveCasinoPage() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Fetch both providers; one failing must not blank the other.
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["live-casino", "all-games"],
    queryFn: async (): Promise<CasinoGame[]> => {
      const [qt, ace] = await Promise.allSettled([
        qtechCasinoApi.listGames(),
        casinoAceApi.listGames(),
      ]);

      const out: CasinoGame[] = [];

      if (qt.status === "fulfilled") {
        for (const g of qt.value.data.games ?? []) {
          out.push({
            key: `qtech:${g.id}`,
            source: "qtech",
            href: `/qtech-casino/play/${encodeURIComponent(g.id)}`,
            name: g.name,
            provider: g.provider || "QTech",
            thumbnailUrl: g.thumbnailUrl,
            cat: bucketOf(g.name, g.category),
          });
        }
      }

      if (ace.status === "fulfilled") {
        for (const g of ace.value.data.games ?? []) {
          out.push({
            key: `ace:${g.externalId}`,
            source: "ace",
            href: `/casino-ace/play/${g.externalId}`,
            name: g.name,
            provider: g.specialNote || "Ace",
            thumbnailUrl: g.thumbnailUrl,
            cat: "LIVECASINO", // Ace catalogue is live casino
          });
        }
      }

      // Surface an error only if BOTH failed.
      if (qt.status === "rejected" && ace.status === "rejected") {
        const msg =
          (qt.reason as any)?.response?.data?.message ??
          (qt.reason as any)?.message ??
          "Both providers failed";
        throw new Error(msg);
      }
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });

  const games = data ?? [];

  // Category tabs that actually have games, in catalogue order, with counts.
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of games) counts.set(g.cat, (counts.get(g.cat) ?? 0) + 1);
    const present = CATS.filter((c) => counts.has(c.key)).map((c) => ({
      ...c,
      count: counts.get(c.key)!,
    }));
    return [{ key: "ALL", label: "Lobby", icon: LayoutGrid, count: games.length }, ...present];
  }, [games]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games.filter((g) => {
      if (activeCat !== "ALL" && g.cat !== activeCat) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [games, activeCat, search]);

  const thumbOrigins = useMemo(() => {
    const set = new Set<string>();
    for (const g of games) {
      if (!g.thumbnailUrl) continue;
      try {
        set.add(new URL(g.thumbnailUrl).origin);
      } catch {
        /* ignore */
      }
    }
    return Array.from(set);
  }, [games]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0d1117]">
      {thumbOrigins.map((o) => (
        <link key={o} rel="preconnect" href={o} crossOrigin="anonymous" />
      ))}

      {/* ── Casino category bar (replaces the normal nav on this page) ── */}
      <div className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-white/10 bg-[#11161d] px-2 py-2 scrollbar-hide sm:gap-2 sm:px-3">
        <button
          onClick={() => router.push("/home")}
          className="mr-1 flex shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-[#ede105] px-4 py-2 text-black transition hover:brightness-95"
          title="Back to Exchange"
        >
          <ArrowLeftRight className="h-5 w-5" />
          <span className="text-[11px] font-bold leading-none">Exchange</span>
        </button>

        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeCat === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveCat(t.key)}
              className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-md px-4 py-2 transition-colors ${
                active
                  ? "bg-white/10 text-[#ede105]"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
              title={`${t.label} (${t.count})`}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap text-[11px] font-semibold leading-none sm:text-xs">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar: count + search + refresh ── */}
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <h2 className="text-sm font-semibold text-white">
          {activeCat === "ALL" ? "All games" : CAT_LABEL[activeCat] ?? activeCat}
        </h2>
        <span className="text-xs text-gray-400">{filtered.length}</span>

        <div className="relative ml-auto w-44 sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games…"
            className="h-8 w-full rounded-md border border-white/10 bg-[#1a212b] pl-8 pr-7 text-sm text-white outline-none placeholder:text-gray-500 focus:ring-1 focus:ring-[#ede105]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1a212b] px-2.5 py-1.5 text-sm text-gray-200 hover:bg-white/5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Grid (scrolls) ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-md bg-neutral-800">
                <Skeleton className="aspect-[4/3] w-full rounded-none bg-neutral-700" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-3.5 w-3/4 bg-neutral-700" />
                  <Skeleton className="h-2.5 w-1/3 bg-neutral-700" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Could not load casino games.</span>
            </div>
            <p className="mt-1 text-sm">{(error as Error)?.message ?? "Unknown error"}</p>
            <p className="mt-2 text-xs text-red-300/70">
              On a local box, QT only accepts our whitelisted server IP — games load from the
              deployed backend.
            </p>
          </div>
        )}

        {!isLoading && !isError && games.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 p-12 text-center text-gray-400">
            No games available yet.
          </div>
        )}

        {games.length > 0 && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 p-12 text-center text-gray-400">
            No games match your filters.
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((g) => (
              <GameTile key={g.key} game={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameTile({ game }: { game: CasinoGame }) {
  return (
    <Link
      href={game.href}
      className="group block overflow-hidden rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ede105]"
    >
      <div className="overflow-hidden rounded-md bg-[#1a212b] shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
          {game.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.thumbnailUrl}
              alt={game.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-gray-500">
              {game.name}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/50 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-full bg-[#ede105] px-3.5 py-1.5 text-xs font-bold text-black shadow-lg">
              <Play className="h-3.5 w-3.5 fill-black" />
              Play Now
            </span>
          </div>
        </div>

        <div className="px-3 py-2">
          <p className="text-[10px] font-medium uppercase leading-none text-gray-400">
            {CAT_LABEL[game.cat] ?? "Game"}
          </p>
          <p
            className="mt-1 truncate text-sm font-bold uppercase tracking-wide text-white"
            title={game.name}
          >
            {game.name}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="truncate text-[11px] font-medium text-gray-400" title={game.provider}>
              {game.provider}
            </span>
            <Star className="h-3 w-3 shrink-0 fill-gray-500 text-gray-500" />
          </div>
        </div>
      </div>
    </Link>
  );
}
