"use client";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Calculator, Loader2 } from "lucide-react";
import { useBetting } from "@/hooks/useBetting";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BettingModalProps } from "./types";

export function BettingModal({ open, onClose, match }: BettingModalProps) {
  const [stake, setStake] = useState("");
  const { placeBetAsync, isPlacingBet } = useBetting();
  const { isLoggedIn } = useAuth();

  const validateNumericInput = (value: string): number | null => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 ? num : null;
  };

  const potentialWin = useMemo(() => {
    const stakeNum = validateNumericInput(stake);
    const oddsNum = validateNumericInput(match.odds);
    return stakeNum && oddsNum ? (stakeNum * oddsNum).toFixed(2) : "0.00";
  }, [stake, match.odds]);

  const handlePlaceBet = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to place bets");
      onClose();
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }

    if (!match.marketData) return;

    const stakeAmount = validateNumericInput(stake);
    const oddsAmount = validateNumericInput(match.odds);

    if (!stakeAmount || !oddsAmount) {
      console.error("Invalid stake or odds values");
      return;
    }

    try {
      // Extract runner name from market string (format: "RunnerName - type")
      const runnerName = match.market.split(" - ")[0] || undefined;
      // Market name is stored in teams field
      const marketName = match.teams || undefined;

      await placeBetAsync({
        matchId: match.marketData.matchId,
        marketId: match.marketData.marketId || "default-market",
        selectionId: match.marketData.selectionId,
        marketName: match.marketData.marketName || marketName,
        runnerName: match.marketData.runnerName || runnerName,
        odds: oddsAmount,
        stake: stakeAmount,
        type: match.marketData.type as "back" | "lay",
      });

      onClose();
      setStake("");
    } catch (error) {
      console.error("Bet placement failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-casino-dark border-casino-primary/30 text-casino-primary-text max-w-md">
        <DialogHeader>
          <DialogTitle className="text-casino-primary-text">
            Place Bet
          </DialogTitle>
          <DialogDescription className="text-casino-secondary-text">
            Enter your stake amount to place this bet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-casino-darker p-3 rounded-lg">
            <h3 className="font-medium text-casino-primary-text text-sm">
              {match.teams}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {match.market}
              </Badge>
              <span className="text-casino-accent font-bold">
                @{match.odds}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="stake" className="text-casino-secondary-text">
              Stake Amount
            </Label>
            <Input
              id="stake"
              type="number"
              placeholder="0.00"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="bg-casino-darker border-casino-primary/30 text-casino-primary-text mt-1"
            />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {["10", "25", "50", "100", "250", "500", "1000", "2500"].map(
                (amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setStake(amount)}
                    className="text-xs bg-casino-primary/10 border-casino-primary/30 text-casino-secondary-text hover:bg-casino-primary/20 hover:text-casino-primary-text"
                  >
                    ${amount}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="bg-casino-darker p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-casino-secondary-text">Potential Win:</span>
              <span className="text-casino-accent font-bold">
                ${potentialWin}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-casino-primary/30 text-casino-secondary-text hover:bg-casino-primary/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBet}
              disabled={!validateNumericInput(stake) || isPlacingBet}
              isLoading={isPlacingBet}
              className="flex-1 bg-casino-primary hover:bg-casino-primary-dark text-casino-inverse"
            >
              {isPlacingBet ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              {isPlacingBet ? "Placing..." : "Place Bet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
