const DEMO_BETS_KEY = "demoBets";

export interface DemoBet {
  id: string;
  type: "back" | "lay";
  status: "pending" | "matched";
  stake: number;
  odds: number;
  marketName?: string;
  runnerName?: string;
  potentialWin: number;
  payout?: number;
  createdAt: string;
  matchId?: string;
  marketId?: string;
  selectionId?: string;
}

export function getDemoBets(): DemoBet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_BETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDemoBets(bets: DemoBet[]): void {
  const existing = getDemoBets();
  const updated = [...existing, ...bets];
  localStorage.setItem(DEMO_BETS_KEY, JSON.stringify(updated));
}

export function clearDemoBets(): void {
  localStorage.removeItem(DEMO_BETS_KEY);
}
