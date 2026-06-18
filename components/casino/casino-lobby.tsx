"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeftRight,
  ChevronLeft,
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
import { useAceGames, useQtechGames, type CasinoGame } from "@/hooks/useCasinoGames";

/**
 * Casino lobby.
 *
 * Shows the QTech catalogue (live data from QT Platform, cached server-side).
 * Tiles render in batches and images lazy-load, so a 500-game catalogue still
 * feels instant. Each tile launches the provider's real-money game page.
 *
 * The active category is reflected in the URL: the lobby lives at `/casino`,
 * and picking a category swaps the URL to `/casino/category/<key>` (without a
 * full navigation, via the History API). `initialCat` lets the
 * `/casino/category/[category]` route render this same lobby pre-filtered.
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
  { key: "RVCASINO", label: "RV Casino", icon: Diamond },
];
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.key, c.label]));

// Build the URL that represents a given category selection. "ALL" is the bare
// lobby; everything else is a lowercased category path.
function catToPath(key: string) {
  return key === "ALL" ? "/casino" : `/casino/category/${key.toLowerCase()}`;
}

// Reverse of catToPath: read the active category back out of a pathname.
function pathToCat(pathname: string) {
  const m = pathname.match(/^\/casino\/category\/([^/]+)/);
  return m ? m[1].toUpperCase() : "ALL";
}

export default function CasinoLobby({ initialCat }: { initialCat?: string }) {
  const router = useRouter();
  const { data: settings } = useSettings();
  const [activeCat, setActiveCat] = useState<string>(initialCat ?? "ALL");
  const [search, setSearch] = useState("");

  // Selecting a category updates both the view and the URL. We use the History
  // API directly (rather than router.push) so switching categories never
  // remounts the lobby or refetches — it's an instant, in-place filter change
  // that still produces a real, shareable, back-button-able URL.
  const selectCat = useCallback((key: string) => {
    setActiveCat(key);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", catToPath(key));
    }
  }, []);

  // Keep the view in sync when the user navigates with the browser back/forward
  // buttons (which fire popstate without remounting this component).
  useEffect(() => {
    const sync = () => setActiveCat(pathToCat(window.location.pathname));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const qt = useQtechGames();
  const ace = useAceGames();

  const games = useMemo<CasinoGame[]>(
    () => [...(qt.data ?? []), ...(ace.data ?? [])],
    [qt.data, ace.data],
  );

  const isLoading = games.length === 0 && (qt.isLoading || ace.isLoading);
  const isError = qt.isError;
  const error = qt.error;
  const isFetching = qt.isFetching || ace.isFetching;
  const refetch = useCallback(() => {
    qt.refetch();
    ace.refetch();
  }, [qt, ace]);

  // Category tabs that actually have games, in catalogue order, with counts.
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of games) counts.set(g.cat, (counts.get(g.cat) ?? 0) + 1);
    const present = CATS.filter((c) => counts.has(c.key)).map((c) => ({
      ...c,
      count: counts.get(c.key)!,
    }));
    // The Lobby shows everything except RV Casino, so its count excludes it too.
    const lobbyCount = games.length - (counts.get("RVCASINO") ?? 0);
    return [{ key: "ALL", label: "Lobby", icon: LayoutGrid, count: lobbyCount }, ...present];
  }, [games]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games.filter((g) => {
      // RV Casino has its own tab; keep it out of the Lobby (ALL) view.
      if (activeCat === "ALL" && g.cat === "RVCASINO") return false;
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

  // ── Mobile category browse ──────────────────────────────────────────────
  // On phones the lobby is a two-level flow: pick a category card, then see its
  // games. (Desktop keeps the flat header-nav lobby.) RV Casino is its own tab,
  // so it's excluded from the category grid here.
  const mobileCategories = useMemo(
    () => tabs.filter((t) => t.key !== "ALL" && t.key !== "RVCASINO"),
    [tabs],
  );

  // A representative thumbnail per category (first game with an image) so the
  // category cards have artwork instead of a bare icon.
  const catThumbs = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of games) {
      if (g.thumbnailUrl && !m.has(g.cat)) m.set(g.cat, g.thumbnailUrl);
    }
    return m;
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

      {/* ── Casino header bar — DESKTOP only (full custom header) ── */}
      <div className="hidden lg:flex shrink-0 items-stretch border-b border-white/10 bg-[#0e1218]">
        {/* Brand */}
        <div className="flex shrink-0 items-center border-r border-white/10 pl-3 pr-3 sm:pl-4">
          <Logo onClick={() => router.push("/home")} settings={settings} />
        </div>

        <div className="flex min-w-0 flex-1 items-stretch gap-0.5 px-1 py-2.5 sm:gap-1 sm:px-2">
          <button
            onClick={() => router.push("/home")}
            className="flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            title="Back to Exchange"
          >
            <ArrowLeftRight className="h-5 w-5 shrink-0" />
            <span className="w-full truncate text-center text-[11px] font-semibold leading-none sm:text-xs">
              Exchange
            </span>
          </button>

          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeCat === t.key;
            return (
              <button
                key={t.key}
                onClick={() => selectCat(t.key)}
                className={`flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 transition-colors ${
                  active
                    ? "bg-white/10 text-[#ede105]"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
                title={`${t.label} (${t.count})`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="w-full truncate text-center text-[11px] font-semibold leading-none sm:text-xs">
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

      {/* ── Casino header — MOBILE only (compact, two rows) ── */}
      <div className="flex shrink-0 flex-col border-b border-white/10 bg-[#0e1218] lg:hidden">
        {/* Row 1: brand + balance/exposure + actions, all on one line */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="shrink-0">
            <Logo onClick={() => router.push("/home")} settings={settings} />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <CasinoWallet layout="inline" />
            <button
              onClick={() => refetch()}
              title="Refresh"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition hover:bg-white/5 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <CasinoUserMenu />
          </div>
        </div>

        {/* Row 2: Exchange | Casino | RV Casino */}
        <div className="flex items-stretch gap-1.5 px-3 pb-2">
          <button
            onClick={() => router.push("/home")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white/5 px-3 py-2 text-xs font-bold text-gray-200 transition-colors hover:bg-white/10"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Exchange
          </button>
          <button
            onClick={() => selectCat("ALL")}
            className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-bold transition-colors ${
              activeCat !== "RVCASINO"
                ? "bg-[#ede105] text-black"
                : "bg-white/5 text-gray-200 hover:bg-white/10"
            }`}
          >
            Casino
          </button>
          <button
            onClick={() => selectCat("RVCASINO")}
            className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-bold transition-colors ${
              activeCat === "RVCASINO"
                ? "bg-[#ede105] text-black"
                : "bg-white/5 text-gray-200 hover:bg-white/10"
            }`}
          >
            RV Casino
          </button>
        </div>
      </div>

      {/* ── Grid (scrolls) ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {/* Mobile: back-to-categories bar when browsing a single category */}
        {activeCat !== "ALL" && activeCat !== "RVCASINO" && (
          <div className="sticky top-0 z-10 -mx-3 mb-3 flex items-center gap-2 border-b border-white/10 bg-[#0d1117]/95 px-3 py-2 backdrop-blur lg:hidden">
            <button
              onClick={() => selectCat("ALL")}
              className="flex items-center gap-1 text-sm font-semibold text-[#ede105]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <span className="text-sm font-bold text-white">
              {CAT_LABEL[activeCat] ?? activeCat}
            </span>
            <span className="ml-auto text-xs text-gray-400">{filtered.length}</span>
          </div>
        )}

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

        {/* Mobile only: category picker (the "Casino" lobby level) */}
        {activeCat === "ALL" && mobileCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {mobileCategories.map((c) => (
              <CategoryCard
                key={c.key}
                label={c.label}
                count={c.count}
                icon={c.icon}
                thumb={catThumbs.get(c.key) ?? null}
                onClick={() => selectCat(c.key)}
              />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* The flat games grid. On mobile it's hidden at the "ALL" level
                (category cards show instead); for a picked category or RV it
                shows on every screen. Desktop always shows it. */}
            <div
              className={`grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
                activeCat === "ALL" ? "hidden lg:grid" : "grid"
              }`}
            >
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

// Mobile lobby card representing a whole category (artwork from a sample game).
function CategoryCard({
  label,
  count,
  icon: Icon,
  thumb,
  onClick,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  thumb: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group block overflow-hidden rounded-lg bg-[#1a212b] text-left shadow-sm transition-all duration-200 active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={label}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon className="h-10 w-10 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
          {count}
        </span>
      </div>
      <div className="px-2 py-2 text-center">
        <p className="truncate text-sm font-bold uppercase tracking-wide text-white">
          {label}
        </p>
        <div className="mt-1 flex justify-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-[#ede105] text-[#ede105]" />
          ))}
        </div>
      </div>
    </button>
  );
}

function GameTile({ game }: { game: CasinoGame }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      // content-visibility lets the browser skip layout/paint for tiles far
      // off-screen — keeps scrolling a large grid smooth.
      style={{ contentVisibility: "auto", containIntrinsicSize: "180px" }}
      className="group block overflow-hidden rounded-md"
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
          {/* Hover overlay. The card itself isn't clickable — only the Play Now
              button navigates. pointer-events-none on the backdrop keeps clicks
              elsewhere on the tile inert; the button re-enables them. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/50 group-hover:opacity-100">
            <Link
              href={game.href}
              className="pointer-events-auto flex items-center gap-1.5 rounded-md bg-black/80 hover:border-white border-2 border-black  text-white px-4.5 py-2.5 text-sm font-bold text-black shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="h-4.5 w-4.5 fill-black" />
              Play Now
            </Link>
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
    </div>
  );
}
