"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useLedgerLiveSync } from "@/hooks/useLedgerLiveSync";
import { prefetchCasinoGames } from "@/hooks/useCasinoGames";
import { isPanelPath } from "@/lib/panel-utils";
import { ThemedShell } from "./theme/themed-shell";

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

  // The visual chrome (header/sidebar/nav arrangement) is delegated to the
  // active theme's shell. All logic above — auth redirects, the ledger
  // websocket, casino prefetch and route detection — stays here, theme-agnostic,
  // so switching themes never touches business behaviour.
  return (
    <ThemedShell
      hideHeader={hideHeader}
      isCasinoRoute={isCasinoRoute}
      isHomeOrRoot={isHomeOrRoot}
    >
      {children}
    </ThemedShell>
  );
}
