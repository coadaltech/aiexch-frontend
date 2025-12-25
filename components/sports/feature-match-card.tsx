import { sportsGames } from "@/data";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Image from "next/image";

const getCountryCode = (teamName: string): string => {
  const countryMap: { [key: string]: string } = {
    'India': 'in',
    'Bangladesh': 'bd',
    'Manchester United': 'gb-eng',
    'Liverpool': 'gb-eng',
    'Novak Djokovic': 'rs',
    'Rafael Nadal': 'es',
    'Lakers': 'us',
    'Warriors': 'us',
    'Mumbai Indians': 'in',
    'Chennai Super Kings': 'in',
    'Real Madrid': 'es',
    'Barcelona': 'es'
  };
  return countryMap[teamName] || 'in';
};

const FeatureMatchCard = ({ match, onClick }: { match: any; onClick?: (match: any) => void }) => {
  const sportIcon =
    match.eventType === "soccer"
      ? "soccer-ball.svg"
      : match.eventType === "volleyball"
      ? "volleyball-ball.svg"
      : match.eventType === "cricket"
      ? "cricket-bat.svg"
      : "basketball-ball.svg";

  return (
    <div 
      className="relative min-w-[260px] sm:min-w-[300px] bg-card/40 p-3 rounded-lg border border-border text-foreground overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onClick?.(match)}
    >
      {/* Background sport icon */}
      <Image
        src={`/sports-icons/${sportIcon}`}
        height={80}
        width={80}
        alt={sportIcon}
        className="absolute top-2 right-2 opacity-10"
      />

      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="bg-primary/20 text-primary text-xs"
          >
            {match.status === "live" ? "🔴 Live" : "Upcoming"}
          </Badge>
          <span className="text-xs text-muted-foreground">{match.startTime} IST</span>
        </div>
        
        <div className="text-xs text-muted-foreground truncate">
          {match.tournament}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img 
                src={`https://flagcdn.com/w20/${getCountryCode(match.team1)}.png`} 
                alt={match.team1} 
                className="w-5 h-4 object-cover rounded-sm"
              />
              <span className="font-medium text-sm truncate">{match.team1}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {match.team1Score && (
                <span className="text-xs text-muted-foreground">{match.team1Score}</span>
              )}
              <Button size="sm" className="bg-primary text-primary-foreground min-w-[50px] h-8 text-xs">
                {match.odds1}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-1">
            <span className="text-muted-foreground text-xs font-medium">VS</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img 
                src={`https://flagcdn.com/w20/${getCountryCode(match.team2)}.png`} 
                alt={match.team2} 
                className="w-5 h-4 object-cover rounded-sm"
              />
              <span className="font-medium text-sm truncate">{match.team2}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {match.team2Score && (
                <span className="text-xs text-muted-foreground">{match.team2Score}</span>
              )}
              {match.odds2 && (
                <Button size="sm" className="bg-accent text-accent-foreground min-w-[50px] h-8 text-xs">
                  {match.odds2}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureMatchCard;
