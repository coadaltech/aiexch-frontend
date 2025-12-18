"use client";

import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSeries } from "@/hooks/useSportsApi";
import { SportsEventsSkeleton } from "@/components/skeletons/sports-skeletons";
import Link from "next/link";

export default function EventTypePage({
  params,
}: {
  params: Promise<{ eventType: string }>;
}) {
  const { eventType } = use(params);
  const { data: seriesResponse, isLoading, error } = useSeries(eventType, true);
  const series = seriesResponse?.data || [];

  console.log("series", series);

  if (isLoading) {
    return <SportsEventsSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center py-8 text-red-400">
          Failed to load events. Please try again.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <div className="mb-3">
          <h2 className="text-foreground font-medium text-base flex items-center gap-2">
            🏆 Events
            <Badge className="text-xs">
              {Array.isArray(series) ? series.length : 0}
            </Badge>
          </h2>
        </div>

        <div className="space-y-2">
          {Array.isArray(series) && series.length > 0 ? (
            series.map((competition: any, idx: number) => (
              <Link
                key={idx}
                href={`/sports/${eventType}/${
                  competition.competition?.id || competition.id
                }`}
                className="block"
              >
                <div className="bg-muted/50 border border-border rounded-lg p-3 hover:bg-muted transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-foreground font-medium text-sm truncate">
                        {competition.competition?.name ||
                          competition.name ||
                          `Competition ${idx + 1}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events available at the moment.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
