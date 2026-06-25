"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { NoticeTickerBar } from "@/components/layout/notice-ticker-bar";
import { TomexchHeader } from "./exchange/tomexch-header";
import { TomexchNav } from "./exchange/tomexch-nav";
import { TomexchSidebar } from "./exchange/tomexch-sidebar";
import { TomexchFooter } from "./exchange/tomexch-footer";
import type { ThemeShellProps } from "@/themes/types";

/**
 * TOMEXCH THEME SHELL — a navy→blue gradient header, a white icon nav, a light
 * left rail with blue gradient section headers, and the page content on a light
 * canvas. Purpose-built TomExch chrome (themes/tomexch/exchange/*) that reuses
 * the platform's data hooks, so behaviour is unchanged — only the look.
 *
 * The Default theme is untouched: this shell only renders when TomExch is active.
 * SidebarProvider is kept so the nav's menu button can collapse the rail and any
 * content that calls `useSidebar` keeps working.
 */
export function TomexchShell({
  children,
  hideHeader,
  isCasinoRoute,
  isHomeOrRoot,
}: ThemeShellProps) {
  // Full-bleed routes (unified casino, game launcher) render their own chrome.
  if (hideHeader) {
    return (
      <div
        data-theme-shell="tomexch"
        style={{ height: "var(--vh-full)" }}
        className="tx-root w-full overflow-hidden"
      >
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div
        data-theme-shell="tomexch"
        style={{ height: "var(--vh-full)" }}
        className="tx-root flex w-full flex-col overflow-hidden bg-[var(--tx-bg)]"
      >
        <TomexchHeader />

        {/* Sidebar starts directly under the header (full content height); the
            nav bar sits only above the main content, never over the sidebar. */}
        <div className="flex min-h-0 flex-1">
          {!isCasinoRoute && <TomexchSidebar />}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <TomexchNav />
            <main
              id="main-content"
              className={`tx-main min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden ${
                isHomeOrRoot ? "scrollbar-hide" : ""
              }`}
            >
              {children}
              {!isCasinoRoute && <TomexchFooter />}
            </main>
          </div>
        </div>

        <div className="hidden lg:block">
          <NoticeTickerBar />
        </div>
      </div>
    </SidebarProvider>
  );
}
