"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { NoticeTickerBar } from "@/components/layout/notice-ticker-bar";
import { DiamondHeader } from "./exchange/diamond-header";
import { DiamondNav } from "./exchange/diamond-nav";
import { DiamondSidebar } from "./exchange/diamond-sidebar";
import type { ThemeShellProps } from "@/themes/types";

/**
 * DIAMOND THEME SHELL — dedicated chrome that reproduces the reference exchange:
 * a flat blue header, an olive/gold nav bar and the blue-headed markets sidebar.
 * These are purpose-built Diamond components (themes/diamond/exchange/*) that
 * reuse the platform's data hooks, so behaviour is unchanged — only the look.
 *
 * The Default theme is untouched: this shell only renders when the Diamond theme
 * is active. SidebarProvider is kept so any content that calls `useSidebar`
 * keeps working.
 */
export function DiamondShell({
  children,
  hideHeader,
  isCasinoRoute,
}: ThemeShellProps) {
  // Full-bleed routes (unified casino, game launcher) render their own chrome.
  if (hideHeader) {
    return (
      <div
        data-theme-shell="diamond"
        style={{ height: "var(--vh-full)" }}
        className="dx-root w-full overflow-hidden"
      >
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div
        data-theme-shell="diamond"
        style={{ height: "var(--vh-full)" }}
        className="dx-root flex w-full flex-col overflow-hidden bg-[#f4f6f8]"
      >
        <DiamondHeader />
        <DiamondNav />

        {/* Header + nav are normal flow blocks above, so the content simply
            fills the remaining height — flush, no offset/gap to guess. */}
        <div className="flex min-h-0 flex-1">
          {!isCasinoRoute && <DiamondSidebar />}
          <main
            id="main-content"
            className="dx-main min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden"
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
