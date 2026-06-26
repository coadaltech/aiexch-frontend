"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronRight, SquarePlus } from "lucide-react";
import { useLiveSportsList, type PublicSport } from "@/hooks/useSportsList";
import { usePinnedCasinoCategories } from "@/hooks/usePinnedCasinoCategories";
import { OUR_MARKET_EVENT_TYPE_IDS } from "@/lib/our-market";
import { sportHref, sportDrillsDown } from "@/lib/sports-nav";
import { useSportDrilldown } from "@/hooks/useSportDrilldown";

/** Blue collapsible section header, like the reference sidebar. */
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-none bg-[var(--dx-sidebar-head)] px-3 py-2 text-left text-[15px] font-bold text-white"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="rounded-none bg-[#c2c2c2]">{children}</div>}
    </div>
  );
}

function Item({
  label,
  href,
  disabled,
  plus,
}: {
  label: string;
  href?: string;
  disabled?: boolean;
  plus?: boolean;
}) {
  const cls =
    "flex items-center gap-2 border-b border-black/10 px-3 py-1.5 text-sm transition-colors last:border-b-0";
  const inner = (
    <>
      {plus && <SquarePlus className="h-4 w-4 shrink-0 text-slate-800" strokeWidth={2} />}
      {label}
    </>
  );
  if (disabled || !href) {
    return <div className={`${cls} cursor-default text-slate-500`}>{inner}</div>;
  }
  return (
    <Link href={href} className={`${cls} text-slate-900 hover:bg-[#b6b6b6]`}>
      {inner}
    </Link>
  );
}

/** Expandable sport row — opens a competition → match dropdown, styled to match
 *  the Diamond grey body. Mirrors the Default theme's accordion. */
function DiamondSportItem({ sport }: { sport: PublicSport }) {
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

  return (
    <div className="border-b border-black/10 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-900 transition-colors hover:bg-[#b6b6b6]"
      >
        <SquarePlus className="h-4 w-4 shrink-0 text-slate-800" strokeWidth={2} />
        <span className="flex-1 truncate">{sport.name}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
        )}
      </button>

      {expanded && (
        <div className="bg-[#b6b6b6]">
          {series.length === 0 ? (
            isLoading ? null : (
              <div className="py-1.5 pl-9 pr-3 text-xs text-slate-600">
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
                      className="flex-1 truncate py-1.5 pl-9 pr-2 text-[13px] font-medium text-slate-900 hover:underline"
                    >
                      {s.name}
                    </Link>
                    {s.matches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSeries(s.id)}
                        className="px-2 py-1.5 text-slate-700"
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
                        className="block truncate border-b border-black/10 py-1.5 pl-12 pr-2 text-[12px] text-slate-800 hover:bg-[#aaaaaa]"
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
 * Diamond left sidebar — blue section headers over a grey body with black items
 * and a box-plus icon on each sport. Every section is admin-driven, nothing is
 * hardcoded: "All Sports" and "Our Market" come from the public sports list (the
 * same source the Default theme uses), and "Others" lists the owner-pinned casino
 * categories. All three reflect owner-enabled items only, in the owner's order,
 * and update live on toggle. Sections render in order: All Sports → Our Market →
 * Others. Desktop-first like the reference (hidden below lg, where the app's
 * bottom nav takes over).
 */
export function DiamondSidebar() {
  const { data: allSports = [] } = useLiveSportsList();
  const { categories: casinoCategories } = usePinnedCasinoCategories();
  // Our Market games render in their own section; everything else under All Sports.
  const marketSports = allSports.filter((s) =>
    OUR_MARKET_EVENT_TYPE_IDS.has(String(s.id))
  );
  const sports = allSports.filter(
    (s) => !OUR_MARKET_EVENT_TYPE_IDS.has(String(s.id))
  );

  return (
    <aside className="mr-2 mt-2 hidden w-72 shrink-0 overflow-y-auto border-r border-slate-400 bg-[#c2c2c2] scrollbar-hide lg:block">
      <Section title="All Sports">
        {sports.map((s) =>
          sportDrillsDown(s) ? (
            <DiamondSportItem key={s.id} sport={s} />
          ) : (
            <Item key={s.id} label={s.name} href={sportHref(s)} plus />
          ),
        )}
      </Section>

      {marketSports.length > 0 && (
        <Section title="Our Market">
          {marketSports.map((s) => (
            <Item key={s.id} label={s.name} href={sportHref(s)} plus />
          ))}
        </Section>
      )}

      {casinoCategories.length > 0 && (
        <Section title="Others">
          {casinoCategories.map((c) => (
            <Item key={c.key} label={c.label} href={c.href} />
          ))}
        </Section>
      )}
    </aside>
  );
}
