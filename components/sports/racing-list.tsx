"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRacing, type RacingMeeting, type RacingRace } from "@/hooks/useSportsApi";
import { sportsApi } from "@/lib/api";

// Mirror of the backend synthetic competition id (9e9 base + sportId).
const RACING_COMP_BASE = 9_000_000_000;

const COUNTRY_FLAG: Record<string, string> = {
  AU: "🇦🇺",
  GB: "🇬🇧",
  IE: "🇮🇪",
  US: "🇺🇸",
  NZ: "🇳🇿",
  ZA: "🇿🇦",
  FR: "🇫🇷",
  IN: "🇮🇳",
  OTHER: "🏳️",
};

function fmtTime(iso: string | null): string {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

/**
 * Racing layout (Horse / Greyhound): country tabs → venue (meeting) rows →
 * one button per race (market). Clicking a race opens that race's market on the
 * betting page (?market=<id>). All data comes from the racing notepad.
 */
export function RacingList({
  sport,
  title,
  eventTypeId,
  emptyText,
}: {
  sport: string;
  title: string;
  eventTypeId: string;
  emptyText?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: countries = [], isLoading } = useRacing(eventTypeId);
  const compId = RACING_COMP_BASE + Number(eventTypeId);

  // Prefetch a race's markets on intent (hover / touch) and seed the same cache
  // key the match page reads at mount (["match-odds-list", eventId]). With the
  // backend now serving its warm snapshot, this returns in <200ms, so by the
  // time the click navigates the match page paints instantly from cache — no
  // loading spinner, no flash. Skips if already seeded.
  const prefetchRace = (eventId: number) => {
    const key = ["match-odds-list", String(eventId)];
    if (queryClient.getQueryData(key)) return;
    sportsApi
      .getMatchDetails(eventTypeId, String(eventId))
      .then((res: any) => {
        // Endpoint shape is { success, data: { matchOdds } }, wrapped again by
        // axios in res.data — so the markets are at res.data.data.matchOdds.
        const odds = res?.data?.data?.matchOdds ?? res?.data?.matchOdds;
        if (Array.isArray(odds) && odds.length > 0) {
          queryClient.setQueryData(key, odds);
        }
      })
      .catch(() => {
        /* best-effort prefetch */
      });
  };

  // Client-fetched data — render a stable "loading" shell on the server and the
  // first client render so hydration matches, then show data after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeCC, setActiveCC] = useState<string | null>(null);
  const current =
    countries.find((c) => c.countryCode === activeCC) ?? countries[0] ?? null;

  const openRace = (meeting: RacingMeeting, race: RacingRace) => {
    router.push(
      `/sports/${sport}/${compId}/${meeting.eventId}?market=${race.marketId}`,
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <span className="rounded-md bg-[#1a3578] px-3 py-1.5 text-sm font-medium text-white">
          Today
        </span>
      </div>

      {!mounted || (isLoading && countries.length === 0) ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading races…</div>
      ) : countries.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {emptyText || "No races available right now."}
        </div>
      ) : (
        <>
          {/* Country tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 px-2 overflow-x-auto">
            {countries.map((c) => {
              const isActive = (current?.countryCode ?? "") === c.countryCode;
              return (
                <button
                  key={c.countryCode}
                  onClick={() => setActiveCC(c.countryCode)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-[#1a3578] text-[#1a3578]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span className="text-base">
                    {COUNTRY_FLAG[c.countryCode] ?? COUNTRY_FLAG.OTHER}
                  </span>
                  <span>{c.countryCode}</span>
                </button>
              );
            })}
          </div>

          {/* Venue rows — only meetings that still have races (a finished
              meeting drops out of the feed, so it never renders here). */}
          <div className="divide-y divide-gray-100">
            {(current?.meetings ?? [])
              .filter((m) => (m.races ?? []).length > 0)
              .map((m) => {
              const races = m.races ?? [];
              return (
              <div
                key={m.eventId}
                className="flex items-start gap-3 px-3 sm:px-4 py-3"
              >
                <span className="w-32 sm:w-44 flex-shrink-0  font-medium text-gray-800 truncate">
                  {m.venue || m.name}
                </span>
                <div className="flex flex-wrap gap-2">
                  {races.length === 0 ? (
                    <span className="text-xs text-gray-400 pt-1.5">
                      No races
                    </span>
                  ) : (
                    races.map((race) => (
                      <button
                        key={race.marketId}
                        onClick={() => openRace(m, race)}
                        onPointerEnter={() => prefetchRace(m.eventId)}
                        onTouchStart={() => prefetchRace(m.eventId)}
                        onFocus={() => prefetchRace(m.eventId)}
                        title={race.name}
                        className="rounded-none border border-gray-200 bg-gray-200 px-3  text-sm font-medium text-gray-700 shadow-sm hover:border-[#1a3578] hover:text-[#1a3578] hover:bg-[#1a3578]/5 transition-colors"
                      >
                        {fmtTime(race.raceTime)}
                      </button>
                    ))
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
