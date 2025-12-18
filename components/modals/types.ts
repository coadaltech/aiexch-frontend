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
      marketName?: string;
      runnerName?: string;
      type: string;
    };
  };
}
