"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronDown, User, History, FileText, LogOut } from "lucide-react";
import Logo from "@/components/layout/logo";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLedger } from "@/hooks/useUserQueries";
import { useSettings } from "@/hooks/usePublic";
import { formatBalance } from "@/lib/format-balance";

/**
 * Betfair top header — a faithful clone of the reference golden bar: the logo +
 * Help + central search with the Mobile button and login on the right. Reuses the
 * existing auth + ledger hooks, so balance and logout are unchanged — only the
 * markup is Betfair.
 */
export function BetfairHeader() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { data: ledger } = useLedger(isLoggedIn && !user?.isDemo);
  const { data: settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  const openAuth = () => window.dispatchEvent(new Event("openAuthModal"));

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[var(--bf-head)] text-[#1f2937] shadow-md">
      {/* Row 1 — logo, help, search, mobile, login */}
      <div className="flex h-11 items-center gap-3 px-3 sm:px-4">
        <button onClick={() => router.push("/")} className="flex shrink-0 items-center">
          <Logo onClick={() => router.push("/")} settings={settings} />
        </button>

        <Link
          href="/faqs"
          className="hidden shrink-0 text-sm font-bold text-[#1f2937] hover:underline sm:block"
        >
          Help
        </Link>

        {/* Central search */}
        <div className="mx-auto hidden w-full max-w-md items-center md:flex">
          <div className="flex w-full items-center gap-2 rounded-sm bg-white px-3 py-1.5 shadow-inner">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Find teams, competitions, races, and m…"
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Theme switcher — styled for the golden Betfair header (dark text). */}
          <ThemeSwitcher
            variant="surface"
            className="!rounded-sm !border-black/20 !bg-black/10 !text-current !shadow-none hover:!bg-black/20"
          />

          <span className="hidden items-center gap-1 rounded-sm bg-black px-2 py-1 text-[11px] font-bold text-[var(--bf-head)] sm:inline-flex">
             Mobile
          </span>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="text-right text-[11px] leading-tight sm:text-xs">
                <div className="font-bold">
                  Balance {formatBalance(ledger?.finalLimit ?? "0").inr}
                </div>
                <div className="text-[10px] text-[#5a4500] sm:text-[11px]">
                  Exp {formatBalance(ledger?.limitConsumed ?? "0").inr}
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-sm bg-black/10 px-3 py-1.5 text-sm font-bold hover:bg-black/20"
                >
                  {user?.username}
                  <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-sm border border-slate-200 bg-white text-slate-700 shadow-xl">
                      <button
                        onClick={() => { router.push("/profile"); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <User className="h-4 w-4" /> Profile
                      </button>
                      <button
                        onClick={() => { router.push("/profile/bet-history"); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <History className="h-4 w-4" /> Bet History
                      </button>
                      <button
                        onClick={() => { router.push("/profile/account-statement"); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <FileText className="h-4 w-4" /> Account Statement
                      </button>
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="email/username"
                onFocus={openAuth}
                className="hidden h-7 w-32 rounded-sm border border-black/20 bg-white px-2 text-xs focus:outline-none lg:block"
              />
              <input
                type="password"
                placeholder="password"
                onFocus={openAuth}
                className="hidden h-7 w-28 rounded-sm border border-black/20 bg-white px-2 text-xs focus:outline-none lg:block"
              />
              <button
                onClick={openAuth}
                className="rounded-sm bg-white px-3 py-1.5 text-xs font-bold text-[#1f2937] shadow-sm hover:bg-slate-100"
              >
                Log In
              </button>
              <button
                onClick={openAuth}
                className="rounded-sm bg-[#1e2530] px-3 py-1.5 text-xs font-bold text-white hover:bg-black"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
