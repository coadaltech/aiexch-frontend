"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Loader2,
  Zap,
  Dice6,
  Heart,
  Users,
  Circle,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useCasinoGamesFromDb,
  useCasinoProvidersWithTypes,
} from "@/hooks/useCasino";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CasinoGameCard } from "@/components/casino/casino-game-card";
import { useDebounce } from "@/hooks/useDebounce";

// Icon mapping for game types
const getTypeIcon = (type: string) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("slot")) return Zap;
  if (typeLower.includes("table") || typeLower.includes("roulette"))
    return Dice6;
  if (
    typeLower.includes("card") ||
    typeLower.includes("poker") ||
    typeLower.includes("blackjack")
  )
    return Heart;
  if (typeLower.includes("live")) return Users;
  return Gamepad2;
};

type ProviderWithTypes = {
  provider: string;
  types: string[];
};

export default function CasinoPage() {
  const [filtersState, setFiltersState] = useState({
    search: "",
    provider: "all",
    type: "all",
  });
  const { search, provider, type } = filtersState;
  const providerScrollRef = useRef<HTMLDivElement>(null);
  const typeScrollRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(filtersState.search, 500);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      provider: provider !== "all" ? provider : undefined,
      type: type !== "all" ? type : undefined,
    }),
    [debouncedSearch, provider, type]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useCasinoGamesFromDb(filters);

  // Fetch providers and types from database with caching
  const { data: providersWithTypesData, isLoading: isLoadingProvidersTypes } =
    useCasinoProvidersWithTypes();

  const providersWithTypes = useMemo<ProviderWithTypes[]>(() => {
    return (providersWithTypesData?.data as ProviderWithTypes[]) || [];
  }, [providersWithTypesData]);

  const providers = useMemo(() => {
    return providersWithTypes.map((item) => item.provider);
  }, [providersWithTypes]);

  useEffect(() => {
    if (type === "all") return;
    if (provider === "all") return;
    const providerData = providersWithTypes.find(
      (item) => item.provider === provider
    );
    if (!providerData || !providerData.types.includes(type)) {
      setFiltersState((prev) => ({ ...prev, type: "all" }));
    }
  }, [provider, providersWithTypes, type]);

  const types = useMemo(() => {
    const allTypesOption = [{ value: "all", label: "All Types", icon: Circle }];

    if (!providersWithTypes.length) {
      return allTypesOption;
    }

    if (provider === "all") {
      const typeSet = new Set<string>();
      providersWithTypes.forEach((item) => {
        item.types.forEach((type) => typeSet.add(type));
      });

      const sortedTypes = Array.from(typeSet).sort((a, b) =>
        a.localeCompare(b)
      );

      return [
        ...allTypesOption,
        ...sortedTypes.map((type) => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          icon: getTypeIcon(type),
        })),
      ];
    }

    const providerData = providersWithTypes.find(
      (item) => item.provider === provider
    );
    const providerTypes = providerData?.types || [];

    return [
      ...allTypesOption,
      ...providerTypes.map((type) => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        icon: getTypeIcon(type),
      })),
    ];
  }, [providersWithTypes, provider]);

  // Flatten all games from all pages
  const allGames = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data || []) || [];
  }, [data]);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearFilters = useCallback(() => {
    setFiltersState({
      search: "",
      provider: "all",
      type: "all",
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(
      debouncedSearch ||
      (provider && provider !== "all") ||
      (type && type !== "all")
    );
  }, [debouncedSearch, provider, type]);

  const scrollHorizontal = useCallback(
    (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
      if (!ref.current) return;
      const amount = direction === "left" ? -220 : 220;
      ref.current.scrollBy({
        left: amount,
        behavior: "smooth",
      });
    },
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto  ">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search games..."
              value={search}
              onChange={(e) =>
                setFiltersState((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 space-y-2">
          {/* Provider Categories Slider */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-muted-foreground">
                Provider
              </span>
              <div className="hidden sm:flex gap-1">
                <button
                  type="button"
                  aria-label="Scroll providers left"
                  onClick={() => scrollHorizontal(providerScrollRef, "left")}
                  className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll providers right"
                  onClick={() => scrollHorizontal(providerScrollRef, "right")}
                  className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              ref={providerScrollRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mr-4 pr-4 pb-2 min-w-0 w-full"
            >
              {isLoadingProvidersTypes ? (
                <div className="flex gap-2 flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-9 w-24 rounded-md flex-shrink-0"
                    />
                  ))}
                </div>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setFiltersState((prev) => ({ ...prev, provider: "all" }))
                    }
                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      provider === "all"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {providers.map((providerName: string) => (
                    <button
                      key={providerName}
                      onClick={() =>
                        setFiltersState((prev) => ({
                          ...prev,
                          provider: providerName,
                        }))
                      }
                      className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                        provider === providerName
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      {providerName}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
          {/* Type Categories Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-muted-foreground">
                Game Type
              </span>
              <div className="hidden sm:flex gap-1 items-center">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
                <button
                  type="button"
                  aria-label="Scroll types left"
                  onClick={() => scrollHorizontal(typeScrollRef, "left")}
                  className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll types right"
                  onClick={() => scrollHorizontal(typeScrollRef, "right")}
                  className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              ref={typeScrollRef}
              className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mr-4 pr-4 pb-2 min-w-0"
            >
              {isLoadingProvidersTypes ? (
                <div className="flex gap-3 flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-14 w-20 rounded-lg flex-shrink-0"
                    />
                  ))}
                </div>
              ) : (
                types.map((typeOption) => {
                  const Icon = typeOption.icon;
                  return (
                    <button
                      key={typeOption.value}
                      onClick={() =>
                        setFiltersState((prev) => ({
                          ...prev,
                          type: typeOption.value,
                        }))
                      }
                      className={`flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 min-w-[80px] ${
                        type === typeOption.value
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-card border border-border text-foreground"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          type === typeOption.value
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-center leading-tight">
                        {typeOption.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-4 text-sm text-muted-foreground">
            {allGames.length > 0
              ? `Showing ${allGames.length} game${
                  allGames.length !== 1 ? "s" : ""
                }`
              : "No games found"}
          </div>
        )}

        {/* Games Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-destructive">
              Failed to load games. Please try again.
            </p>
          </div>
        ) : allGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">No games found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
              {allGames.map((game: any) => (
                <CasinoGameCard key={game.id || game.uuid} game={game} />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading more games...</span>
                  </div>
                )}
              </div>
            )}

            {/* End of Results */}
            {!hasNextPage && allGames.length > 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                You've reached the end of the list
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
