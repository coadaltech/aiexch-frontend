"use client";

import { usePathname } from "next/navigation";
import { BetSlip } from "@/components/sports/bet-slip";
import { useSiteTheme } from "@/contexts/ThemeContext";

export default function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme } = useSiteTheme();

  // Show bet slip only on match pages: /sports/{sport}/{seriesId}/{matchId}
  const segments = pathname.split("/").filter(Boolean);
  const isMatchPage = segments.length === 4 && segments[0] === "sports";
  const matchId = isMatchPage ? segments[3] : null;

  return (
    <div className="h-full w-full">
      <div className={`flex w-full h-full ${theme === "tomexch" ? "gap-0" : "gap-2"}`}>
        <div className="h-full w-full lg:flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>

        {/* Right Sidebar - Bet Slip (only on match pages, hidden on small screens) */}
        {isMatchPage && matchId && (
          <div className="hidden lg:flex flex-col shrink-0 h-full w-[320px] xl:w-[380px] bg-white rounded-xl overflow-hidden">
            <div id="quick-bet-slot-desktop" className="empty:hidden shrink-0" />
            <div className="flex-1 min-h-0">
              <BetSlip matchId={matchId} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bet Slip - floating button/modal only on match pages */}
      {isMatchPage && matchId && (
        <div className="lg:hidden">
          <BetSlip matchId={matchId} />
        </div>
      )}
    </div>
  );
}
