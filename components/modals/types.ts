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
      eventTypeId?: string | number;
      marketName?: string;
      runnerName?: string;
      type: string;
    };
  };
}
