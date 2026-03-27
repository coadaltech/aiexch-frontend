"use client";

import { usePathname } from "next/navigation";
import { BetSlip } from "@/components/sports/bet-slip";

export default function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Show bet slip only on match pages: /sports/{sport}/{seriesId}/{matchId}
  const segments = pathname.split("/").filter(Boolean);
  const isMatchPage = segments.length === 4 && segments[0] === "sports";
  const matchId = isMatchPage ? segments[3] : null;

  return (
    <div className="h-full w-full">
      <div className="flex w-full h-full">
        <div className="h-full w-full lg:flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>

        {/* Right Sidebar - Bet Slip (only on match pages, hidden on small screens) */}
        {isMatchPage && matchId && (
          <div className="hidden lg:block shrink-0 h-full w-[280px] xl:w-[320px] mr-2">
            <BetSlip matchId={matchId} />
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
