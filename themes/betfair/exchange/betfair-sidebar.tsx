"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronLeft } from "lucide-react";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { usePinnedCasinoCategories } from "@/hooks/usePinnedCasinoCategories";
import { OUR_MARKET_EVENT_TYPE_IDS } from "@/lib/our-market";
import { sportHref } from "@/lib/sports-nav";

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
        {sports.map((s) => (
          <Link
            key={s.id}
            href={sportHref(s)}
            className="block border-b border-black/10 px-3 py-1.5 text-[13px] font-semibold text-[var(--bf-link)] transition-colors hover:bg-[#cdced1] hover:underline"
          >
            {s.name}
          </Link>
        ))}
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
