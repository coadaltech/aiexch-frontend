"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useMyBets } from "@/hooks/useBetting";

export function BetSlip() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: currentBetsData } = useMyBets("all");
  const currentBets = (currentBetsData?.data || []).filter(
    (bet: any) => bet.status === "pending" || bet.status === "matched"
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-slate-100/40 dark:bg-slate-900/50 text-center shadow-inner">
      <div className="text-4xl mb-3 animate-bounce text-teal-500">🎯</div>
      <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-1">{message}</p>
      <span className="text-xs text-gray-400">All your active or matched bets will show up here.</span>
    </div>
  );

  const CurrentBetsContent = () =>
    currentBets.length === 0 ? (
      <EmptyState message="No bet found" />
    ) : (
      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border scrollbar-hide">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0C1529] text-white font-bold">
              <th className="text-left py-2.5 px-3">Matched Bet</th>
              <th className="text-center py-2.5 px-3">Odds</th>
              <th className="text-right py-2.5 px-3">Stake</th>
            </tr>
          </thead>
          <tbody>
            {currentBets.map((bet: any) => (
              <CurrentBetTableRow key={bet.id} bet={bet} />
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <>
      {/* Mobile: Button to open Current bets modal */}
      <div className="lg:hidden">
        <Button
          className="fixed bottom-20 right-4 z-50 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full w-14 h-14 shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Current bets"
        >
          <div className="text-center">
            <div className="text-xs font-bold">{currentBets.length}</div>
            <div className="text-[10px]">Bets</div>
          </div>
        </Button>

        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <Card
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 p-4 max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-foreground font-semibold">Current bets</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 pt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <CurrentBetsContent />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Desktop: Right Panel - Current (placed) bets only */}
      <div className="hidden lg:block h-full w-full z-40">
        <div className="h-full flex flex-col">
          {/* <Card className="h-full flex flex-col overflow-hidden"> */}
          {/*   <div className="flex-shrink-0 px-4 pb-3 border-b border-border"> */}
          {/*     <h3 className="text-foreground font-semibold text-sm"> */}
          {/*       Current bets */}
          {/*     </h3> */}
          {/*   </div> */}
          {/*   <div className=" flex-1 flex flex-col min-h-0 overflow-hidden"> */}
          {/*     <CurrentBetsContent /> */}
          {/*   </div> */}
          <div className=" flex-1 flex flex-col min-h-0 overflow-hidden">
            <CurrentBetsContent />
          </div>
          {/* </Card> */}
        </div>
      </div>
    </>
  );
}

/** Table row for current (placed) bets: Matched Bet (left), Odds (center), Stake (right); Back = green, Lay = maroon */
function CurrentBetTableRow({ bet }: { bet: any }) {
  const matchedBetLabel =
    bet.selectionName && bet.marketName
      ? `${bet.selectionName} - ${bet.marketName}`
      : bet.selectionName || bet.marketName || "Bet";
  const stakeFormatted =
    bet.stake != null ? Number(bet.stake).toFixed(2) : "-";
  const oddsFormatted = bet.odds != null ? String(Number(bet.odds)) : "-";
  const isLay = bet.betType === 1 || bet.betType === "lay";
  const rowBg = isLay
    ? "bg-[#39111A]/40 text-foreground"
    : "bg-green-900/40 text-foreground";

  return (
    <tr className={rowBg + " border-b border-black"} >
      <td className="py-2 px-3 text-left text-xs">{matchedBetLabel}</td>
      <td className="py-2 px-3 text-center text-sm">{oddsFormatted}</td>
      <td className="py-2 px-3 text-right text-sm">{stakeFormatted}</td>
    </tr>
  );
}
