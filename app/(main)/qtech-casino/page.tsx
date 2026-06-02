"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Logo from "@/components/layout/logo";
import { CasinoWallet } from "@/components/casino/casino-wallet";
import { CasinoUserMenu } from "@/components/casino/casino-user-menu";
import { useSettings } from "@/hooks/usePublic";
import { useQtechGames, type CasinoGame } from "@/hooks/useCasinoGames";

/**
 * Casino lobby (QTech).
 *
 * Shows the QTech catalogue (live data from QT Platform, cached server-side).
 * Tiles render in batches and images lazy-load, so a 500-game catalogue still
 * feels instant. Each tile launches the provider's real-money game page.
 */

// How many tiles to render initially / per scroll batch. Keeps the first paint
// cheap even when the full catalogue is hundreds of games.
const PAGE_SIZE = 48;

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

export default function LiveCasinoPage() {
  const router = useRouter();
  const { data: settings } = useSettings();
  const [activeCat, setActiveCat] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const qt = useQtechGames();

  const games = useMemo<CasinoGame[]>(() => qt.data ?? [], [qt.data]);

  const isLoading = games.length === 0 && qt.isLoading;
  const isError = qt.isError;
  const error = qt.error;
  const isFetching = qt.isFetching;
  const refetch = useCallback(() => {
    qt.refetch();
  }, [qt]);

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

  // ── Incremental rendering ───────────────────────────────────────────────
  // Render the catalogue in batches so the first paint stays cheap even with
  // hundreds of games. A sentinel near the bottom reveals the next batch as the
  // user scrolls. Reset when the filter/search changes.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCat, search]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= filtered.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "600px" }, // start loading the next batch before it's on screen
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visibleCount, filtered.length]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0d1117]">
      {thumbOrigins.map((o) => (
        <link key={o} rel="preconnect" href={o} crossOrigin="anonymous" />
      ))}

      {/* ── Casino header bar (full custom header — no white app header here) ── */}
      <div className="flex shrink-0 items-stretch border-b border-white/10 bg-[#0e1218]">
        {/* Brand */}
        <div className="flex shrink-0 items-center border-r border-white/10 pl-3 pr-3 sm:pl-4">
          <Logo onClick={() => router.push("/home")} settings={settings} />
        </div>

        <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto px-2 py-2 scrollbar-hide sm:gap-2 sm:px-3">
          <button
            onClick={() => router.push("/home")}
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-md px-4 py-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            title="Back to Exchange"
          >
            <ArrowLeftRight className="h-5 w-5" />
            <span className="whitespace-nowrap text-[11px] font-semibold leading-none sm:text-xs">
              Exchange
            </span>
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

        {/* BAL / LIAB — replaces the header's balance+exposure on casino pages */}
        <div className="flex shrink-0 items-center gap-1.5 border-l border-white/10 px-2 sm:px-3">
          <button
            onClick={() => refetch()}
            title="Refresh"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <CasinoWallet />
          <CasinoUserMenu />
        </div>
      </div>

      {/* ── Toolbar: count + search ── */}
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
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visible.map((g) => (
                <GameTile key={g.key} game={g} />
              ))}
            </div>
            {/* Reveals the next batch as it nears the viewport */}
            {visibleCount < filtered.length && (
              <div ref={sentinelRef} className="h-10" aria-hidden />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GameTile({ game }: { game: CasinoGame }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Link
      href={game.href}
      // content-visibility lets the browser skip layout/paint for tiles far
      // off-screen — keeps scrolling a large grid smooth.
      style={{ contentVisibility: "auto", containIntrinsicSize: "180px" }}
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
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
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
