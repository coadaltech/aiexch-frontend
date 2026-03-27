"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

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

const matkaItem: Sport = { eventType: "matka", name: "Matka" };
const extraGames: Sport[] = [
  { eventType: "lotry", name: "Lotry" },
  { eventType: "skil-games", name: "Skil Games" },
  { eventType: "jambo", name: "Jambo" },
];

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/sports/sports-list");
        const data = response.data.data || [];
        setSports([...data, matkaItem, ...extraGames]);
      } catch (err) {
        console.error("Error fetching sports:", err);
        setError("Failed to load sports");
        // Fallback to static data if API fails
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

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full mt-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading sports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-5">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          All Sports
        </h1>
        <p className="text-muted-foreground">
          Select a sport to view matches and place bets
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Sports Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
        {sports.map((sport, index) => {
          const sportName = getSportName(sport);
          const sportLink = getSportLink(sport);
          const icon = getSportIcon(sportName);

          return (
            <Link
              key={index}
              href={sportLink}
              className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-primary/30 hover:border-primary/70 transition-all duration-500 hover:scale-105 hover:-translate-y-1 cursor-pointer text-center block overflow-hidden"
            >
              {/* Glowing effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-amber-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10"></div>

              {/* Animated shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="flex flex-col items-center relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-amber-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-primary/30 border border-primary/30 group-hover:border-primary/60">
                  <Image
                    src={`/sports-icons/${icon}`}
                    height={48}
                    width={48}
                    alt={sportName}
                    className="w-10 h-10 sm:w-12 sm:h-12"
                  />
                </div>
                <h3 className="text-slate-200 font-semibold text-sm md:text-base group-hover:text-primary transition-colors duration-300">
                  {sportName}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && sports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No sports available at the moment
          </p>
        </div>
      )}
    </div>
  );
}
