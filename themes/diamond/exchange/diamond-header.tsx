"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZoomIn, ChevronDown, User, History, FileText, LogOut, LogIn } from "lucide-react";
import Logo from "@/components/layout/logo";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLedger } from "@/hooks/useUserQueries";
import { useSettings } from "@/hooks/usePublic";
import { formatBalance } from "@/lib/format-balance";

/**
 * Diamond top header — a faithful clone of the reference blue bar: red logo on
 * the left; Rules + zoom, Balance/Exp and the username dropdown on the right.
 * Reuses the existing auth + ledger hooks, so balance, exposure and logout are
 * unchanged — only the markup is Diamond.
 */
export function DiamondHeader() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { data: ledger } = useLedger(isLoggedIn && !user?.isDemo);
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 h-[4.25rem] shrink-0 bg-[var(--dx-header)] text-white shadow-md">
      <div className="flex h-full items-center justify-between pl-3 pr-4 sm:pr-6">
        {/* Logo */}
        <button onClick={() => router.push("/")} className="flex h-full shrink-0 items-center">
          <Logo onClick={() => router.push("/")} settings={settings} />
        </button>

        {/* Right cluster */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Theme switcher — styled to match the blue Diamond header. */}
          <ThemeSwitcher
            variant="surface"
            className="!h-8 !rounded-md !border-white/30 !bg-white/15 !px-3 !text-white !shadow-none hover:!bg-white/25"
          />

          <button
            onClick={() => router.push("/rules")}
            className="hidden items-center gap-2 text-[15px] font-semibold text-white hover:text-white/90 sm:flex"
          >
            <ZoomIn className="h-6 w-6" strokeWidth={2.2} />
            Rules
          </button>

          {isLoggedIn ? (
            <>
              <div className="text-[15px] leading-tight">
                <div>
                  Balance:<span className="font-bold">{formatBalance(ledger?.finalLimit ?? "0").inr}</span>
                </div>
                <div>
                  Exp:<span className="font-bold">{formatBalance(ledger?.limitConsumed ?? "0").inr}</span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center gap-2 text-[15px] font-medium"
                >
                  {user?.username}
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
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
              className="flex items-center gap-1.5 rounded bg-white/15 px-4 py-1.5 text-[15px] font-semibold hover:bg-white/25"
            >
              <LogIn className="h-4 w-4" /> Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
