"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveSportsList, type PublicSport } from "@/hooks/useSportsList";
import { usePinnedCasinoCategories } from "@/hooks/usePinnedCasinoCategories";
import { OUR_MARKET_EVENT_TYPE_IDS } from "@/lib/our-market";
import { sportHref, sportDrillsDown } from "@/lib/sports-nav";
import { useSportDrilldown } from "@/hooks/useSportDrilldown";

/** Collapsible grey section, like the reference "My Markets" / "Sports" rail. */
function Section({
  title,
  icon,
  dark,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  dark?: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] font-bold ${
          dark
            ? "bg-[var(--bf-nav)] text-white"
            : "bg-[#cdced1] text-[#1f2937]"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="bg-[var(--bf-sidebar)]">{children}</div>}
    </div>
  );
}

/** Expandable sport row — opens a competition → match dropdown styled as the
 *  Betfair blue text links. Mirrors the Default theme's accordion. */
function BetfairSportItem({ sport }: { sport: PublicSport }) {
  const {
    expanded,
    toggle,
    isLoading,
    series,
    openSeries,
    toggleSeries,
    competitionHref,
    matchHref,
  } = useSportDrilldown(sport);

  const linkCls =
    "text-[13px] font-semibold text-[var(--bf-link)] transition-colors hover:bg-[#cdced1] hover:underline";

  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between px-3 py-1.5 text-left ${linkCls}`}
      >
        <span className="truncate">{sport.name}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="bg-[#dfe0e2]">
          {series.length === 0 ? (
            isLoading ? null : (
              <div className="py-1.5 pl-6 pr-3 text-[12px] text-slate-500">
                No competitions available
              </div>
            )
          ) : (
            series.map((s) => {
              const isOpen = openSeries.includes(s.id);
              const href = competitionHref(s.id);
              return (
                <div key={s.id}>
                  <div className="flex items-center border-b border-black/10">
                    <Link
                      href={href}
                      className={`flex-1 truncate py-1.5 pl-6 pr-2 ${linkCls}`}
                    >
                      {s.name}
                    </Link>
                    {s.matches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSeries(s.id)}
                        className="px-2 py-1.5 text-slate-600"
                        aria-label="Toggle matches"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                  {isOpen &&
                    s.matches.map((m) => (
                      <Link
                        key={m.id}
                        href={matchHref(s.id, m.id)}
                        title={m.name}
                        className={`block truncate border-b border-black/10 py-1.5 pl-9 pr-2 text-[12px] ${linkCls}`}
                      >
                        {m.team2 ? `${m.team1} v ${m.team2}` : m.name}
                      </Link>
                    ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Betfair left "Sports" rail — a grey rail with a "Hide menu" strip and dark
 * section headers with the lists rendered as blue text links. Every section is
 * admin-driven, nothing is hardcoded: "Sports" and "Our Market" come from the
 * public sports list (the same source the Default theme uses), and "Others" lists
 * the owner-pinned casino categories. All three reflect owner-enabled items only,
 * in the owner's order, and update live on toggle. Sections render in order:
 * Sports → Our Market → Others. Desktop-first like the reference (hidden below
 * lg, where the app's bottom nav takes over).
 */
export function BetfairSidebar() {
  const { data: allSports = [] } = useLiveSportsList();
  const { categories: casinoCategories } = usePinnedCasinoCategories();
  const marketSports = allSports.filter((s) =>
    OUR_MARKET_EVENT_TYPE_IDS.has(String(s.id))
  );
  const sports = allSports.filter(
    (s) => !OUR_MARKET_EVENT_TYPE_IDS.has(String(s.id))
  );

  return (
    <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto bg-[var(--bf-sidebar)] scrollbar-hide lg:flex">
      {/* Hide menu strip */}
      <div className="flex items-center justify-between bg-[#cdced1] px-3 py-1 text-[12px] font-semibold text-slate-600">
        Hide menu
        <ChevronLeft className="h-4 w-4" />
      </div>

      <Section title="Sports" dark>
        {sports.map((s) =>
          sportDrillsDown(s) ? (
            <BetfairSportItem key={s.id} sport={s} />
          ) : (
            <Link
              key={s.id}
              href={sportHref(s)}
              className="block border-b border-black/10 px-3 py-1.5 text-[13px] font-semibold text-[var(--bf-link)] transition-colors hover:bg-[#cdced1] hover:underline"
            >
              {s.name}
            </Link>
          ),
        )}
      </Section>

      {marketSports.length > 0 && (
        <Section title="Our Market" dark>
          {marketSports.map((s) => (
            <Link
              key={s.id}
              href={sportHref(s)}
              className="block border-b border-black/10 px-3 py-1.5 text-[13px] font-semibold text-[var(--bf-link)] transition-colors hover:bg-[#cdced1] hover:underline"
            >
              {s.name}
            </Link>
          ))}
        </Section>
      )}

      {casinoCategories.length > 0 && (
        <Section title="Others" dark>
          {casinoCategories.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className="block border-b border-black/10 px-3 py-1.5 text-[13px] font-semibold text-[var(--bf-link)] transition-colors hover:bg-[#cdced1] hover:underline"
            >
              {c.label}
            </Link>
          ))}
        </Section>
      )}

      {/* Bottom dark strip, like the reference "Next Horse Race". */}
      <div className="mt-auto bg-[var(--bf-nav)] px-3 py-2 text-[13px] font-bold text-white">
        Next Horse Race
      </div>
    </aside>
  );
}
