"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { sportHref } from "@/lib/sports-nav";

/**
 * Diamond olive/gold navigation bar. HOME is fixed chrome; every other entry is
 * an admin-enabled sport pulled from the public sports list — the same source
 * the Default theme uses. Toggling a sport on/off, renaming or reordering it in
 * the owner panel is reflected here live (via the "sports-list" channel), so
 * nothing is hardcoded.
 */
export function DiamondNav() {
  const pathname = usePathname();
  const { data: sports = [] } = useLiveSportsList();

  const items: { label: string; href: string; live?: boolean }[] = [
    { label: "HOME", href: "/" },
    { label: "IN PLAY", href: "/inplay", live: true },
    ...sports.map((s) => ({ label: s.name.toUpperCase(), href: sportHref(s) })),
  ];

  return (
    <nav className="relative z-40 shrink-0 bg-[var(--dx-nav)]">
      <div className="flex items-stretch overflow-x-auto scrollbar-hide">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname === "/home"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-[15px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-black/10 ${
                active ? "bg-black/15" : ""
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
    </nav>
  );
}
