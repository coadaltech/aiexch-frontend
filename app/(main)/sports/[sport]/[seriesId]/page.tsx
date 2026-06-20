"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Series } from "@/components/sports/types";
import { useSeries } from "@/hooks/useSportsApi";
import { getSportConfig, isValidSportSlug } from "@/lib/sports-config";
import { CricketMatchesList } from "@/components/sports/cricket-matches-list";

function SportPoster({
  config,
  sport,
  children,
}: {
  config: { poster: string; title: string };
  sport: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full h-36 sm:h-48 overflow-hidden">
      <img
        src={config.poster}
        alt={config.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute top-3 left-3">
        <Link
          href={`/sports/${sport}`}
          className="flex items-center gap-1 bg-black/40 hover:bg-black/60 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-white/10"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Series
        </Link>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">{children}</div>
    </div>
  );
}

export default function SeriesMatchesPage({
  params,
}: {
  params: Promise<{ sport: string; seriesId: string }>;
}) {
  const { sport, seriesId } = use(params);
  const config = getSportConfig(sport);

  if (!config || !isValidSportSlug(sport)) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive font-semibold">Sport not found</p>
        <Link href="/sports">
          <Button variant="outline" className="mt-4">
            Back to Sports
          </Button>
        </Link>
      </Card>
    );
  }

  // Only need the series name here (matches + odds come from CricketMatchesList),
  // so don't background-poll the whole sport catalogue.
  const { data: seriesData = [], isLoading: loading } = useSeries(
    config.eventTypeId,
    true,
    { poll: false }
  );

  const series = useMemo(() => {
    return seriesData.find((s: Series) => String(s.id) === String(seriesId));
  }, [seriesData, seriesId]);

  return (
    <div className="bg-gray-50 min-h-full w-full pb-10">
      {/* Sport Poster Banner */}
      <SportPoster config={config} sport={sport}>
        {loading && !series ? (
          <div className="h-7 w-48 bg-white/20 rounded animate-pulse" />
        ) : (
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-condensed tracking-wide">
            {series?.name ?? config.title}
          </h1>
        )}
      </SportPoster>

      <div className="px-3 py-3">
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1e4088]/30 bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)]/80">
            <div className="w-1 h-5 bg-[var(--header-secondary)] rounded-full" />
            <h2 className="text-white font-bold text-sm font-condensed tracking-wider">
              MATCHES
            </h2>
          </div>
          <div className="px-3 pb-3 pt-2">
            <CricketMatchesList
              sport={sport}
              eventTypeId={config.eventTypeId}
              seriesId={seriesId}
              emptyText={config.emptyText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
