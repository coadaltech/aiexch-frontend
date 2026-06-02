"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, History, FileText, LogOut } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

/**
 * Casino settings/profile menu.
 *
 * The casino pages drop the normal white header, so the profile dropdown that
 * used to live there is reached here via the gear icon (matching the reference
 * design). Mirrors the header's user menu items.
 */
export function CasinoUserMenu() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!isLoggedIn) return null;

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Menu"
        aria-label="Menu"
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
          open
            ? "bg-white/10 text-[#ede105]"
            : "text-gray-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-white/10 bg-[#11161d] shadow-xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User info */}
          <div className="border-b border-white/10 px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">
              {user?.username}
            </p>
            {user?.isDemo && (
              <span className="mt-0.5 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                Demo
              </span>
            )}
          </div>

          {/* Items */}
          <div className="py-1">
            <button
              onClick={() => go("/profile")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <User className="h-4 w-4 shrink-0" />
              Profile
            </button>
            <button
              onClick={() => go("/profile/bet-history")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <History className="h-4 w-4 shrink-0" />
              Bet History
            </button>
            <button
              onClick={() => go("/profile/account-statement")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <FileText className="h-4 w-4 shrink-0" />
              Account Statement
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-white/10 py-1">
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
