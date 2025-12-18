"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { BetSlip } from "@/components/sports/bet-slip";
import { sportsList } from "@/data";

const sportsIcons = sportsList.map((sport) => ({
  name: sport.name,
  icon:
    sport.name.toLowerCase() === "cricket"
      ? "cricket-bat.svg"
      : sport.name.toLowerCase() === "football"
      ? "soccer-ball.svg"
      : sport.name.toLowerCase() === "tennis"
      ? "tennis-racket.svg"
      : sport.name.toLowerCase() === "election"
      ? "election.svg"
      : sport.name.toLowerCase() === "kabaddi"
      ? "kabaddi.svg"
      : sport.name.toLowerCase() === "horse racing"
      ? "horse-racing.svg"
      : sport.name.toLowerCase() === "virtual t10"
      ? "t10.svg"
      : sport.name.toLowerCase() === "greyhound racing"
      ? "jumping-dog.svg"
      : "play-button.svg",
  eventType: sport.eventType,
}));

export default function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const selectedSport = pathname.split("/")[2] || "-4";
  const { bets } = useBetSlip();

  return (
    <div className="min-h-screen">
      <div className="flex">
        <div className="flex-1 lg:p-6 lg:pt-0 pb-20 lg:pb-6 w-full">
          {/* Sports Navigation */}
          <div className="mb-6">
            <div className="border-border">
              <div className="flex items-center gap-4 sm:gap-4 overflow-x-auto scrollbar-hide -mr-4 pr-4">
                {sportsIcons.map((sport, i) => (
                  <Link
                    key={i}
                    href={`/sports/${sport.eventType}`}
                    className={`flex flex-col w-[100px] h-[100px] rounded-md p-4 items-center justify-center gap-1 cursor-pointer transition-colors ${
                      selectedSport === sport.eventType
                        ? "bg-primary/20 border border-primary/50"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <Image
                      src={`/sports-icons/${sport.icon}`}
                      height={48}
                      width={48}
                      alt={sport.icon}
                    />
                    <span className="text-xs text-foreground text-center leading-tight break-words">
                      {sport.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {children}
        </div>

        {/* Right Sidebar - Bet Slip */}
        <div className="hidden lg:block w-80 relative">
          <div className="fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] overflow-y-auto p-4">
            <BetSlip />
          </div>
        </div>
      </div>

      {/* Mobile Bet Slip */}
      <div className="lg:hidden">
        <BetSlip />
      </div>
    </div>
  );
}
