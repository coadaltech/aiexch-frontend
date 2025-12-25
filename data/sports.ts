// Backend types
export interface Sports {
  eventType: string;
  name: string;
  marketCount: number;
}

// UI Display types
export interface Match {
  id: string;
  tournament: string;
  team1: string;
  team2: string;
  team1Flag?: string;
  team2Flag?: string;
  team1Score?: string;
  team2Score?: string;
  odds1?: string;
  odds2?: string;
  status: 'live' | 'upcoming' | 'finished';
  eventType: string;
  startTime?: string;
}

export const sportsGames: Sports[] = [
  {
    eventType: "cricket",
    name: "Cricket",
    marketCount: 185
  },
  {
    eventType: "football",
    name: "Football",
    marketCount: 95
  },
  {
    eventType: "tennis",
    name: "Tennis",
    marketCount: 42
  },
  {
    eventType: "basketball",
    name: "Basketball",
    marketCount: 28
  },
  {
    eventType: "table-tennis",
    name: "Table Tennis",
    marketCount: 15
  },
  {
    eventType: "badminton",
    name: "Badminton",
    marketCount: 8
  }
];

export const liveMatches: Match[] = [
  {
    id: "1",
    tournament: "T20 Asia Cup",
    team1: "India",
    team2: "Bangladesh",
    team1Flag: "🇮🇳",
    team2Flag: "🇧🇩",
    team1Score: "194/10 (52.5)",
    team2Score: "14/2 (6.0)",
    odds1: "1.08",
    odds2: "10.75",
    status: "live",
    eventType: "cricket",
    startTime: "20:00"
  },
  {
    id: "2",
    tournament: "Premier League",
    team1: "Manchester United",
    team2: "Liverpool",
    team1Flag: "🏴",
    team2Flag: "🏴",
    team1Score: "1",
    team2Score: "2",
    odds1: "4.25",
    odds2: "1.20",
    status: "live",
    eventType: "football"
  },
  {
    id: "3",
    tournament: "Australian Open",
    team1: "Novak Djokovic",
    team2: "Rafael Nadal",
    team1Score: "6-4, 2-1",
    team2Score: "",
    odds1: "1.53",
    odds2: "2.20",
    status: "live",
    eventType: "tennis"
  },
  {
    id: "4",
    tournament: "NBA Regular Season",
    team1: "Lakers",
    team2: "Warriors",
    team1Score: "98",
    team2Score: "102",
    odds1: "5.25",
    odds2: "1.09",
    status: "live",
    eventType: "basketball"
  }
];

export const upcomingMatches: Match[] = [
  {
    id: "5",
    tournament: "IPL 2024",
    team1: "Mumbai Indians",
    team2: "Chennai Super Kings",
    team1Flag: "🇮🇳",
    team2Flag: "🇮🇳",
    odds1: "1.85",
    odds2: "1.95",
    status: "upcoming",
    eventType: "cricket",
    startTime: "19:30"
  },
  {
    id: "6",
    tournament: "Champions League",
    team1: "Real Madrid",
    team2: "Barcelona",
    team1Flag: "🇪🇸",
    team2Flag: "🇪🇸",
    odds1: "2.10",
    odds2: "1.75",
    status: "upcoming",
    eventType: "football",
    startTime: "21:00"
  }
];

export const featuredMatches: Match[] = [
  ...liveMatches.slice(0, 2),
  ...upcomingMatches.slice(0, 2)
];

export const sportsList = [
  { eventType: "-4", name: "KABADDI" },
  // { eventType: "-5", name: "Election" },
  { eventType: "4", name: "Cricket" },
  { eventType: "-17", name: "Virtual T10" },
  { eventType: "4339", name: "Greyhound Racing" },
  { eventType: "7", name: "Horse Racing" },
  { eventType: "1", name: "Football" },
  { eventType: "2", name: "Tennis" },
];