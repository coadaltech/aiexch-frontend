"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarProvider } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useLedgerLiveSync } from "@/hooks/useLedgerLiveSync";
import { prefetchCasinoGames } from "@/hooks/useCasinoGames";
import { isPanelPath } from "@/lib/panel-utils";
import { NoticeTickerBar } from "./layout/notice-ticker-bar";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: whitelabelInfo, isLoading: whitelabelLoading } = useWhitelabelInfo();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  // Own the BAL/EXP `ledger` WebSocket here — the one component that stays
  // mounted across every route change (exchange ↔ casino). Keeping it out of
  // Header/CasinoWallet (which mount/unmount per route) means the socket never
  // churns, so the post-bet balance/exposure push lands instantly with no poll.
  useLedgerLiveSync();

  const isOwnerRoute = isPanelPath(pathname);
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");

  const isHomeOrRoot = pathname === "/" || pathname === "/home";
  // Casino runs as a full-width "system" page: header + dropheader + content,
  // but NO sidebar. The dropheader shows an Exchange button to return.
  // The unified casino is exactly /casino (and /casino/...). Match it precisely
  // so the separate /casino-ace routes don't get caught by a loose prefix.
  const isUnifiedCasino =
    pathname === "/casino" || (pathname?.startsWith("/casino/") ?? false);
  const isCasinoRoute =
    (pathname?.startsWith("/casino-ace") || isUnifiedCasino) ?? false;
  // The unified casino (/casino) renders its own full-width header bar
  // (logo + category nav + BAL/LIAB + settings), so the normal white header is
  // dropped there entirely. The RV Casino (Ace) game launcher likewise renders
  // its own toolbar, so drop the global header on its play route too — otherwise
  // two headers stack. The /casino-ace lobby keeps the global header.
  const hideHeader =
    (isUnifiedCasino || pathname?.startsWith("/casino-ace/play")) ?? false;
  const whitelabelNotFound =
    !whitelabelLoading && whitelabelInfo?.whitelabelType == null;

  // Warm the casino game caches in the background once the app is idle, so the
  // grid is already populated by the time the user opens the casino. No-ops
  // while the cache is fresh (5 min), so this is at most one fetch per window.
  useEffect(() => {
    if (!isLoggedIn || isOwnerRoute || isAuthRoute) return;
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const run = () => prefetchCasinoGames(queryClient);
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run);
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, [isLoggedIn, isOwnerRoute, isAuthRoute, queryClient]);

  useEffect(() => {
    if (isOwnerRoute || isAuthRoute) return;
    if (whitelabelLoading) return;
    if (whitelabelNotFound) {
      router.replace("/login");
      return;
    }
    if (!isLoggedIn && isHomeOrRoot) {
      router.replace("/login");
    }
  }, [isOwnerRoute, isAuthRoute, whitelabelLoading, whitelabelNotFound, isLoggedIn, isHomeOrRoot, router]);

  if (isOwnerRoute || isAuthRoute) {
    return <>{children}</>;
  }

  if (whitelabelNotFound || (!isLoggedIn && isHomeOrRoot)) {
    return null;
  }
  return (
    <SidebarProvider>
      <div style={{ height: 'var(--vh-full)' }} className="overflow-hidden bg-gray-200 w-full flex flex-col">
        {/* Fixed Header - always visible at top, except on the unified casino
            which provides its own header bar. */}
        {!hideHeader && <Header />}

        {/* Main Content Area - only this part scrolls; header and (on mobile) bottom tab stay fixed.
            Casino pages hide the dropheader, so they only need to clear the ~3.5rem top bar
            (no md:mt-30) — otherwise an empty grey gap appears. They're also flush (no padding).
            When the header itself is hidden, no top offset is needed. */}
        <div
          className={`flex flex-1 min-h-0 ${
            hideHeader
              ? "max-h-[var(--vh-full)]"
              : isCasinoRoute
                ? "mt-14 max-h-[calc(var(--vh-full)-3.5rem)]"
                : "mt-10 md:mt-30 max-h-[calc(var(--vh-full)-3.5rem)] md:max-h-[calc(var(--vh-full)-7.5rem)] md:gap-2 md:p-2"
          }`}
        >
          {/* Sidebar - Starts below header. Hidden on casino (full-width). */}
          {!isCasinoRoute && <AppSidebar />}

          {/* Main Content - scrollable area; pb for mobile so content clears fixed bottom tab */}
          <main
            className={`min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${
              isCasinoRoute ? "" : "pb-20 lg:pb-0 bg-[#efefef] md:rounded-xl"
            } ${isHomeOrRoot ? "scrollbar-hide" : ""}`}
            id="main-content"
          >
            {children}
            {/* 1. Notice ticker */}
          </main>
        </div>
      {/* The QTech casino renders its own ticker at the top (under its custom
          header), so skip the global bottom one there to avoid a duplicate.
          On the home page the ticker moves above the banners on mobile, so the
          global bottom bar is hidden there below lg (desktop keeps it). */}
      {!hideHeader && (
        <div className={isHomeOrRoot ? "hidden lg:block" : ""}>
          <NoticeTickerBar />
        </div>
      )}

      </div>
    </SidebarProvider>
  );
}
