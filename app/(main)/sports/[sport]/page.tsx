"use client";

import { use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
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
      <Card className="p-8 text-center border border-destructive/20 bg-destructive/5">
        <p className="text-destructive font-semibold">Sport not found</p>
        <p className="text-muted-foreground text-sm mt-1">
          The sport &quot;{sport}&quot; is not available.
        </p>
        <Link href="/sports" className="mt-4 inline-block text-primary hover:underline">
          ← Back to Sports
        </Link>
      </Card>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Sport Poster Banner */}
      <div className="relative w-full h-36 sm:h-48 overflow-hidden">
        <img
          src={config.poster}
          alt={config.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {config.title}
          </h1>
        </div>
      </div>

      {/* Matches */}
      <div className="px-2 sm:px-4 py-3">
        <CricketMatchesList
          sport={sport}
          eventTypeId={config.eventTypeId}
          emptyText={config.emptyText}
        />
      </div>
    </div>
  );
}
