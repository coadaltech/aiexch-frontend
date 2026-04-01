"use client";

import { useMemo, useRef } from "react";
import { GameCard } from "./cards/game-card";
import { CasinoGameCard } from "./cards/casino-game-card";
import { Game, GameType } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHomeSections, useSectionGames } from "@/hooks/usePublic";
import { useCasinoGamesFromDb } from "@/hooks/useCasino";
import { Skeleton } from "@/components/ui/skeleton";

const CASINO_DB_SECTIONS: Array<{
  key: string;
  title: string;
  subtitle?: string;
  link: string;
  filters?: { provider?: string; type?: string; technology?: string };
}> = [
  { key: "latest", title: "Latest Casino Picks", subtitle: "Fresh drops from our providers", link: "/casino", filters: {} },
  { key: "slots",  title: "Trending Slots",       subtitle: "Spin the hottest reels",          link: "/casino?type=slots", filters: { type: "slots" } },
  { key: "table",  title: "Table Classics",        subtitle: "Roulette, Blackjack & more",      link: "/casino?type=table", filters: { type: "table" } },
];

/* ─── Shared section wrapper ─── */
function CarouselSection({
  title,
  subtitle,
  link,
  children,
  onScrollLeft,
  onScrollRight,
}: {
  title: string;
  subtitle?: string;
  link?: string;
  children: React.ReactNode;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}) {
  return (
    <div className="bg-[#0a2a42] rounded-xl border border-[#1b5785]/50 overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1b5785]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-[#79a430] rounded-full" />
          <div>
            <h2 className="text-sm font-bold text-white font-condensed tracking-wide">
              {title.toUpperCase()}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {link && (
            <a href={link} className="text-[#66c4ff] text-xs font-medium hover:text-white transition-colors mr-1">
              View All
            </a>
          )}
          <button
            aria-label="Scroll left"
            onClick={onScrollLeft}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#174b73] hover:bg-[#1b5785] text-white transition-colors border border-[#1b5785]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            aria-label="Scroll right"
            onClick={onScrollRight}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#174b73] hover:bg-[#1b5785] text-white transition-colors border border-[#1b5785]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/* ─── Casino DB carousel ─── */
function CasinoDbCarousel({ section }: { section: (typeof CASINO_DB_SECTIONS)[number] }) {
  const { data, isLoading } = useCasinoGamesFromDb(section.filters, 12);
  const scrollRef = useRef<HTMLDivElement>(null);
  const games = useMemo(() => {
    if (!data?.pages?.length) return [];
    return data.pages.flatMap((page) => page?.data || []);
  }, [data]);

  const scrollBy = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  if (isLoading) {
    return (
      <div className="bg-[#0a2a42] rounded-xl border border-[#1b5785]/50 overflow-hidden mt-4">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1b5785]/40">
          <div className="w-1 h-5 bg-[#79a430] rounded-full" />
          <Skeleton className="h-4 w-40 bg-[#174b73]" />
        </div>
        <div className="flex gap-3 px-4 py-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-36 shrink-0 rounded-lg bg-[#174b73]" />
          ))}
        </div>
      </div>
    );
  }

  if (!games.length) return null;

  return (
    <CarouselSection
      title={section.title}
      subtitle={section.subtitle}
      link={section.link}
      onScrollLeft={() => scrollBy(-1)}
      onScrollRight={() => scrollBy(1)}
    >
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1">
        {games.map((game: any) => (
          <CasinoGameCard key={game.id || game.uuid} game={game} />
        ))}
      </div>
    </CarouselSection>
  );
}

/* ─── Dynamic section from admin ─── */
function SectionWithGames({ section }: { section: any }) {
  const { data: games } = useSectionGames(section.id);
  const activeGames = (games || [])
    .filter((g: any) => g.status === "active")
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  if (!activeGames.length) return null;
  return (
    <SectionCarousel
      title={section.title}
      subtitle={section.subtitle}
      type={section.type as GameType}
      games={activeGames}
    />
  );
}

function SectionCarousel({ title, subtitle, type, games }: { title: string; subtitle?: string; type: GameType; games: Game[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <CarouselSection
      title={title}
      subtitle={subtitle}
      onScrollLeft={() => scrollBy(-1)}
      onScrollRight={() => scrollBy(1)}
    >
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1">
        {games.map((game) => (
          <GameCard key={game.id} type={type} game={game} />
        ))}
      </div>
    </CarouselSection>
  );
}

/* ─── Root export ─── */
function DynamicHomeSections() {
  const { data: sections, isLoading } = useHomeSections();
  const activeSections = (sections || [])
    .filter((s: any) => s.status === "active")
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#0a2a42] rounded-xl border border-[#1b5785]/50 h-52 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {CASINO_DB_SECTIONS.map((s) => <CasinoDbCarousel key={s.key} section={s} />)}
      {activeSections.map((s: any) => <SectionWithGames key={s.id} section={s} />)}
    </>
  );
}

export default DynamicHomeSections;
