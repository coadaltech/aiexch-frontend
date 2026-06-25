"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useLiveSportsList } from "@/hooks/useSportsList";
import { usePinnedCasinoCategories } from "@/hooks/usePinnedCasinoCategories";
import { sportHref } from "@/lib/sports-nav";
import { sportEmoji } from "./sport-emoji";

/** Filled triangle chevrons matching the reference rail (▼ closed, ◀ open). */
function TriangleDown({ className = "" }: { className?: string }) {
  return (
    <svg width="12" height="8" viewBox="0 0 16 9" fill="none" className={className} aria-hidden>
      <path
        d="M6.83109 7.83109L0.707107 1.70711C0.0771419 1.07714 0.523309 0 1.41421 0H14.3826C15.3006 0 15.7335 1.13318 15.0494 1.74524L8.20499 7.86922C7.80946 8.22311 7.20637 8.20637 6.83109 7.83109Z"
        fill="currentColor"
      />
    </svg>
  );
}
function TriangleLeft({ className = "" }: { className?: string }) {
  return (
    <svg width="9" height="12" viewBox="0 0 9 15" fill="none" className={className} aria-hidden>
      <path
        d="M8.5 13.5858V1.41421C8.5 0.523309 7.42286 0.0771427 6.79289 0.707108L0.707107 6.79289C0.316583 7.18342 0.316583 7.81658 0.707107 8.20711L6.79289 14.2929C7.42286 14.9229 8.5 14.4767 8.5 13.5858Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Blue gradient collapsible section header, like the reference rail. */
function Section({
  title,
  emoji,
  children,
  defaultOpen = true,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-none border-b border-white/10 px-3 py-2 text-left text-[14px] font-bold text-white"
        style={{ background: "var(--tx-accent-gradient)" }}
      >
        <span className="flex items-center gap-2">
          <span className="text-[16px] leading-none">{emoji}</span>
          {title}
        </span>
        {open ? (
          <TriangleLeft className="shrink-0 text-white/90" />
        ) : (
          <TriangleDown className="shrink-0 text-white/90" />
        )}
      </button>
      {open && <div className="bg-white">{children}</div>}
    </div>
  );
}

/** One sport / link row — emoji icon, black label and a trailing chevron. */
function Row({
  label,
  emoji,
  href,
}: {
  label: string;
  emoji: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 border-b border-slate-200 px-3 py-1.5 text-[14px] text-[#444] transition-colors rounded-none last:border-b-0 hover:bg-slate-50"
    >
      <span className="w-5 shrink-0 text-center text-[16px] leading-none">{emoji}</span>
      <span className="flex-1 truncate">{label}</span>
      <TriangleDown className="shrink-0 text-[#444]" />
    </Link>
  );
}

/**
 * TomExch left rail — a light sidebar with a market search, blue gradient section
 * headers and sport rows. Every list is admin-driven (no hardcoding): "Popular
 * Sports" = the owner-highlighted sports, "All Casinos" = the owner-pinned casino
 * categories, and "Sports" = the full public sports list — the same sources the
 * Default theme uses, updating live on owner toggle. Desktop-first (hidden below
 * lg, where the bottom tab nav takes over); collapsible via the nav's menu button.
 */
export function TomexchSidebar() {
  const { open } = useSidebar();
  const { data: sports = [] } = useLiveSportsList();
  const { categories: casinoCategories } = usePinnedCasinoCategories();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filteredSports = useMemo(
    () => (q ? sports.filter((s) => s.name.toLowerCase().includes(q)) : sports),
    [sports, q],
  );
  const popularSports = useMemo(
    () => sports.filter((s) => s.isHighlight),
    [sports],
  );

  return (
    <aside
      // Reference rail styling: Tahoma font + a thin (visible) scrollbar.
      style={{ fontFamily: 'Tahoma, Helvetica, "sans-serif"', scrollbarWidth: "thin" }}
      className={`hidden w-70 shrink-0 rounded-none flex-col overflow-y-auto border-r border-slate-200 bg-[var(--sidebar)] ${open ? "lg:flex" : "lg:hidden"
        }`}
    >
      {/* Market search — rounded grey pill with the magnifier inside. */}
      <div className="p-2">
        <div className="flex items-center gap-2 bg-[#e2e2e2] px-3.5 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Market..."
            className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-700 placeholder:text-slate-500 focus:outline-none"
          />
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
        </div>
      </div>

      {popularSports.length > 0 && (
        <Section title="Popular Sports" emoji="🔥">
          {popularSports.map((s) => (
            <Row key={s.id} label={s.name} emoji={sportEmoji(s.name)} href={sportHref(s)} />
          ))}
        </Section>
      )}

      <Section title="All Casinos" emoji="🎰" defaultOpen={false}>
        <Row label="All Casinos" emoji="🎰" href="/casino" />
        {casinoCategories.map((c) => (
          <Row key={c.key} label={c.label} emoji="🎲" href={c.href} />
        ))}
      </Section>

      <Section title="Sports" emoji="🏀">
        {filteredSports.length === 0 ? (
          <div className="px-3 py-3 text-[14px] rounded-none text-slate-400">No sports found.</div>
        ) : (
          filteredSports.map((s) => (
            <Row key={s.id} label={s.name} emoji={sportEmoji(s.name)} href={sportHref(s)} />
          ))
        )}
      </Section>
    </aside>
  );
}
