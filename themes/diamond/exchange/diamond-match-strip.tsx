"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Trophy, Volleyball, CircleDot, type LucideIcon } from "lucide-react";
import { useMatchesList } from "@/hooks/useSportsApi";
import { SPORT_ROUTES } from "@/lib/sports-config";

/**
 * Diamond top "match strip" — ONLY the matches that are currently LIVE (in-play),
 * across the main sports. No owner-curated / featured / upcoming "dummy" events.
 * Data comes from `useMatchesList` (which auto-refetches in the background), so
 * the strip updates as matches go in-play or finish. The live names blink.
 */

const SPORT_BASE: Record<string, string> = Object.fromEntries(
  Object.values(SPORT_ROUTES).map((c) => [c.eventTypeId, c.basePath])
);

const SPORT_ICON: Record<string, LucideIcon> = {
  "4": Trophy, // cricket
  "1": Volleyball, // soccer
  "2": CircleDot, // tennis
};

const MAX_BOXES = 12;

/** Statuses that mean the event is over — never show these (their inPlay flag
 *  can linger true on the backend after a match ends). */
const ENDED_STATUSES = new Set([
  "CLOSED",
  "INACTIVE",
  "COMPLETE",
  "COMPLETED",
  "RESULTED",
  "ENDED",
  "FINISHED",
]);

interface StripItem {
  key: string;
  sportId: string;
  href: string;
  name: string;
}

export function DiamondMatchStrip() {
  // Live matches per sport — useMatchesList auto-refetches, so this stays current.
  const { data: cricket = [] } = useMatchesList("4");
  const { data: soccer = [] } = useMatchesList("1");
  const { data: tennis = [] } = useMatchesList("2");

  const items = useMemo<StripItem[]>(() => {
    const seen = new Set<string>();
    const out: StripItem[] = [];

    const sets: Array<[string, any[]]> = [
      ["4", cricket],
      ["1", soccer],
      ["2", tennis],
    ];

    for (const [sid, list] of sets) {
      const base = SPORT_BASE[sid] || sid;
      for (const m of list) {
        // ONLY currently-live (in-play) matches that have NOT ended.
        const status = String(m?.status ?? "").toUpperCase();
        if (!m?.inPlay || ENDED_STATUSES.has(status)) continue;
        const id = String(m.id ?? "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({
          key: id,
          sportId: sid,
          href: `/sports/${base}/${m.seriesId}/${m.id}`,
          name: m.name || "Event",
        });
      }
    }

    return out.slice(0, MAX_BOXES);
  }, [cricket, soccer, tennis]);

  if (!items.length) return null;

  return (
    <div className="flex w-full items-stretch gap-1.5 overflow-x-auto bg-white py-1.5 scrollbar-hide">
      {items.map((it) => {
        const Icon = SPORT_ICON[it.sportId] ?? Trophy;
        return (
          <Link
            key={it.key}
            href={it.href}
            style={{ borderRadius: 0 }}
            className="flex min-w-[14rem] flex-1 items-center justify-center gap-2.5 rounded-none border border-[#a89a3d] bg-[var(--dx-nav)] px-4 py-2 text-white transition-colors hover:brightness-110"
          >
            <Icon className="h-4 w-4 shrink-0 text-white/90" strokeWidth={2} />
            <span className="truncate text-[15px] font-bold animate-[dxBlink_0.7s_ease-in-out_infinite]">
              {it.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
