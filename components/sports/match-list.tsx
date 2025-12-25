import Link from "next/link";
import { formatToISTLong } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchListProps } from "./types";

export function MatchList({
  matches,
  eventType,
  competitionId,
  isLoading,
}: MatchListProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-card/40 border border-border rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="w-5 h-4 bg-muted/20" />
                    <Skeleton className="h-4 w-48 bg-muted/20" />
                    <Skeleton className="h-3 w-12 bg-muted/20" />
                  </div>
                  <Skeleton className="h-3 w-32 bg-muted/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="space-y-2">
        {matches.map((match, idx) => {
          const event = match.event;
          if (!event) return null;

          const eventTime = new Date(event.openDate);
          const now = new Date();
          const isLive = eventTime <= now; // ✅ Automatically detect LIVE

          return (
            <Link
              key={idx}
              href={`/sports/${eventType}/${competitionId}/${event.id}`}
              className="block"
            >
              <div className="bg-card/40 border border-border rounded-lg p-3 hover:bg-card/60 transition-all">
                <div className="flex items-center justify-between">
                  {/* LEFT SIDE */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Country Flag */}
                      {event.countryCode && (
                        <img
                          src={`https://flagcdn.com/24x18/${event.countryCode.toLowerCase()}.png`}
                          alt={event.countryCode}
                          className="w-5 h-4 rounded-sm object-cover"
                        />
                      )}

                      {/* Match Name */}
                      <span className="text-foreground font-medium text-sm truncate">
                        {event.name || "Match Name"}
                      </span>

                      {/* Live Badge */}
                      {isLive && (
                        <span className="ml-2 text-xs text-green-500 font-semibold animate-pulse">
                          ● LIVE
                        </span>
                      )}
                    </div>

                    {/* Match Time */}
                    <div className="text-muted-foreground text-xs">
                      {event.openDate ? formatToISTLong(event.openDate) : "TBD"}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
