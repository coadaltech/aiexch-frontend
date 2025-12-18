"use client";
import { useState } from "react";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { formatToIST } from "@/lib/date-utils";
import { formatSize } from "@/lib/format-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketListProps } from "./types";

export function MarketList({
  markets,
  title,
  isLoading,
  showLay = true,
  showDraw = true,
  collapsible = true,
}: MarketListProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isCollapsible = collapsible && Boolean(title);
  const contentVisible = isCollapsible ? isOpen : true;
  const { addToBetSlip } = useBetSlip();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {title && (
          <div className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-4 mb-4">
            <Skeleton className="h-6 w-32" />
          </div>
        )}
        <div className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-3 lg:p-4">
          <Skeleton className="h-5 w-48 mb-3" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 bg-muted/30 rounded"
              >
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  {showLay && <Skeleton className="h-8 w-16" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!markets || markets.length === 0) return null;

  return (
    <div className="space-y-2">
      {title && isCollapsible && (
        <div
          className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-2 cursor-pointer hover:bg-card/60 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-primary text-sm font-bold">{title}</h2>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>
      )}
      {title && !isCollapsible && (
        <div className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-2">
          <h2 className="text-primary text-sm font-bold">{title}</h2>
        </div>
      )}

      {contentVisible &&
        markets.map((market, idx) =>
          !market.odds ? null : (
            <div
              key={idx}
              className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-2"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-primary font-medium text-sm">
                  {market.marketName}
                </h3>
                {market.marketStartTime && (
                  <span className="text-muted-foreground text-xs">
                    {formatToIST(market.marketStartTime)}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {renderRunners({ market, showDraw, showLay, addToBetSlip })}
              </div>
            </div>
          )
        )}
    </div>
  );
}

function renderRunners({
  market,
  showDraw,
  showLay,
  addToBetSlip,
}: {
  market: MarketListProps["markets"][number];
  showDraw: boolean;
  showLay: boolean;
  addToBetSlip: ReturnType<typeof useBetSlip>["addToBetSlip"];
}) {
  const sortedRunners = [...(market.runners || [])];
  const nonDrawRunners = sortedRunners.filter(
    (runner) => !runner.runnerName?.toLowerCase().includes("draw")
  );
  const runnersToDisplay = showDraw ? sortedRunners : nonDrawRunners;

  if (!runnersToDisplay.length) return null;

  return runnersToDisplay.map((runner, runnerIdx) => {
    const oddsRunner = market.odds?.runners?.find(
      (r) => r.selectionId.toString() === runner.selectionId.toString()
    );

    if (!oddsRunner) return null;

    const status = oddsRunner.status;
    const canTrade = status === "ACTIVE";

    return (
      <div
        key={runnerIdx}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-muted/30 rounded"
      >
        <span className="text-foreground text-xs font-medium">
          {runner.runnerName}
        </span>

        <div className="flex gap-1 lg:gap-2 overflow-x-auto">
          {["WINNER", "LOSER", "REMOVED"].includes(status) ? (
            <div className="flex items-center justify-center min-w-[100px] px-4 py-2 rounded">
              {status === "WINNER" && (
                <span className="text-green-500 text-sm font-bold">
                  🏆 WINNER
                </span>
              )}
              {status === "LOSER" && (
                <span className="text-red-500 text-sm font-bold">❌ LOSER</span>
              )}
              {status === "REMOVED" && (
                <span className="text-red-200 text-sm font-bold">REMOVED</span>
              )}
            </div>
          ) : (
            <>
              {renderOdds({
                type: "Back",
                prices: oddsRunner.back,
                canTrade,
                runner,
                market,
                addToBetSlip,
              })}
              {showLay &&
                renderOdds({
                  type: "Lay",
                  prices: oddsRunner.lay,
                  canTrade,
                  runner,
                  market,
                  addToBetSlip,
                })}
            </>
          )}
        </div>
      </div>
    );
  });
}

function renderOdds({
  type,
  prices,
  canTrade,
  runner,
  market,
  addToBetSlip,
}: {
  type: "Back" | "Lay";
  prices?: Array<{ price: number; size: number }>;
  canTrade: boolean;
  runner: any;
  market: any;
  addToBetSlip: ReturnType<typeof useBetSlip>["addToBetSlip"];
}) {
  if (!prices || prices.length === 0) return null;

  const label = (
    <div className="text-[10px] text-muted-foreground text-center min-w-[50px]">
      {type}
    </div>
  );

  const displayPrices = type === "Back" ? prices.slice(-3).reverse() : prices.slice(0, 3);

  return (
    <div className="flex flex-col gap-1">
      {label}
      <div className="flex gap-1">
        {displayPrices.map((pricePoint, idx) => {
          const isLocked = pricePoint.price === 0 || pricePoint.price <= 1.1;
          const isBack = type === "Back";
          const baseClasses = isBack
            ? "bg-chart-3 cursor-pointer hover:bg-chart-3/80"
            : "bg-chart-2 cursor-pointer hover:bg-chart-2/80";

          return (
            <div
              key={idx}
              className={`relative text-white text-xs px-2 py-1.5 rounded flex items-center justify-center text-center min-w-[50px] h-[38px] ${
                isLocked || !canTrade
                  ? "bg-muted cursor-not-allowed"
                  : baseClasses
              }`}
              onClick={() => {
                if (isLocked || !canTrade) return;
                addToBetSlip({
                  id: Date.now() + idx + (isBack ? 0 : 1000),
                  teams: market.marketName,
                  market: `${runner.runnerName} - ${type}`,
                  odds: pricePoint.price.toString(),
                  stake: "100",
                  potentialWin: (100 * pricePoint.price).toFixed(2),
                  matchId: "1001",
                  marketId: market.marketId,
                  selectionId: runner.selectionId,
                  marketName: market.marketName,
                  runnerName: runner.runnerName,
                });
              }}
            >
              {isLocked ? (
                <Lock size={16} />
              ) : (
                <div className="text-[11px] font-bold flex flex-col opacity-80">
                  <p>{pricePoint.price.toFixed(2)}</p>
                  <p className="text-[9px]">({formatSize(pricePoint.size)})</p>
                </div>
              )}
              {!canTrade && !isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
