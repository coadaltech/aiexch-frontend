"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { ChevronRight, Zap } from "lucide-react";

interface Sport {
  id?: string;
  eventType?: string;
  name: string;
  title?: string;
  displayName?: string;
}

const sportLinkMapping: Record<string, string> = {
  "4": "/sports/cricket",
  "-4": "/sports/-4",
  "-17": "/sports/-17",
  "4339": "/sports/greyhound-racing",
  "7": "/sports/horse-racing",
  "1": "/sports/soccer",
  "2": "/sports/tennis",
  "matka": "/matka",
  "lotry": "/lotry",
  "skil-games": "/skil-games",
  "jambo": "/jambo",
};

const getSportIcon = (sportName: string): string => {
  const name = sportName.toLowerCase();
  if (name.includes("cricket")) return "cricket-bat.svg";
  if (name.includes("football") || name.includes("soccer")) return "soccer-ball.svg";
  if (name.includes("tennis")) return "tennis-racket.svg";
  if (name.includes("horse")) return "horse-racing.svg";
  if (name.includes("greyhound")) return "jumping-dog.svg";
  if (name.includes("kabaddi")) return "kabaddi.svg";
  if (name.includes("virtual")) return "t10.svg";
  if (name.includes("matka")) return "matka-icon.svg";
  if (name.includes("lotry")) return "play-button.svg";
  if (name.includes("skil")) return "play-button.svg";
  if (name.includes("jambo")) return "play-button.svg";
  return "play-button.svg";
};

const LIVE_SPORTS = new Set(["4", "1", "2", "7"]);

const matkaItem: Sport = { eventType: "matka", name: "Matka" };
const extraGames: Sport[] = [
  { eventType: "lotry", name: "Lotry" },
  { eventType: "skil-games", name: "Skil Games" },
  { eventType: "jambo", name: "Jambo" },
];

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/sports/sports-list");
        const data = response.data.data || [];
        setSports([...data, matkaItem, ...extraGames]);
      } catch {
        setSports([
          { eventType: "4", name: "Cricket" },
          { eventType: "-4", name: "KABADDI" },
          { eventType: "-17", name: "Virtual T10" },
          { eventType: "4339", name: "Greyhound Racing" },
          { eventType: "7", name: "Horse Racing" },
          { eventType: "1", name: "Football" },
          { eventType: "2", name: "Tennis" },
          matkaItem,
          ...extraGames,
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchSports();
  }, []);

  const getSportLink = (sport: Sport): string => {
    const eventType = String(sport.id || sport.eventType || "");
    return sportLinkMapping[eventType] || `/sports/${eventType}`;
  };

  const getSportName = (sport: Sport): string => {
    return sport.name || sport.title || sport.displayName || "Unknown Sport";
  };

  const isLive = (sport: Sport): boolean => {
    const et = String(sport.id || sport.eventType || "");
    return LIVE_SPORTS.has(et);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-full p-4">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] border-b border-[#1e4088]/40 px-4 py-3.5 flex items-center gap-2.5 shadow-md">
        <div className="w-1 h-5 bg-[#84c2f1] rounded-full" />
        <h1 className="text-white font-bold text-sm font-condensed tracking-wider">ALL SPORTS</h1>
      </div>

      {/* Sport list */}
      <div className="p-3 space-y-2">
        {sports.map((sport, index) => {
          const sportName = getSportName(sport);
          const sportLink = getSportLink(sport);
          const icon = getSportIcon(sportName);
          const live = isLive(sport);

          return (
            <Link
              key={index}
              href={sportLink}
              className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#142969]/30 rounded-xl px-4 py-3 transition-all duration-200 group shadow-sm hover:shadow-md"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a3578] to-[#142969] flex items-center justify-center shrink-0 border border-[#1e4088]/60 group-hover:border-[#84c2f1]/40 transition-colors">
                <Image
                  src={`/sports-icons/${icon}`}
                  height={24}
                  width={24}
                  alt={sportName}
                  className="w-6 h-6 opacity-90"
                />
              </div>

              {/* Name + live badge */}
              <div className="flex-1 min-w-0">
                <span className="text-gray-900 font-semibold text-sm">{sportName}</span>
                {live && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-[#84c2f1] rounded-full animate-pulse" />
                    <span className="text-[10px] text-[#142969] font-bold">LIVE</span>
                  </div>
                )}
              </div>

              {/* Live events badge */}
              {live && (
                <div className="flex items-center gap-1 shrink-0 bg-[#84c2f1]/10 border border-[#84c2f1]/30 rounded-lg px-2 py-0.5">
                  <Zap className="w-3 h-3 text-[#142969]" />
                  <span className="text-[10px] text-[#142969] font-bold">LIVE</span>
                </div>
              )}

              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && sports.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No sports available at the moment</p>
        </div>
      )}
    </div>
  );
}
