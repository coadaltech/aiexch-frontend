"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BetSlip } from "@/components/sports/bet-slip";
import { sportsList } from "@/data";
import { useEffect } from "react";

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

  return (
    <div className="h-full w-full">
      {/* <div className="flex"> */}
      {/* <div className=""> */}
      {/* Sports Navigation */}
      {/* <div className="mb-6">
            <div className="border-border">
              <div className="flex items-center gap-4 sm:gap-4 overflow-x-auto scrollbar-hide -mr-4 pr-4">
                <Link
                  href="/sports/all"
                  className={`flex flex-col min-w-[100px] w-[100px] h-[100px] rounded-md p-4 items-center justify-center gap-1 cursor-pointer transition-colors ${
                    selectedSport === "all"
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <Image
                    src="/sports-icons/play-button.svg"
                    height={48}
                    width={48}
                    alt="All Sports"
                  />
                  <span className="text-xs text-foreground text-center leading-tight break-words">
                    All
                  </span>
                </Link>
                {sportsIcons.map((sport, i) => (
                  <Link
                    key={i}
                    href={`/sports/${sport.eventType}`}
                    className={`flex flex-col min-w-[100px] w-[100px] h-[100px] rounded-md p-4 items-center justify-center gap-1 cursor-pointer transition-colors ${
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
          </div> */}

      <div className="flex w-full">
        <div className="h-[calc(100vh-8rem)] w-full lg:w-[75%] overflow-scroll">
          {children}
        </div>

        {/* Right Sidebar - Bet Slip (hidden on small screens so main content gets full width) */}
        <div className="hidden lg:block shrink-0 h-[calc(100vh-8rem)] w-[25%] mr-2">
          <BetSlip />
        </div>
      </div>

      {/* Mobile Bet Slip - floating button/modal only when bets exist */}
      <div className="lg:hidden">
        <BetSlip />
      </div>
    </div>
  );
}
