import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { formatSize } from "@/lib/format-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumFancyData, PremiumFancyListProps } from "./types";

export function PremiumFancyList({
  premiumFancy,
  title,
  isLoading,
  collapsible = true,
}: PremiumFancyListProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isCollapsible = collapsible && Boolean(title);
  const contentVisible = isCollapsible ? isOpen : true;
  const { addToBetSlip } = useBetSlip();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {title && (
          <div className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-4 mb-4">
            <Skeleton className="h-6 w-32 bg-muted/20" />
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-3 lg:p-4"
            >
              <Skeleton className="h-5 w-40 mb-3 bg-muted/20" />
              <div className="flex justify-between items-center p-2 bg-card/30 rounded">
                <Skeleton className="h-4 w-24 bg-muted/20" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 bg-muted/20" />
                  <Skeleton className="h-8 w-16 bg-muted/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const parsedData = premiumFancy
    .map((dataStr) => {
      try {
        return JSON.parse(dataStr) as PremiumFancyData;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as PremiumFancyData[];

  const fancyData = parsedData
    .filter((item) => item.gtype === "fancy1" || item.gtype === "oddeven")
    .sort((a, b) => a.SelectionId.localeCompare(b.SelectionId));

  return (
    <div className="space-y-4">
      {title && (
        <div
          className={`bg-card/40 backdrop-blur-2xl border border-border rounded-md p-4 mb-4 ${
            isCollapsible ? "cursor-pointer hover:bg-card/60 transition-colors" : ""
          }`}
          onClick={isCollapsible ? () => setIsOpen(!isOpen) : undefined}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-primary text-xl font-bold">{title}</h2>
            {isCollapsible &&
              (isOpen ? (
                <ChevronUp className="h-5 w-5 text-primary" />
              ) : (
                <ChevronDown className="h-5 w-5 text-primary" />
              ))}
          </div>
        </div>
      )}
      {contentVisible &&
        fancyData.map((fancy, idx) => (
          <div
            key={idx}
            className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-3 lg:p-4"
          >
            <h3 className="text-primary font-medium text-base mb-3">
              {fancy.RunnerName}
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-card/30 rounded">
              <div className="text-foreground text-sm">
                <div className="text-xs text-muted-foreground capitalize">
                  Type: {fancy.gtype}
                </div>
              </div>

              <div className="flex gap-1 lg:gap-2 overflow-x-auto">
                <div className="flex items-center gap-1">
                  <div
                    className={`text-white text-xs px-2 py-1 rounded flex items-center justify-center text-center min-w-[50px] ${
                      fancy.GameStatus === "ACTIVE"
                        ? "bg-chart-3 cursor-pointer hover:bg-chart-3/80"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      fancy.GameStatus === "ACTIVE" &&
                      addToBetSlip({
                        id: Date.now() + idx,
                        teams: fancy.RunnerName,
                        market: `${fancy.RunnerName} - Back`,
                        odds: fancy.BackPrice1.toString(),
                        stake: "100",
                        potentialWin: (100 * fancy.BackPrice1).toFixed(2),
                        matchId: "1001",
                        marketId: fancy.gtype,
                        selectionId: fancy.SelectionId,
                      })
                    }
                  >
                    {fancy.GameStatus !== "ACTIVE" ? (
                      <Lock size={16} />
                    ) : (
                      <div className="text-[12px] font-bold flex-col opacity-80">
                        <p>{fancy.BackPrice1}</p>
                        <p>({formatSize(fancy.BackSize1)})</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gap between Back and Lay */}
                <div className="w-2" />

                <div className="flex items-center gap-1">
                  <div
                    className={`text-white text-xs px-2 py-1 flex items-center justify-center rounded text-center min-w-[50px] ${
                      fancy.GameStatus === "ACTIVE"
                        ? "bg-chart-2 cursor-pointer hover:bg-chart-2/80"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      fancy.GameStatus === "ACTIVE" &&
                      addToBetSlip({
                        id: Date.now() + idx + 1000,
                        teams: fancy.RunnerName,
                        market: `${fancy.RunnerName} - Lay`,
                        odds: fancy.LayPrice1.toString(),
                        stake: "100",
                        potentialWin: (100 * fancy.LayPrice1).toFixed(2),
                        matchId: "1001",
                        marketId: fancy.gtype,
                        selectionId: fancy.SelectionId,
                      })
                    }
                  >
                    {fancy.GameStatus !== "ACTIVE" ? (
                      <Lock size={16} />
                    ) : (
                      <div className="text-[12px] font-bold flex-col opacity-80">
                        <p>{fancy.LayPrice1}</p>
                        <p>({formatSize(fancy.LaySize1)})</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
