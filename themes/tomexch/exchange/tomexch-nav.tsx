"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Home as HomeIcon, ChevronDown } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { sportHref } from "@/lib/sports-nav";
import { sportEmoji } from "./sport-emoji";

/** Overflow links surfaced under the "More" dropdown, like the reference nav. */
const MORE_LINKS = [
  { label: "Premium Races", href: "/sports/horse-racing" },
  { label: "Casino", href: "/casino" },
  { label: "Promotions", href: "/promotions" },
  { label: "Help & Support", href: "/live-support" },
];

/**
 * TomExch top nav — a white icon bar: a sidebar toggle (rotates with the rail
 * state), an icon-only Home, a blinking In-Play, the admin-enabled sports (same
 * public list the Default theme uses, with per-sport emoji icons), and a More
 * dropdown for overflow links. Nothing sport-related is hardcoded.
 */
export function TomexchNav() {
  const pathname = usePathname();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  const { data: sports = [] } = useLiveSportsList();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname === "/home"
      : !!pathname?.startsWith(href);

  const itemClass = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-semibold transition-colors hover:bg-slate-50 ${
      active
        ? "border-[var(--nav-active)] text-[var(--nav-active)]"
        : "border-transparent text-slate-700"
    }`;

  return (
    <nav className="relative z-40 flex shrink-0 items-stretch border-b border-slate-200 bg-[var(--nav-surface)]">
      {/* Hamburger — rotates 180° while the sidebar is open. */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
        className="flex shrink-0 items-center border-r border-slate-200 px-3 text-slate-600 hover:bg-slate-50"
      >
        <Menu
          className="h-5 w-5 transition-transform duration-300"
          style={{ transform: sidebarOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <div className="flex flex-1 items-stretch overflow-x-auto scrollbar-hide">
        {/* Home — icon only */}
        <Link href="/" aria-label="Home" className={itemClass(isActive("/"))}>
          <HomeIcon className="h-4.5 w-4.5" />
        </Link>

        {/* In Play — blinking live dot */}
        <Link href="/inplay" className={itemClass(isActive("/inplay"))}>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-[txBlink_0.7s_ease-in-out_infinite]" />
          In Play
        </Link>

        {/* Admin-enabled sports */}
        {sports.map((s) => {
          const href = sportHref(s);
          return (
            <Link key={s.id} href={href} className={itemClass(isActive(href))}>
              <span className="text-[16px] leading-none">{sportEmoji(s.name)}</span>
              {s.name}
            </Link>
          );
        })}
      </div>

      {/* More dropdown */}
      <div ref={moreRef} className="relative shrink-0 border-l border-slate-200">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="flex h-full items-center gap-1 px-4 py-2.5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          More
          <ChevronDown
            className={`h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
          />
        </button>
        {moreOpen && (
          <div className="absolute right-0 top-full z-50 w-48 overflow-hidden rounded-b-md border border-slate-200 bg-white shadow-xl">
            {MORE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMoreOpen(false)}
                className="block px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
