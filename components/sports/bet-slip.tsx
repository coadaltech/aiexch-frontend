"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { X, Minus, Plus } from "lucide-react";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useBetting, useMyBets } from "@/hooks/useBetting";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function BetSlip() {
  const [isOpen, setIsOpen] = useState(false);
  const { bets, removeBet, updateStake, clearBets } = useBetSlip();
  const { placeBet, isPlacingBet } = useBetting();
  const { isLoggedIn, user } = useAuth();
  const { data: currentBetsData } = useMyBets("all");
  const currentBets = (currentBetsData?.data || []).filter(
    (bet: any) => bet.status === "pending" || bet.status === "matched"
  );

  const handlePlaceAllBets = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to place bets");
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }

    const userBalance = parseFloat(user?.balance || "0");
    if (userBalance < totalStake) {
      toast.error(`Insufficient balance. You have ₹${userBalance.toFixed(2)} but need ₹${totalStake.toFixed(2)}`);
      return;
    }

    try {
      toast.loading("Placing bets...", { id: "placing-bets" });

      for (const bet of bets) {
        const [runnerNameFromMarket, type] = bet.market.split(" - ");
        // Use explicit marketName/runnerName if available, otherwise extract from existing fields
        const marketName = bet.marketName || bet.teams;
        const runnerName = bet.runnerName || runnerNameFromMarket;

        await placeBet({
          matchId: bet.matchId || "1001",
          marketId:
            bet.marketId ||
            marketName?.toLowerCase().replace(/\s+/g, "_") ||
            "default-market",
          selectionId: bet.selectionId || bet.id.toString(),
          marketName: marketName,
          runnerName: runnerName,
          odds: parseFloat(bet.odds),
          stake: parseFloat(bet.stake),
          type: type?.toLowerCase() === "lay" ? "lay" : "back",
        });
      }

      toast.success(
        `${bets.length} bet(s) placed successfully! Balance updated.`,
        { id: "placing-bets" }
      );
      clearBets();
    } catch (error) {
      toast.error("Failed to place bets. Please try again.", {
        id: "placing-bets",
      });
    }
  };

  const totalStake = bets.reduce((sum, bet) => sum + parseFloat(bet.stake || "0"), 0);
  const totalWin = bets.reduce(
    (sum, bet) => sum + parseFloat(bet.potentialWin || "0"),
    0
  );
  const userBalance = parseFloat(user?.balance || "0");
  const hasInsufficientBalance = isLoggedIn && userBalance < totalStake;

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8">
      <div className="text-slate-400 mb-2">🎯</div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  return (
    <>
      {/* Mobile: Floating Button */}
      {bets.length > 0 && (
        <div className="lg:hidden">
          <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
            <Button
              className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-full w-14 h-14 shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              <div className="text-center">
                <div className="text-xs font-bold">{bets.length}</div>
                <div className="text-[10px]">Bets</div>
              </div>
            </Button>
            <Button
              variant="destructive"
              className="rounded-full w-8 h-8 shadow-lg self-end"
              onClick={clearBets}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Popup Modal */}
          {isOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
              <Card className="fixed inset-x-4 top-1/2 -translate-y-1/2 p-4 max-h-[80vh] overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-foreground font-semibold">
                    Bet Slip ({bets.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {bets.map((bet) => (
                    <BetItem
                      key={bet.id}
                      bet={bet}
                      onUpdateStake={updateStake}
                      onRemove={removeBet}
                    />
                  ))}

                  <BetSummary totalStake={totalStake} totalWin={totalWin} />

                  {hasInsufficientBalance && (
                    <div className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded">
                      Insufficient balance: ₹{userBalance.toFixed(2)} / ₹{totalStake.toFixed(2)}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handlePlaceAllBets}
                    disabled={isPlacingBet || bets.length === 0 || hasInsufficientBalance}
                  >
                    {isPlacingBet ? "Placing..." : "Place Bet"}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Desktop: Right Panel */}
      <div className="hidden lg:block w-full">
        <Tabs defaultValue="betslip" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="betslip" className="text-xs">
              Bet Slip ({bets.length})
            </TabsTrigger>
            <TabsTrigger value="current" className="text-xs">
              Current ({currentBets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="betslip" className="mt-4">
            <Card className="p-4">
              {bets.length === 0 ? (
                <EmptyState message="No selections yet" />
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  {bets.map((bet) => (
                    <BetItem
                      key={bet.id}
                      bet={bet}
                      onUpdateStake={updateStake}
                      onRemove={removeBet}
                    />
                  ))}
                  <BetSummary totalStake={totalStake} totalWin={totalWin} />
                  {hasInsufficientBalance && (
                    <div className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded">
                      Insufficient balance: ₹{userBalance.toFixed(2)} / ₹{totalStake.toFixed(2)}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handlePlaceAllBets}
                    disabled={isPlacingBet || bets.length === 0 || hasInsufficientBalance}
                  >
                    {isPlacingBet ? "Placing..." : "Place All Bets"}
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="current" className="mt-4">
            <Card className="p-4">
              {currentBets.length === 0 ? (
                <EmptyState message="No current bets" />
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  {currentBets.map((bet: any) => (
                    <CurrentBetItem key={bet.id} bet={bet} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function BetItem({
  bet,
  onUpdateStake,
  onRemove,
}: {
  bet: any;
  onUpdateStake: (id: number, stake: string) => void;
  onRemove: (id: number) => void;
}) {
  const [stake, setStake] = useState(bet.stake);

  const handleStakeChange = (newStake: string) => {
    setStake(newStake);
    onUpdateStake(bet.id, newStake);
  };

  return (
    <Card className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <Badge
            variant="secondary"
            className="text-xs mt-1 truncate max-w-full"
          >
            {bet.market}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 shrink-0"
          onClick={() => onRemove(bet.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex justify-between items-center text-xs mb-2">
        <span className="text-foreground">Odds: {bet.odds}</span>
        <span className="text-primary">Win: ₹{bet.potentialWin}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() =>
              handleStakeChange(Math.max(0, parseFloat(stake) - 10).toString())
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={stake}
            onChange={(e) => handleStakeChange(e.target.value)}
            className="h-6 text-xs text-center"
            placeholder="Stake"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() =>
              handleStakeChange((parseFloat(stake) + 10).toString())
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              className="text-xs h-6 font-bold"
              onClick={() => handleStakeChange(amount.toString())}
            >
              ₹{amount}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function BetSummary({
  totalStake,
  totalWin,
}: {
  totalStake: number;
  totalWin: number;
}) {
  return (
    <Card className="p-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">Total Stake:</span>
        <span className="text-foreground">₹{totalStake}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Total Win:</span>
        <span className="text-primary font-bold">₹{totalWin.toFixed(2)}</span>
      </div>
    </Card>
  );
}

function CurrentBetItem({ bet }: { bet: any }) {
  const getStatusBadge = (status: string) => {
    if (status === "matched") {
      return (
        <Badge
          variant="secondary"
          className="bg-chart-4/20 text-chart-4 border-chart-4/30 text-xs animate-pulse"
        >
          🔴 Live
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-accent/20 text-accent-foreground border-accent/30 text-xs"
      >
        Pending
      </Badge>
    );
  };

  return (
    <Card className="p-3">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1">
          <h4 className="text-foreground text-xs font-medium">
            Cricket - {bet.type}
          </h4>
          <Badge variant="secondary" className="text-xs mt-1">
            #{bet.id}
          </Badge>
        </div>
        <div className="flex-shrink-0">{getStatusBadge(bet.status)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Stake:</span>
          <span className="text-foreground ml-1">₹{Number(bet.stake)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Odds:</span>
          <span className="text-foreground ml-1">{Number(bet.odds)}</span>
        </div>
      </div>
    </Card>
  );
}
