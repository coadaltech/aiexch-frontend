export interface Runner {
  runnerName: string;
  selectionId: string;
}

export interface OddsRunner {
  selectionId: number;
  status: string;
  handicap: number;
  lastPriceTraded: number;
  totalMatched: number;
  ex: {
    availableToBack: Array<{ price: number; size: number }>;
    availableToLay: Array<{ price: number; size: number }>;
    tradedVolume: Array<{ price: number; size: number }>;
  };
  back: Array<{ price: number; size: number }>;
  lay: Array<{ price: number; size: number }>;
  sp?: number;
  bsp?: number;
  removalDate?: string;
}

export interface Odds {
  marketId: string;
  isMarketDataDelayed?: boolean;
  status: string;
  betDelay?: number;
  bspReconciled?: boolean;
  complete?: boolean;
  inplay?: boolean;
  numberOfWinners?: number;
  numberOfRunners?: number;
  numberOfActiveRunners?: number;
  lastMatchTime?: string;
  totalMatched?: number;
  totalAvailable?: number;
  crossMatching?: boolean;
  runnersVoidable?: boolean;
  version?: number;
  runners: OddsRunner[];
}

export interface Market {
  marketName: string;
  marketId: string;
  marketStartTime: string;
  totalMatched: string;
  runners: Runner[];
  odds?: Odds;
}

export interface MarketListProps {
  markets: Market[];
  title?: string;
  isLoading?: boolean;
  showDraw?: boolean;
  showLay?: boolean;
  collapsible?: boolean;
}

export interface PremiumFancyData {
  RunnerName: string;
  LayPrice1: number;
  LaySize1: number;
  BackPrice1: number;
  BackSize1: number;
  SelectionId: string;
  gtype: string;
  GameStatus?: string;
}

export interface PremiumFancyListProps {
  premiumFancy: string[];
  title?: string;
  isLoading?: boolean;
  collapsible?: boolean;
}

export interface Match {
  event?: {
    id: string;
    name: string;
    countryCode?: string;
    timezone?: string;
    openDate: string;
  };
  marketCount?: number;
  scoreboard_id?: string;
  selections?: string;
  liability_type?: number;
  undeclared_markets?: number;
  bfid?: string;
  odds?: Market[]; // ✅ Added this to connect markets directly under each match
}

export interface MatchListProps {
  matches: Match[];
  eventType: string;
  competitionId: string;
  isLoading?: boolean;
}

export interface SessionData {
  RunnerName: string;
  LayPrice1: number;
  LaySize1: number;
  BackPrice1: number;
  BackSize1: number;
  SelectionId: string;
  min: string;
  sr_no: number;
  max: string;
  gtype: string;
  GameStatus: "Ball Running" | "SUSPENDED" | "ACTIVE" | "";
}

export interface SessionsListProps {
  sessions: SessionData[];
  title?: string;
  isLoading?: boolean;
  collapsible?: boolean;
}

/* ✅ New addition below — Full structure for Series → Matches */

export interface Series {
  id: string;
  name: string;
  matches: Match[];
}

export interface SeriesListProps {
  seriesList: Series[];
  isLoading?: boolean;
}

/* ✅ Optional helper type if you want to parse scoreboard tokens later */
export interface ScoreboardToken {
  id: string;
  ip: string;
  xid: string;
  token: string;
}
