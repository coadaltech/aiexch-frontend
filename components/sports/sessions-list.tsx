import { Lock, Volleyball, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionsListProps } from "./types";

function formatSize(size: number): string {
  if (size >= 1_000_000) return Math.floor(size / 1_000_000) + "M";
  if (size >= 1_000) return Math.floor(size / 1_000) + "K";
  return Math.floor(size).toString();
}

export function SessionsList({
  sessions,
  title,
  isLoading,
  collapsible = true,
}: SessionsListProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isCollapsible = collapsible && Boolean(title);
  const contentVisible = isCollapsible ? isOpen : true;
  const { addToBetSlip } = useBetSlip();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24 bg-muted/20" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-12 bg-muted/20" />
              <Skeleton className="h-6 w-12 bg-muted/20" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-card/40 backdrop-blur-2xl border border-border rounded-md p-2"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32 bg-muted/20" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-12 bg-muted/20" />
                  <Skeleton className="h-10 w-12 bg-muted/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="space-y-2">
      {(title || isCollapsible) && (
        <div
          className={`bg-card/40 backdrop-blur-2xl border border-border rounded-md p-2 ${
            isCollapsible
              ? "cursor-pointer hover:bg-card/60 transition-colors"
              : ""
          }`}
          onClick={isCollapsible ? () => setIsOpen(!isOpen) : undefined}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-1 sm:mb-0">
              <h1 className="text-primary text-sm font-bold">
                {title || "Sessions"}
              </h1>
              {isCollapsible &&
                (isOpen ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-chart-2 text-white text-xs font-medium px-2 py-1 rounded min-w-[50px] text-center">
                No
              </div>
              <div className="bg-chart-3 text-white text-xs font-medium px-2 py-1 rounded min-w-[50px] text-center">
                Yes
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions */}
      {contentVisible &&
        sessions.map((session, idx) => {
          const canTrade = ["ACTIVE", ""].includes(session.GameStatus);
          const isRunning = session.GameStatus === "Ball Running";

          return (
            <div
              key={idx}
              className="relative bg-card/40 backdrop-blur-2xl border border-border rounded-md p-2 flex flex-col gap-1 overflow-hidden"
            >
              {/* Ball Running Overlay */}
              {isRunning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <Volleyball className="text-primary animate-bounce" />
                  <span className="ml-2 text-foreground font-semibold">
                    Ball Running...
                  </span>
                </div>
              )}

              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isRunning ? "opacity-60" : ""
                }`}
              >
                {/* Runner Name */}
                <h3 className="text-foreground flex-1 font-bold text-sm">
                  {session.RunnerName}
                </h3>

                {/* Min/Max */}
                <div className="text-xs text-muted-foreground flex gap-2 items-center">
                  <span>Min: {session.min}</span>
                  <span>Max: {session.max}</span>
                </div>

                {/* Back / Lay Buttons */}
                <div className="flex gap-2 flex-shrink-0 overflow-x-auto relative">
                  {/* Lay */}
                  <div
                    className={`text-white text-xs px-2 py-1.5 rounded text-center min-w-[50px] h-[38px] flex flex-col items-center justify-center transition ${
                      canTrade
                        ? "bg-chart-2 cursor-pointer hover:bg-chart-2/80"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      canTrade &&
                      addToBetSlip({
                        id: Date.now() + idx + 1000,
                        teams: session.RunnerName,
                        market: `${session.RunnerName} - Lay`,
                        odds: session.LayPrice1.toString(),
                        stake: "100",
                        potentialWin: (100 * session.LayPrice1).toFixed(2),
                        matchId: "1001",
                        marketId: session.gtype,
                        selectionId: session.SelectionId,
                      })
                    }
                  >
                    {canTrade ? (
                      <div className="text-[11px] font-bold flex flex-col">
                        <p>{session.LayPrice1}</p>
                        <p className="text-[9px]">
                          ({formatSize(session.LaySize1)})
                        </p>
                      </div>
                    ) : (
                      <Lock size={16} />
                    )}
                  </div>

                  {/* Back */}
                  <div
                    className={`text-white text-xs px-2 py-1.5 rounded text-center min-w-[50px] h-[38px] flex flex-col items-center justify-center transition ${
                      canTrade
                        ? "bg-chart-3 cursor-pointer hover:bg-chart-3/80"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      canTrade &&
                      addToBetSlip({
                        id: Date.now() + idx,
                        teams: session.RunnerName,
                        market: `${session.RunnerName} - Back`,
                        odds: session.BackPrice1.toString(),
                        stake: "100",
                        potentialWin: (100 * session.BackPrice1).toFixed(2),
                        matchId: "1001",
                        marketId: session.gtype,
                        selectionId: session.SelectionId,
                      })
                    }
                  >
                    {canTrade ? (
                      <div className="text-[11px] font-bold flex flex-col">
                        <p>{session.BackPrice1}</p>
                        <p className="text-[9px]">
                          ({formatSize(session.BackSize1)})
                        </p>
                      </div>
                    ) : (
                      <Lock size={16} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
