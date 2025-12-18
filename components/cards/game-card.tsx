import { Game, GameType } from "@/types";
import Image from "next/image";
import Link from "next/link";

export const GameCard = ({
  game,
  type,
  width = "fixed",
  variant = "default",
}: {
  game: Game;
  type: GameType;
  width?: "fixed" | "relative";
  variant?: "default" | "compact" | "banner" | "short";
}) => {
  let containerClass = `
    flex-shrink-0 group cursor-pointer relative ${
      width === "fixed" ? "md:w-64 w-44" : "w-full"
    } 
    rounded-xl overflow-hidden transform transition-all duration-300  bg-card border border-primary/20 hover:border-primary/50
  `;

  const href = `${process.env.NEXT_PUBLIC_URL}/${type}/${game.link}`;

  return (
    <Link href={href} key={game.id} className={containerClass}>
      <div className={`relative aspect-[4/3] overflow-hidden`}>
        <Image
          height={500}
          width={300}
          src={game.image || "/game.webp"}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Game Name */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide text-shadow">
            {game.name}
          </h3>
        </div>

        {/* Badges */}
        <div className="md:flex hidden items-center gap-2 absolute top-2 right-2">
          {game.popular && (
            <div className=" bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-bold shadow-lg">
              POPULAR
            </div>
          )}
          {game.hot && (
            <div className=" bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-pulse">
              HOT
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
