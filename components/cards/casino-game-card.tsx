import Link from "next/link";
import Image from "next/image";

interface CasinoGameCardProps {
  game: {
    uuid: string;
    name: string;
    image: string;
    provider: string;
    type: string;
  };
}

export function CasinoGameCard({ game }: CasinoGameCardProps) {
  return (
    <Link
      href={`/casino/${game.uuid}`}
      className="flex-shrink-0 w-44 md:w-64 group"
    >
      <div className="relative overflow-hidden rounded-lg border bg-card hover:border-primary transition-all">
        <div className="aspect-[4/3] relative">
          <Image
            src={game.image}
            alt={game.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
            <h3 className="text-white font-semibold text-xs truncate">
              {game.name}
            </h3>
            <p className="text-white/80 text-[10px] truncate">
              {game.provider}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
