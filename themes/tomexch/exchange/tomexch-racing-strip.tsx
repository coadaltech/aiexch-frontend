"use client";

import Link from "next/link";

/**
 * TomExch "Today's Racing" strips — a titled row of country pills, like the
 * reference Horse / Greyhound racing shortcuts. Each pill links to the racing
 * sport page (filtering by country is handled there). Presentation chrome.
 */
export function TomexchRacingStrip({
  title,
  emoji,
  href,
  countries,
}: {
  title: string;
  emoji: string;
  href: string;
  countries: { code: string; flag: string }[];
}) {
  return (
    <section className="mx-2 mb-2 overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-[14px] font-bold text-slate-800">
        <span aria-hidden>{emoji}</span>
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
        {countries.map((c) => (
          <Link
            key={c.code}
            href={href}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <span aria-hidden>{c.flag}</span>
            {c.code}
          </Link>
        ))}
      </div>
    </section>
  );
}

export const HORSE_RACING_COUNTRIES = [
  { code: "GB", flag: "🇬🇧" },
  { code: "FR", flag: "🇫🇷" },
  { code: "IE", flag: "🇮🇪" },
  { code: "AU", flag: "🇦🇺" },
  { code: "ZA", flag: "🇿🇦" },
  { code: "US", flag: "🇺🇸" },
  { code: "NZ", flag: "🇳🇿" },
];

export const GREYHOUND_COUNTRIES = [
  { code: "AU", flag: "🇦🇺" },
  { code: "GB", flag: "🇬🇧" },
];
