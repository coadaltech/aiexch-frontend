"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, SquarePlus } from "lucide-react";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { usePinnedCasinoCategories } from "@/hooks/usePinnedCasinoCategories";
import { OUR_MARKET_EVENT_TYPE_IDS } from "@/lib/our-market";
import { sportHref } from "@/lib/sports-nav";

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
        {sports.map((s) => (
          <Item key={s.id} label={s.name} href={sportHref(s)} plus />
        ))}
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
