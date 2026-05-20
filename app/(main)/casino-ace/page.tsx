"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  Search,
  Sparkles,
  Play,
  Dice5,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { casinoAceApi, type AceCasinoGame } from "@/lib/api";

/**
 * Ace Gamings Lobby
 *
 * Reads visible games from our DB (synced from Ace via /casino-ace/games).
 * Clicking a game routes to /casino-ace/play/{externalId}.
 */
export default function CasinoAceLobbyPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["casino-ace", "games"],
    queryFn: async () => {
      const res = await casinoAceApi.listGames();
      return res.data.games;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((g) => g.name.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="min-h-full bg-[#efefef]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[var(--header-primary)] via-[#1e3a8a] to-[var(--header-secondary)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-[#ede105]/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Dice5 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Live Casino
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-[#ede105]" />
                Powered by Ace Gamings
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games…"
              className="h-10 border-white/20 bg-white/95 pl-9 pr-9 text-black placeholder:text-gray-400 focus-visible:ring-[#ede105]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className=" px-4 py-6">
        {/* Count row */}
        {!isLoading && !isError && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {search ? "Search results" : "All games"}
            </h2>
            <span className="text-sm text-gray-500">
              {filtered.length} game{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <Skeleton className="aspect-[3/4] w-full rounded-none bg-gray-200" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-3.5 w-3/4 bg-gray-200" />
                  <Skeleton className="h-3 w-1/3 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">
              Could not load casino games:{" "}
              {(error as Error)?.message ?? "unknown error"}
            </span>
          </div>
        )}

        {/* Empty (no games at all) */}
        {data && data.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Dice5 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">No games available yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Run the catalog sync on your backend, then refresh this page.
            </p>
          </div>
        )}

        {/* Empty (search miss) */}
        {data && data.length > 0 && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">
              No games match “{search}”
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm font-medium text-[var(--header-primary)] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((game) => (
              <GameTile key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameTile({ game }: { game: AceCasinoGame }) {
  return (
    <Link
      href={`/casino-ace/play/${game.externalId}`}
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--header-primary)]"
    >
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-[var(--header-primary)]/40">
        {/* Thumbnail */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {game.thumbnailUrl ? (
            <Image
              src={game.thumbnailUrl}
              alt={game.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 20vw, 16vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-gray-500">
              {game.name}
            </div>
          )}

          {/* Hover overlay with play button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-full bg-[#ede105] px-3.5 py-1.5 text-xs font-bold text-black shadow-lg">
              <Play className="h-3.5 w-3.5 fill-black" />
              Play
            </span>
          </div>

          {/* Special note badge */}
          {game.specialNote && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#ede105] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black shadow">
              <Sparkles className="h-2.5 w-2.5" />
              {game.specialNote}
            </span>
          )}

          {/* Currency chip */}
          <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {game.currency}
          </span>
        </div>

        {/* Title */}
        <div className="px-3 py-2.5">
          <p
            className="truncate text-sm font-semibold text-gray-800"
            title={game.name}
          >
            {game.name}
          </p>
        </div>
      </div>
    </Link>
  );
}
