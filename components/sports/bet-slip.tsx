"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useMyBets } from "@/hooks/useBetting";

export function BetSlip({ matchId }: { matchId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"match" | "all">("match");
  const { data: currentBetsData } = useMyBets("all");

  const allBets = (currentBetsData?.data || []).filter(
    (bet: any) => bet.status === "pending" || bet.status === "matched"
  );

  const matchBets = allBets.filter(
    (bet: any) => String(bet.matchId) === String(matchId)
  );

  const displayedBets = activeTab === "match" ? matchBets : allBets;

  const TabBar = () => (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-2 flex-shrink-0">
      <button
        onClick={() => setActiveTab("match")}
        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer ${
          activeTab === "match"
            ? "bg-[#174b73] text-white shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        This Match ({matchBets.length})
      </button>
      <button
        onClick={() => setActiveTab("all")}
        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer ${
          activeTab === "all"
            ? "bg-[#174b73] text-white shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        All Bets ({allBets.length})
      </button>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 rounded-xl border border-gray-200 bg-gray-50 text-center shadow-inner">
      <div className="text-4xl mb-3 animate-bounce text-matka-ring">🎯</div>
      <p className="text-base font-medium text-gray-600 mb-1">{message}</p>
      <span className="text-xs text-gray-400">
        {activeTab === "match"
          ? "Bets placed on this match will show up here."
          : "All your active or matched bets will show up here."}
      </span>
    </div>
  );

  const BetsTable = () =>
    displayedBets.length === 0 ? (
      <EmptyState message="No bet found" />
    ) : (
      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 scrollbar-hide">
        <table className="w-full text-sm border-collapse table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#174b73] text-white font-bold">
              <th className="text-left py-2 px-2 w-auto">Matched Bet</th>
              <th className="text-center py-2 px-1 w-14">Odds</th>
              <th className="text-right py-2 px-2 w-16">Stake</th>
            </tr>
          </thead>
          <tbody>
            {displayedBets.map((bet: any) => (
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
            <div className="text-xs font-bold">{matchBets.length}</div>
            <div className="text-[10px]">Bets</div>
          </div>
        </Button>

        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <Card
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 p-4 max-h-[80vh] overflow-hidden flex flex-col bg-white border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="text-gray-800 font-semibold">Current bets</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <TabBar />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <BetsTable />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Desktop: Right Panel */}
      <div className="hidden lg:block h-full w-full z-40 p-2">
        <div className="h-full flex flex-col">
          <TabBar />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <BetsTable />
          </div>
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
    ? "bg-pink-300 text-gray-800"
    : "bg-blue-300 text-gray-800";

  return (
    <tr className={rowBg + " border-b border-gray-200"} >
      <td className="py-2 px-2 text-left text-xs truncate max-w-0" title={matchedBetLabel}>{matchedBetLabel}</td>
      <td className="py-2 px-1 text-center text-xs font-medium">{oddsFormatted}</td>
      <td className="py-2 px-2 text-right text-xs font-medium">{stakeFormatted}</td>
    </tr>
  );
}
