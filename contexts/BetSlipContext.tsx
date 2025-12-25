"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface Bet {
  id: number;
  teams: string;
  market: string;
  odds: string;
  stake: string;
  potentialWin: string;
  matchId?: string;
  marketId?: string;
  selectionId?: string;
  marketName?: string;
  runnerName?: string;
}

interface BetSlipContextType {
  bets: Bet[];
  addToBetSlip: (bet: Bet) => void;
  removeBet: (id: number) => void;
  updateStake: (id: number, stake: string) => void;
  clearBets: () => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const { isLoggedIn } = useAuth();

  const addToBetSlip = (bet: Bet) => {
    if (!isLoggedIn) {
      toast.error("Please login to place bets");
      // Trigger auth modal by dispatching a custom event
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }

    const enhancedBet = {
      ...bet,
      matchId: bet.matchId || "1001",
      marketId: bet.marketId || bet.market.toLowerCase().replace(/\s+/g, "_"),
      selectionId: bet.selectionId || bet.id.toString(),
    };
    setBets([enhancedBet]); // Replace existing bet with new one
  };

  const removeBet = (id: number) => {
    setBets((prev) => prev.filter((bet) => bet.id !== id));
  };

  const updateStake = (id: number, newStake: string) => {
    setBets((prev) =>
      prev.map((bet) =>
        bet.id === id
          ? {
              ...bet,
              stake: newStake,
              potentialWin: (
                parseFloat(newStake) * parseFloat(bet.odds)
              ).toFixed(2),
            }
          : bet
      )
    );
  };

  const clearBets = () => {
    setBets([]);
  };

  return (
    <BetSlipContext.Provider
      value={{ bets, addToBetSlip, removeBet, updateStake, clearBets }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error("useBetSlip must be used within a BetSlipProvider");
  }
  return context;
}
