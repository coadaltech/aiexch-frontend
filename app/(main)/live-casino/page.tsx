"use client";

import { useState } from "react";
import { GameCard } from "@/components/cards/game-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Mic, Star, Clock, Eye } from "lucide-react";
import { BannerCarousel } from "@/components/ui/banner-carousel";
import { liveCasinoBanners } from "@/data/banners";
import { allGames } from "@/data";

const liveDealers = [
  { id: 1, name: "Sarah", game: "Blackjack", players: 45, rating: 4.9, avatar: "/dealer1.jpg" },
  { id: 2, name: "Mike", game: "Roulette", players: 67, rating: 4.8, avatar: "/dealer2.jpg" },
  { id: 3, name: "Emma", game: "Baccarat", players: 23, rating: 4.9, avatar: "/dealer3.jpg" },
  { id: 4, name: "David", game: "Poker", players: 34, rating: 4.7, avatar: "/dealer4.jpg" },
];

const liveStats = [
  { label: "Active Tables", value: "24", icon: Video },
  { label: "Live Players", value: "1,247", icon: Users },
  { label: "Average Wait", value: "< 30s", icon: Clock },
];

export default function LiveCasinoPage() {
  const [selectedDealer, setSelectedDealer] = useState<number | null>(null);

  const liveGames = allGames.filter(game => game.category === "live-casino");

  return (
    <div className="min-h-screen">
      <BannerCarousel slides={liveCasinoBanners} />

      <div className=" px-4">
        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {liveStats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6 text-center">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured Dealers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Featured Live Dealers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveDealers.map((dealer) => (
                <div 
                  key={dealer.id} 
                  className={`bg-muted p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDealer === dealer.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedDealer(dealer.id)}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{dealer.name}</h3>
                    <Badge variant="secondary" className="mb-2">{dealer.game}</Badge>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {dealer.players}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {dealer.rating}
                      </span>
                    </div>
                    <Button size="sm" className="w-full mt-3">
                      Join Table
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Games */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {liveGames.map((game) => (
                <div key={game.id} className="relative">
                  <GameCard width="relative" game={game} />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border text-center">
            <Video className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">HD Streaming</h3>
            <p className="text-muted-foreground">Crystal clear video quality with multiple camera angles</p>
          </div>
          <div className="bg-card p-6 rounded-lg border text-center">
            <Mic className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Live Chat</h3>
            <p className="text-muted-foreground">Interact with dealers and other players in real-time</p>
          </div>
          <div className="bg-card p-6 rounded-lg border text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Professional Dealers</h3>
            <p className="text-muted-foreground">Experienced dealers from real casino studios</p>
          </div>
        </div>
      </div>
    </div>
  );
}