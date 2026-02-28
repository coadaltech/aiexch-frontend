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
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBetting } from "@/hooks/useBetting";
import { BettingModalProps } from "./types";

export function BettingModal({ open, onClose, match }: BettingModalProps) {
  const [stake, setStake] = useState("");
  const { placeBetAsync, isPlacingBet } = useBetting();

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
    if (!match.marketData) return;

    const stakeAmount = validateNumericInput(stake);
    const oddsAmount = validateNumericInput(match.odds);

    if (!stakeAmount || !oddsAmount) {
      console.error("Invalid stake or odds values");
      return;
    }

    try {
      // Market name fallback from teams field
      const marketName = match.marketData.marketName || match.teams || undefined;
      // Selection name fallback from market string (format: "RunnerName - type")
      const selectionName =
        match.marketData.selectionName ||
        match.market.split(" - ")[0] ||
        undefined;

      // Build runners array — use provided runners or fall back to a single-runner placeholder
      const runners = match.marketData.runners && match.marketData.runners.length >= 2
        ? match.marketData.runners
        : [{ id: match.marketData.selectionId, name: selectionName || "", price: oddsAmount }];

      await placeBetAsync({
        matchId: match.marketData.matchId,
        marketId: match.marketData.marketId || "default-market",
        eventTypeId: match.marketData.eventTypeId?.toString() || "4",
        marketType: match.marketData.marketType || "odds",
        selectionId: match.marketData.selectionId,
        selectionName,
        marketName,
        odds: oddsAmount,
        stake: stakeAmount,
        type: match.marketData.type as "back" | "lay",
        runners,
      });

      toast.success("Bet placed.");
      onClose();
      setStake("");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : "Failed to place bet");
      toast.error(message);
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
