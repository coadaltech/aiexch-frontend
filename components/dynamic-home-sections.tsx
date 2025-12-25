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
  filters?: {
    provider?: string;
    type?: string;
    technology?: string;
  };
}> = [
  {
    key: "latest",
    title: "Latest Casino Picks",
    subtitle: "Fresh drops from our providers",
    link: "/casino",
    filters: {},
  },
  {
    key: "slots",
    title: "Trending Slots",
    subtitle: "Spin the hottest reels",
    link: "/casino?type=slots",
    filters: { type: "slots" },
  },
  {
    key: "table",
    title: "Table Classics",
    subtitle: "Roulette, Blackjack & more",
    link: "/casino?type=table",
    filters: { type: "table" },
  },
];

function DynamicHomeSections() {
  const { data: sections, isLoading } = useHomeSections();

  const activeSections = (sections || [])
    .filter((section: any) => section.status === "active")
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Loading games...</p>
      </div>
    );
  }

  if (!activeSections.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No games available at the moment. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <>
      <CasinoDbSections />
      {activeSections.map((section: any) => (
        <SectionWithGames key={section.id} section={section} />
      ))}
    </>
  );
}

function CasinoDbSections() {
  return (
    <>
      {CASINO_DB_SECTIONS.map((section) => (
        <CasinoDbCarousel key={section.key} section={section} />
      ))}
    </>
  );
}

function CasinoDbCarousel({
  section,
}: {
  section: (typeof CASINO_DB_SECTIONS)[number];
}) {
  const { data, isLoading } = useCasinoGamesFromDb(section.filters, 12);
  const scrollRef = useRef<HTMLDivElement>(null);

  const games = useMemo(() => {
    if (!data?.pages?.length) return [];
    return data.pages.flatMap((page) => page?.data || []);
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full pt-4">
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              {section.subtitle && (
                <Skeleton className="h-4 w-64 bg-muted/60" />
              )}
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mr-4 pr-4 pb-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-48 w-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!games.length) return null;

  const scrollBy = (direction: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full pt-4">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="relative">
            <h2 className="text-md font-semibold text-primary">
              {section.title.toUpperCase()}
            </h2>
            {/* {section.subtitle && (
              <p className="text-muted-foreground mt-2 text-lg font-medium">
                {section.subtitle}
              </p>
            )} */}
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Scroll left"
              onClick={() => scrollBy(-1)}
              className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground p-2 rounded-full transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Scroll right"
              onClick={() => scrollBy(1)}
              className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground p-2 rounded-full transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide -mr-4 pr-4 scroll-smooth pb-4"
      >
        {games.map((game: any) => (
          <CasinoGameCard key={game.id || game.uuid} game={game} />
        ))}
      </div>
    </div>
  );
}

function SectionWithGames({ section }: { section: any }) {
  const { data: games } = useSectionGames(section.id);

  const activeGames = (games || [])
    .filter((game: any) => game.status === "active")
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  if (!activeGames.length) return null;

  return (
    <SectionCarousel
      title={section.title}
      type={section.type as GameType}
      subtitle={section.subtitle}
      games={activeGames}
    />
  );
}

function SectionCarousel({
  title,
  subtitle,
  type,
  games,
}: {
  title: string;
  subtitle?: string;
  type: GameType;
  games: Game[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full pt-4">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="relative">
            <h2 className="text-md font-semibold text-primary">
              {title.toUpperCase()}
            </h2>
            {/* {subtitle && (
              <p className="text-muted-foreground mt-2 text-lg font-medium">
                {subtitle}
              </p>
            )} */}
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Scroll left"
              onClick={() => scrollBy(-1)}
              className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Scroll right"
              onClick={() => scrollBy(1)}
              className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground p-2 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide -mr-4 pr-4 scroll-smooth pb-4"
      >
        {games.map((game) => (
          <GameCard key={game.id} type={type} game={game} />
        ))}
      </div>
    </div>
  );
}

export default DynamicHomeSections;
