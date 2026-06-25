"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/app-sidebar-new";
import { NoticeTickerBar } from "@/components/layout/notice-ticker-bar";
import type { ThemeShellProps } from "@/themes/types";

/**
 * DEFAULT THEME SHELL
 *
 * A pixel-for-pixel preservation of the original MainLayout chrome (fixed white
 * header + left app sidebar + scrollable main + bottom notice ticker). Because
 * the markup is unchanged, selecting the Default theme is a guaranteed no-op vs.
 * the pre-theme platform — this is the backbone of backward compatibility.
 */
export function DefaultShell({
  children,
  hideHeader,
  isCasinoRoute,
  isHomeOrRoot,
}: ThemeShellProps) {
  return (
    <SidebarProvider>
      <div
        style={{ height: "var(--vh-full)" }}
        className="overflow-hidden bg-gray-200 w-full flex flex-col"
      >
        {/* Fixed Header — always visible at top, except on the unified casino
            which provides its own header bar. */}
        {!hideHeader && <Header />}

        {/* Main Content Area — only this part scrolls; header and (on mobile)
            bottom tab stay fixed. */}
        <div
          className={`flex flex-1 min-h-0 ${
            hideHeader
              ? "max-h-[var(--vh-full)]"
              : isCasinoRoute
                ? "mt-14 max-h-[calc(var(--vh-full)-3.5rem)]"
                : "mt-10 md:mt-30 max-h-[calc(var(--vh-full)-3.5rem)] md:max-h-[calc(var(--vh-full)-7.5rem)] md:gap-2 md:p-2"
          }`}
        >
          {/* Sidebar — starts below header. Hidden on casino (full-width). */}
          {!isCasinoRoute && <AppSidebar />}

          {/* Main content — scrollable area; pb for mobile so content clears the
              fixed bottom tab. */}
          <main
            className={`min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${
              isCasinoRoute ? "" : "pb-20 lg:pb-0 bg-[#efefef] md:rounded-xl"
            } ${isHomeOrRoot ? "scrollbar-hide" : ""}`}
            id="main-content"
          >
            {children}
          </main>
        </div>

        {!hideHeader && (
          <div className={isHomeOrRoot ? "hidden lg:block" : ""}>
            <NoticeTickerBar />
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
