"use client";

import { BetSlip } from "@/components/sports/bet-slip";

export default function MultimarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full">
      <div className="flex w-full h-full gap-2">
        <div className="h-full w-full lg:flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>

        {/* Right Sidebar - BetSlip. matchId is empty so the "This Match"
            tab reads as 0; users work from the "All Bets" tab since pins
            span multiple events. */}
        <div className="hidden lg:flex shrink-0 h-full w-[320px] xl:w-[380px] bg-white rounded-xl overflow-hidden">
          <BetSlip matchId="" />
        </div>
      </div>

      {/* Mobile BetSlip - floating */}
      <div className="lg:hidden">
        <BetSlip matchId="" />
      </div>
    </div>
  );
}
