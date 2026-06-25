"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { useAceGames, useQtechGames, type CasinoGame } from "@/hooks/useCasinoGames";

/**
 * DIAMOND home casino grid — a dense thumbnail grid with a teal name bar, shown
 * on the exchange home page below the match table (the reference layout). The
 * games come from the same lobby hooks the casino page uses (QTech + Ace), so
 * the catalogue and play links are identical; this is a curated preview that
 * links through to the full lobby. Presentation only — no new data wiring.
 */

// A preview slice — the full catalogue lives on /casino. The grid is ~10 wide on
// desktop, so this fills a few tidy rows without streaming the whole list.
const PREVIEW_LIMIT = 40;

function CasinoTile({ game }: { game: CasinoGame }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Link
      href={game.href}
      // content-visibility lets the browser skip layout/paint for tiles far
      // off-screen — keeps the dense grid smooth.
      style={{ contentVisibility: "auto", containIntrinsicSize: "160px" }}
      className="group block overflow-hidden bg-white"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-900">
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
          <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-gray-400">
            {game.name}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded bg-black/80 px-3 py-1.5 text-xs font-bold text-white">
            <Play className="h-4 w-4 fill-white" />
            Play
          </span>
        </div>
      </div>
      <div
        className="truncate bg-[var(--dx-casino-label)] px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-white"
        title={game.name}
      >
        {game.name}
      </div>
    </Link>
  );
}

export function DiamondCasinoGrid() {
  const qt = useQtechGames();
  const ace = useAceGames();

  const games = useMemo<CasinoGame[]>(() => {
    const qtGames = qt.data?.pages.flatMap((p) => p.games) ?? [];
    const merged = [...qtGames, ...(ace.data ?? [])];
    const seen = new Set<string>();
    const unique: CasinoGame[] = [];
    for (const g of merged) {
      if (seen.has(g.key)) continue;
      seen.add(g.key);
      unique.push(g);
      if (unique.length >= PREVIEW_LIMIT) break;
    }
    return unique;
  }, [qt.data, ace.data]);

  if (games.length === 0) return null;

  return (
    <section className="border-t border-slate-300">
      <div className="flex items-center justify-between bg-[var(--dx-nav)] px-3 py-2">
        <h2 className="text-[15px] font-bold uppercase tracking-wide text-white">
          Casino Games
        </h2>
        <Link
          href="/casino"
          className="text-[12px] font-bold uppercase tracking-wide text-white/90 hover:text-white"
        >
          View all
        </Link>
      </div>

      {/* gap-px over a slate background draws a hairline grid between tiles. */}
      <div className="grid grid-cols-3 gap-px bg-slate-200 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {games.map((g) => (
          <CasinoTile key={g.key} game={g} />
        ))}
      </div>
    </section>
  );
}
