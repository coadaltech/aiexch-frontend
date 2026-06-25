"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Volleyball,
  Target,
  Dog,
  Spade,
  Flag,
  Disc3,
  MoreHorizontal,
} from "lucide-react";

/**
 * TomExch mobile quick-access — the Exchange/Casino/RV Casino mode tabs plus the
 * 8-tile sport category grid, mirroring the Default theme's mobile home block
 * (active tab + icons use --header-primary, which is navy in TomExch). Rendered
 * only below lg, where the desktop sidebar/nav aren't shown.
 */
const QUICK_ACCESS = [
  { label: "Cricket", href: "/sports/cricket", icon: Trophy },
  { label: "Soccer", href: "/sports/soccer", icon: Volleyball },
  { label: "Tennis", href: "/sports/tennis", icon: Target },
  { label: "Horse Racing", href: "/sports/horse-racing", icon: Dog },
  { label: "Matka", href: "/matka", icon: Spade },
  { label: "Election", href: "/sports/politics", icon: Flag },
  { label: "Bombay Bazar", href: "/bombay-bazar", icon: Disc3 },
  { label: "More", href: "/casino", icon: MoreHorizontal },
];

export function TomexchQuickAccess() {
  const router = useRouter();
  const tabBase =
    "flex-1 rounded-lg py-2 px-3 text-xs sm:text-sm font-bold tracking-wide transition-colors text-center";

  return (
    <div className="space-y-2 py-2 lg:hidden">
      {/* Mode tabs: Exchange | Casino | RV Casino */}
      <div className="px-3">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button className={`${tabBase} bg-[var(--header-primary)] text-white`}>
            EXCHANGE
          </button>
          <button
            onClick={() => router.push("/casino")}
            className={`${tabBase} text-gray-600 hover:bg-gray-100`}
          >
            CASINO
          </button>
          <button
            onClick={() => router.push("/casino/category/rvcasino")}
            className={`${tabBase} text-gray-600 hover:bg-gray-100`}
          >
            RV CASINO
          </button>
        </div>
      </div>

      {/* Quick access sport grid */}
      <div className="px-3">
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-gray-200 bg-gray-100 p-2">
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-1 py-3 transition-all hover:border-[var(--header-primary)]/40 hover:shadow-sm"
              >
                <Icon className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6" />
                <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 group-hover:text-gray-900 sm:text-[11px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
