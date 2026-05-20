"use client";

import { useMemo, useRef } from "react";
import { GameCard } from "./cards/game-card";
import { Game, GameType } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHomeSections, useSectionGames } from "@/hooks/usePublic";
import { Skeleton } from "@/components/ui/skeleton";
// Legacy Slotegrator casino carousels were removed when the casino flow
// was migrated to Ace Gamings. A new live-casino carousel can be added here
// later using casinoAceApi.listGames() from @/lib/api.

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-[var(--header-secondary)] rounded-full" />
          <div>
            <h2 className="text-sm font-bold text-gray-900 font-condensed tracking-wide">
              {title.toUpperCase()}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {link && (
            <a href={link} className="text-[var(--header-primary)] text-xs font-medium hover:text-[var(--header-secondary)] transition-colors mr-1">
              View All
            </a>
          )}
          <button
            aria-label="Scroll left"
            onClick={onScrollLeft}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            aria-label="Scroll right"
            onClick={onScrollRight}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
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
          <div key={i} className="bg-gray-200 rounded-xl h-52 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {activeSections.map((s: any) => <SectionWithGames key={s.id} section={s} />)}
    </>
  );
}

export default DynamicHomeSections;
