"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useMyBets } from "@/hooks/useBetting";

export function BetSlip({ matchId, allBetsOnly = false }: { matchId: string; allBetsOnly?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"match" | "all">(allBetsOnly ? "all" : "match");
  const [averageBets, setAverageBets] = useState(false);
  const { data: currentBetsData } = useMyBets("all");

  const allBets = (currentBetsData?.data || []).filter(
    (bet: any) => bet.status === "pending" || bet.status === "matched"
  );

  const matchBets = allBets.filter(
    (bet: any) => String(bet.matchId) === String(matchId)
  );

  const baseBets = activeTab === "match" ? matchBets : allBets;
  // When "Average Bets" is on, fold bets on the SAME runner + SAME type
  // (back/lay) into one row: stake is summed and the price is the
  // stake-weighted average. Deleted bets are never folded (kept individual).
  const displayedBets = averageBets ? combineBets(baseBets) : baseBets;

  const AverageToggle = () => (
    <div className="flex items-center justify-end gap-2 mb-2 flex-shrink-0">
      <span className="text-sm font-semibold text-gray-600">Average Bets?</span>
      <button
        type="button"
        role="switch"
        aria-checked={averageBets}
        onClick={() => setAverageBets((v) => !v)}
        className={`relative inline-flex h-6 w-14 items-center rounded-full transition-colors ${
          averageBets ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute text-[10px] font-bold text-white ${
            averageBets ? "left-1.5" : "right-1.5"
          }`}
        >
          {averageBets ? "ON" : "OFF"}
        </span>
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            averageBets ? "translate-x-8" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  const TabBar = () => {
    if (allBetsOnly) {
      return (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-2 flex-shrink-0">
          <div className="flex-1 text-base font-bold py-2 rounded-md bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] shadow-sm text-center">
            All Bets ({allBets.length})
          </div>
        </div>
      );
    }
    return (
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab("match")}
          className={`flex-1 text-base font-bold py-2 rounded-md transition-all cursor-pointer ${
            activeTab === "match"
              ? "bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          This Match ({matchBets.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 text-base font-bold py-2 rounded-md transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          All Bets ({allBets.length})
        </button>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 rounded-xl border border-gray-200 bg-[#efefef] text-center shadow-inner">
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
        <table className="w-full text-base border-collapse table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] font-bold">
              <th className="text-left py-2.5 px-3 w-auto text-base">Matched Bet</th>
              <th className={`text-center py-2.5 px-1 text-base whitespace-nowrap ${averageBets ? "w-24" : "w-16"}`}>{averageBets ? "Avg Price" : "Odds"}</th>
              <th className="text-right py-2.5 px-3 w-20 text-base">Stake</th>
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
              <AverageToggle />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <BetsTable />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Desktop: Right Panel */}
      <div className="hidden bg-[#efefef] lg:block h-full w-full z-40 p-2">
        <div className="h-full flex flex-col">
          <TabBar />
          <AverageToggle />
          <div className="flex-1 z flex flex-col min-h-0 overflow-hidden">
            <BetsTable />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Fold bets on the SAME runner + SAME bet type (back/lay) within the same
 * market into a single row: stake is summed and the price is the
 * stake-weighted average (sum(price*stake)/sum(stake)). Deleted bets are left
 * as individual rows so their delete reason stays visible.
 */
function combineBets(bets: any[]): any[] {
  const groups = new Map<string, any>();
  const passthrough: any[] = [];

  for (const bet of bets) {
    const isDeleted = bet.isDeleted === true || bet.recordStatus === 1;
    if (isDeleted) {
      passthrough.push(bet);
      continue;
    }
    const key = `${bet.marketId ?? bet.marketName ?? ""}|${bet.selectionName ?? ""}|${bet.betType}`;
    const stake = Number(bet.stake) || 0;
    const price = Number(bet.odds) || 0;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...bet, _stakeSum: stake, _weighted: price * stake, _count: 1 });
    } else {
      existing._stakeSum += stake;
      existing._weighted += price * stake;
      existing._count += 1;
    }
  }

  const combined = [...groups.values()].map((g) => ({
    ...g,
    id: `avg-${g.marketId ?? g.marketName}-${g.selectionName ?? ""}-${g.betType}`,
    stake: g._stakeSum,
    // Stake-weighted average price; falls back to the raw odds for a single bet.
    odds: g._stakeSum > 0 ? g._weighted / g._stakeSum : g.odds,
  }));

  return [...combined, ...passthrough];
}

/** Table row for current (placed) bets: Matched Bet (left), Odds (center), Stake (right); Back = green, Lay = maroon */
function CurrentBetTableRow({ bet }: { bet: any }) {
  const isFancy = bet.marketType === "fancy";
  const capDecimals = (num: number) => {
    if (!Number.isFinite(num)) return "-";
    // Round to 2 decimals max, then re-parse so an integer like 29 prints as
    // "29" instead of "29.00" / "29.0000". Trailing zeros showed up on
    // bookmaker prices because `Number(0.29) * 100` returns 29.000000000004
    // — float drift the old `decimals > 4` check captured and pinned at 4dp.
    return String(Number(num.toFixed(2)));
  };
  // Match the on-page (Indian) format the user clicked. Match-odds families
  // are stored in the same decimal form they're displayed in (e.g. 1.78), so
  // pass-through. Bookmaker prices get divided by 100 at place-time
  // (see toDecimalOdds), so multiply back by 100 here to recover the page
  // value (78). Fancy already shows the line/run, not the price.
  const isBookmaker = bet.marketType === "bookmaker";
  const oddsFormatted =
    bet.odds == null
      ? "-"
      : capDecimals(isBookmaker ? Number(bet.odds) * 100 : Number(bet.odds));
  const matchedBetLabel = isFancy
    ? `${bet.marketName || bet.selectionName || "Bet"} / ${capDecimals(Number(bet.odds) * 100)}`
    : bet.selectionName && bet.marketName
      ? `${bet.selectionName} - ${bet.marketName}`
      : bet.selectionName || bet.marketName || "Bet";
  const stakeFormatted =
    bet.stake != null ? Number(bet.stake).toFixed(2) : "-";
  const userDetail = isFancy ? (bet.details || []).find((d: any) => d.isUserSelection) || (bet.details || [])[0] : null;
  const lineFormatted = userDetail?.run != null ? capDecimals(Number(userDetail.run)) : "-";
  const isLay = bet.betType === 1 || bet.betType === "lay";

  // Soft-deleted (reverted via Transaction Management): show muted/struck row
  // with the owner's reason so the user knows why the bet no longer counts.
  const isDeleted = bet.isDeleted === true || bet.recordStatus === 1;
  const deleteRemark =
    bet.deleteRemark ||
    (bet.details || []).find((d: any) => d.remark)?.remark ||
    "This bet was deleted";

  const rowBg = isDeleted
    ? "bg-gray-200 text-gray-500"
    : isLay
      ? "bg-pink-300 text-gray-800"
      : "bg-blue-300 text-gray-800";

  return (
    <tr className={rowBg + " border-b border-gray-200"} >
      <td className="py-2 px-2 text-left text-sm truncate max-w-0" title={isDeleted ? `Deleted: ${deleteRemark}` : matchedBetLabel}>
        <span className={isDeleted ? "line-through" : ""}>{matchedBetLabel}</span>
        {isDeleted && (
          <span className="ml-1.5 inline-block align-middle rounded bg-red-600 px-1 py-0.5 text-[9px] font-bold text-white no-underline">
            DELETED
          </span>
        )}
        {isDeleted && (
          <span className="block text-[10px] italic text-red-600 truncate no-underline" title={deleteRemark}>
            {deleteRemark}
          </span>
        )}
      </td>
      <td className={"py-2 px-1 text-center text-sm font-medium whitespace-nowrap" + (isDeleted ? " line-through" : "")}>{isFancy ? lineFormatted : oddsFormatted}</td>
      <td className={"py-2 px-2 text-right text-sm font-medium" + (isDeleted ? " line-through" : "")}>{stakeFormatted}</td>
    </tr>
  );
}
