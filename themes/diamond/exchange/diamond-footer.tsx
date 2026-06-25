"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useWhitelabelInfo } from "@/hooks/useAuth";

/**
 * DIAMOND footer — the reference site footer: a blue link bar (Terms /
 * Responsible Gaming / 24x7 Support), a "100% SAFE" SSL-secure row with the
 * 18+ / compliance badges, and a copyright line. The brand name in "Powered by"
 * comes from the white-label info (not hardcoded) and the year is computed live.
 * Rendered at the bottom of the home content so it scrolls into view like the
 * Default theme's footer.
 */
export function DiamondFooter() {
  const { data: whitelabel } = useWhitelabelInfo();
  const brand = (whitelabel?.name ?? "").trim();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-2 border-t border-slate-300 bg-white text-slate-700">
      {/* Top blue link bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 bg-[var(--dx-header)] px-4 py-3 text-[15px] font-bold text-white">
        <Link href="/terms" className="hover:underline">
          Terms and Conditions
        </Link>
        <Link href="/responsible-gaming" className="hover:underline">
          Responsible Gaming
        </Link>
        <Link href="/live-support" className="hover:underline">
          24X7 Support
        </Link>
      </div>

      {/* Safety statement + compliance badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* SSL "SECURE" shield badge */}
          <span className="flex items-center gap-1.5 rounded bg-gradient-to-b from-emerald-500 to-emerald-700 px-2.5 py-1.5 text-black shadow-sm">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span className="leading-none">
              <span className="block text-[13px] font-extrabold tracking-wide">SECURE</span>
              <span className="block text-[8px] font-semibold tracking-[0.2em]">
                SSL ENCRYPTION
              </span>
            </span>
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">100% SAFE</p>
            <p className="text-[13px] text-slate-600">
              Protected connection and encrypted data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-rose-500 text-[11px] font-bold text-rose-600">
            18+
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-[12px] font-bold text-white">
            G
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-[12px] font-bold lowercase text-white">
            gt
          </span>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-200 px-4 py-3 text-center text-[14px] font-semibold text-slate-700">
        © Copyright {year}. All Rights Reserved.
        {brand ? ` Powered by ${brand}.` : ""}
      </div>
    </footer>
  );
}
