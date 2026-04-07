"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSportConfig, isValidSportSlug } from "@/lib/sports-config";
import { CricketMatchesList } from "@/components/sports/cricket-matches-list";

export default function SportPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = use(params);
  const config = getSportConfig(sport);

  if (!config || !isValidSportSlug(sport)) {
    return (
      <div className="bg-gray-50 min-h-full flex items-center justify-center p-8">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-sm">
          <p className="text-red-400 font-semibold">Sport not found</p>
          <p className="text-gray-500 text-sm mt-1">
            The sport &quot;{sport}&quot; is not available.
          </p>
          <Link href="/sports" className="mt-4 inline-flex items-center gap-1 text-[#142969] text-sm hover:text-[#84c2f1] transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Sports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full w-full">
      {/* Sport Poster Banner */}
      <div className="relative w-full h-36 sm:h-48 overflow-hidden">
        <img
          src={config.poster}
          alt={config.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-black/40 to-transparent" />
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

      {/* Matches section */}
      <div className="px-3 py-3">
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1e4088]/30 bg-gradient-to-r from-[#142969]/50 to-transparent">
            <div className="w-1 h-5 bg-[#84c2f1] rounded-full" />
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
    </div>
  );
}
