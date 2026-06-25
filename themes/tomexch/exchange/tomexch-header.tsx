"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, User, History, FileText, LogOut, LogIn } from "lucide-react";
import Logo from "@/components/layout/logo";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useLedger } from "@/hooks/useUserQueries";
import { useSettings } from "@/hooks/usePublic";
import { formatBalance } from "@/lib/format-balance";

/**
 * TomExch top header — a navy→blue gradient bar: the brand logo on the left, a
 * centred "WELCOME TO <BRAND>." line, and the theme switcher + Login (or
 * balance/exposure + account menu) on the right. Reuses the existing auth +
 * ledger hooks, so balance, exposure and logout behaviour are unchanged.
 */
export function TomexchHeader() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { data: ledger } = useLedger(isLoggedIn && !user?.isDemo);
  const { data: settings } = useSettings();
  const { data: whitelabel } = useWhitelabelInfo();
  const [open, setOpen] = useState(false);

  const brand = (whitelabel?.name ?? "").trim();
  const welcomeText = brand ? `Welcome to ${brand}.` : "Welcome.";

  return (
    <header
      className="relative z-50 h-[60px] shrink-0 text-white shadow-md"
      style={{ background: "var(--tx-header-bg)" }}
    >
      <div className="flex h-full items-center justify-between pl-3 pr-4 sm:pr-6">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex h-full shrink-0 items-center"
        >
          <Logo onClick={() => router.push("/")} settings={settings} />
        </button>

        {/* Welcome notice — a seamless scrolling marquee (desktop only), sitting
            between the logo and the right cluster so it never overlaps them. */}
        <div className="pointer-events-none mx-4 hidden min-w-0 flex-1 overflow-hidden lg:block">
          <div className="flex w-max animate-[txMarquee_18s_linear_infinite] whitespace-nowrap">
            <span className="px-8 text-[15px] font-normal uppercase tracking-wide text-white/95">
              {welcomeText}
            </span>
            <span
              className="px-8 text-[15px] font-normal uppercase tracking-wide text-white/95"
              aria-hidden
            >
              {welcomeText}
            </span>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3 sm:gap-5">
          <ThemeSwitcher
            variant="surface"
            className="!h-8 !rounded-md !border-white/30 !bg-white/15 !px-3 !text-white !shadow-none hover:!bg-white/25"
          />

          {isLoggedIn ? (
            <>
              <div className="text-right text-[11px] leading-tight sm:text-left sm:text-[14px]">
                <div>
                  Balance:
                  <span className="font-bold">
                    {formatBalance(ledger?.finalLimit ?? "0").inr}
                  </span>
                </div>
                <div>
                  Exp:
                  <span className="font-bold">
                    {formatBalance(ledger?.limitConsumed ?? "0").inr}
                  </span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center gap-2 text-[15px] font-medium"
                >
                  {user?.username}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xl">
                      <button
                        onClick={() => { router.push("/profile"); setOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <User className="h-4 w-4" /> Profile
                      </button>
                      <button
                        onClick={() => { router.push("/profile/bet-history"); setOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <History className="h-4 w-4" /> Bet History
                      </button>
                      <button
                        onClick={() => { router.push("/profile/account-statement"); setOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <FileText className="h-4 w-4" /> Account Statement
                      </button>
                      <button
                        onClick={() => { logout(); setOpen(false); }}
                        className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => window.dispatchEvent(new Event("openAuthModal"))}
              className="flex items-center gap-1.5 rounded-md border border-white/40 bg-white/15 px-4 py-1.5 text-[15px] font-semibold text-white hover:bg-white/25"
            >
              <LogIn className="h-4 w-4" /> Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
