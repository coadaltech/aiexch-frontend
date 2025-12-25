"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

export type CasinoGameCardData = {
  id?: string;
  uuid: string;
  name: string;
  image?: string | null;
  provider?: string | null;
  type?: string | null;
};

type CasinoGameCardProps = {
  game: CasinoGameCardData;
};

export function CasinoGameCard({ game }: CasinoGameCardProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleGameClick = useCallback(() => {
    if (!isLoggedIn) {
      toast.error("Please login to play casino games");
    } else {
      router.push(`/casino/${game.uuid}`);
    }
  }, [isLoggedIn, router, game.uuid]);

  return (
    <div
      onClick={handleGameClick}
      className="group relative overflow-hidden rounded-lg border bg-card hover:border-primary transition-all cursor-pointer block shadow-sm hover:shadow-md"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={game.image || "/placeholder-game.png"}
          alt={game.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
            {game.name}
          </h3>
          {game.provider && (
            <p className="text-white/80 text-xs">{game.provider}</p>
          )}
          {game.type && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
              {game.type}
            </span>
          )}
        </div>
      </div>
      <div className="p-2">
        <p className="text-xs text-muted-foreground line-clamp-1">
          {game.name}
        </p>
      </div>
    </div>
  );
}
