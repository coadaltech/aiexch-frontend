export interface BettingModalRunner {
  id: string;
  name: string;
  price: number;
}

export interface BettingModalProps {
  open: boolean;
  onClose: () => void;
  match: {
    teams: string;
    odds: string;
    market: string;
    marketData?: {
      matchId: string;
      marketId: string;
      selectionId: string;
      selectionName?: string;
      eventTypeId?: string | number;
      marketName?: string;
      marketType?: string;
      type: string;
      runners?: BettingModalRunner[];
    };
  };
}
