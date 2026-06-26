"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { sportHref } from "@/lib/sports-nav";

/**
 * Betfair dark navy navigation bar. Home is fixed chrome; every other entry is
 * an admin-enabled sport pulled from the public sports list — the same source
 * the Default theme uses. Owner toggles (enable/disable, rename, reorder) are
 * reflected here live (via the "sports-list" channel), so nothing is hardcoded.
 * The active item is underlined in Betfair gold.
 */
export function BetfairNav() {
  const pathname = usePathname();
  const { data: sports = [] } = useLiveSportsList();

  const items: { label: string; href: string; live?: boolean }[] = [
    { label: "Home", href: "/" },
    { label: "In Play", href: "/inplay", live: true },
    ...sports.map((s) => ({ label: s.name, href: sportHref(s) })),
  ];

  return (
    <nav className="fixed inset-x-0 top-11 z-40 bg-[var(--bf-nav)]">
      <div className="flex items-stretch">
        <div className="flex flex-1 items-stretch overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname === "/home"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[var(--bf-nav-hover)] ${
                  active ? "border-[var(--nav-highlight)]" : "border-transparent"
                }`}
              >
                {item.live && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
        <button className="hidden shrink-0 items-center gap-1 border-l border-white/10 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[var(--bf-nav-hover)] sm:flex">
          Settings
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
