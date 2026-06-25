"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { NoticeTickerBar } from "@/components/layout/notice-ticker-bar";
import { BetfairHeader } from "./exchange/betfair-header";
import { BetfairNav } from "./exchange/betfair-nav";
import { BetfairSidebar } from "./exchange/betfair-sidebar";
import type { ThemeShellProps } from "@/themes/types";

/**
 * BETFAIR THEME SHELL — dedicated chrome that reproduces the Betfair Exchange:
 * a golden top header with product tabs, a dark navy nav bar and the grey
 * "My Markets / Sports" rail. These are purpose-built Betfair components
 * (themes/betfair/exchange/*) that reuse the platform's data hooks, so behaviour
 * is unchanged — only the look.
 *
 * The Default theme is untouched: this shell only renders when the Betfair theme
 * is active. SidebarProvider is kept so any content that calls `useSidebar`
 * keeps working.
 */
export function BetfairShell({
  children,
  hideHeader,
  isCasinoRoute,
  isHomeOrRoot,
}: ThemeShellProps) {
  // Full-bleed routes (unified casino, game launcher) render their own chrome.
  if (hideHeader) {
    return (
      <div
        data-theme-shell="betfair"
        style={{ height: "var(--vh-full)" }}
        className="bf-root w-full overflow-hidden"
      >
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div
        data-theme-shell="betfair"
        style={{ height: "var(--vh-full)" }}
        className="bf-root flex w-full flex-col overflow-hidden bg-[var(--bf-bg,#e4e6e9)]"
      >
        <BetfairHeader />
        <BetfairNav />

        {/* Offset for the fixed header (4.75rem) + navy nav (~2.5rem). */}
        <div
          className="flex min-h-0 flex-1"
          style={{
            marginTop: "7.25rem",
            maxHeight: "calc(var(--vh-full) - 7.25rem)",
          }}
        >
          {!isCasinoRoute && <BetfairSidebar />}
          <main
            id="main-content"
            className={`bf-main min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden ${
              isHomeOrRoot ? "scrollbar-hide" : ""
            }`}
          >
            {children}
          </main>
        </div>

        <div className="hidden lg:block">
          <NoticeTickerBar />
        </div>
      </div>
    </SidebarProvider>
  );
}
