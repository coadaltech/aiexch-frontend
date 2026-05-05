"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import { getSportConfig, isValidSportSlug } from "@/lib/sports-config";
import { CricketMatchesList } from "@/components/sports/cricket-matches-list";
import { useSportsList, findSportLiveStatus } from "@/hooks/useSportsList";

export default function SportPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = use(params);
  const config = getSportConfig(sport);
  const { data: sportsListData } = useSportsList();

  if (!config || !isValidSportSlug(sport)) {
    return (
      <div className="bg-gray-50 min-h-full flex items-center justify-center p-8">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-sm">
          <p className="text-red-400 font-semibold">Sport not found</p>
          <p className="text-gray-500 text-sm mt-1">
            The sport &quot;{sport}&quot; is not available.
          </p>
          <Link href="/sports" className="mt-4 inline-flex items-center gap-1 text-[var(--header-primary)] text-sm hover:text-[var(--header-secondary)] transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Sports
          </Link>
        </div>
      </div>
    );
  }

  // Direct-URL safety net: only force coming-soon when we have data and it
  // explicitly says is_live=false. While loading, default to live so the
  // matches list isn't hidden behind a flash of "Coming Soon".
  const liveStatus = findSportLiveStatus(sportsListData, config.eventTypeId);
  const isComingSoon = liveStatus === false;

  return (
    <div className="bg-gray-50 min-h-full w-full">
      {/* Sport Poster Banner */}
      <div className="relative w-full h-36 sm:h-48 overflow-hidden">
        <img
          src={config.poster}
          alt={config.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Link
            href="/sports"
            className="flex items-center gap-1 bg-black/40 hover:bg-black/60 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-white/10"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Sports
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-condensed tracking-wide">
            {config.title.toUpperCase()}
          </h1>
        </div>
      </div>

      {isComingSoon ? (
        <div className="px-3 py-6">
          <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 shadow-md">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />
            <div className="relative flex flex-col items-center text-center px-6 py-12">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 border border-amber-200 mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Coming Soon
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-condensed tracking-wide">
                {config.title} is on its way
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-md">
                We&apos;re getting things ready behind the scenes. Check back
                soon to start playing.
              </p>
              <Link
                href="/sports"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--header-primary)] hover:text-[var(--header-secondary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Browse other sports
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3">
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1e4088]/30 bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)]/80">
              <div className="w-1 h-5 bg-[var(--header-secondary)] rounded-full" />
              <h2 className="text-white font-bold text-sm font-condensed tracking-wider">MATCHES</h2>
            </div>
            <div className="px-3 pb-3 pt-2">
              <CricketMatchesList
                sport={sport}
                eventTypeId={config.eventTypeId}
                emptyText={config.emptyText}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
