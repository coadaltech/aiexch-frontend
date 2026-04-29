"use client";

// Shared quick-bet pieces — types, odds converters, and the inline stake
// panel. Used by both the single-match page (/sports/.../[matchId]) and the
// multimarket page (/multimarket), so the bet-placement UX stays identical
// across both.

import { useEffect, useRef } from "react";
import { DEFAULT_STAKES } from "@/hooks/useUserQueries";

export type RunnerSummary = {
  id: string;
  name: string;
  price: number;
};

export type QuickBetData = {
  marketId: string;
  bettingType: string;
  market: any;
  runner: any;
  allRunners: RunnerSummary[];
  eventName: string;
  odds: string;
  run?: string | null;
  isLay: boolean;
  priceIndex: number;
  // true for ADV markets — odds stored as raw, converted only at placement
  isRawOdds?: boolean;
  // Per-bet event context. On /sports/.../[matchId] these are the page's
  // useParams; on /multimarket they vary per pinned market.
  matchId?: string;
  seriesId?: string;
  eventTypeId?: string;
};

export function formatStakeLabel(value: number): string {
  if (value >= 10000000) return `${value / 10000000}Cr`;
  if (value >= 100000) return `${value / 100000}L`;
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
}

// Map bettingType → backend marketType enum
export function toBettingType(bettingType: string): string {
  switch (bettingType?.toUpperCase()) {
    case "BOOKMAKER": return "bookmaker";
    case "LINE": return "fancy";
    default: return "odds";
  }
}

// Convert price to international decimal odds.
// Values 10–99 are Indian format (e.g. 24, 24.5) → divide by 100 and add 1.
// Values >= 100 are Indian format (e.g. 150) → divide by 100 only.
// Values < 10 are already decimal odds (e.g. 1.50, 2.40) → pass through as-is.
// BETFAIR prices are already in decimal — skip conversion entirely.
// WINNING_ODDS are also already in decimal (Betfair-style) — skip conversion.
export function toDecimalOdds(price: number, provider?: string, marketType?: string): number {
  if (provider?.toUpperCase() === "BETFAIR") return price;
  if (marketType?.toUpperCase() === "WINNING_ODDS") return price;
  if (price < 100) return price / 100;
  if (price >= 100) return price / 100;
  return price;
}

export function toDecimalfancyOdds(price: number, provider?: string): number {
  if (provider?.toUpperCase() === "BETFAIR" && price < 10) return price;
  return price / 100;
}

export function QuickBetPanel({
  data,
  stake,
  onStakeChange,
  onClose,
  onPlaceBet,
  isLoading,
  betDelayRemaining,
  onCancelDelay,
  stakeButtons,
  currentOdds,
  currentRun,
}: {
  data: QuickBetData;
  stake: string;
  onStakeChange: (val: string) => void;
  onClose: () => void;
  onPlaceBet: (stake: string, odds: string) => void;
  isLoading?: boolean;
  betDelayRemaining?: number;
  onCancelDelay?: () => void;
  stakeButtons?: { label: string; value: number }[];
  currentOdds?: string;
  currentRun?: string;
}) {
  const { market, runner, odds } = data;
  // Fancy/LINE markets: keep the displayed odds frozen at click time. The
  // parent closes the panel when the live line changes, so showing updated
  // values here would be both flickery and pointless. Other markets continue
  // to update in real-time via currentOdds.
  const isLineMarket = data.bettingType === "LINE";
  const rawOdds = isLineMarket ? odds : (currentOdds ?? odds);
  void currentRun;
  const numOdds = parseFloat(rawOdds);
  const isBetfair = data.market?.provider?.toUpperCase() === "BETFAIR";
  const displayOdds =
    isLineMarket && data.run != null
      ? `${data.run} (${Math.round(isBetfair ? numOdds : numOdds * 100)})`
      : isNaN(numOdds)
        ? rawOdds
        : (() => {
            const str = String(numOdds);
            const decimals = str.includes(".") ? str.split(".")[1].length : 0;
            return decimals > 4 ? numOdds.toFixed(4) : str;
          })();
  const marketName = market?.marketName || "";
  const runnerName = runner?.name || "";

  const minBet = parseFloat(market?.marketCondition?.minBet) || 0;
  const maxBet = parseFloat(market?.marketCondition?.maxBet) || 0;
  const stakeNum = parseFloat(stake) || 0;

  const belowMin = stakeNum > 0 && minBet > 0 && stakeNum < minBet;
  const aboveMax = stakeNum > 0 && maxBet >= 0 && stakeNum > maxBet;
  const stakeError = belowMin
    ? `Min bet is ${minBet}`
    : aboveMax
      ? `Max bet is ${maxBet}`
      : null;

  const resolvedStakes = (stakeButtons && stakeButtons.length > 0 ? stakeButtons : DEFAULT_STAKES).map(
    (btn) => ({ ...btn, label: formatStakeLabel(btn.value) }),
  );
  const isDelaying = betDelayRemaining != null && betDelayRemaining > 0;
  const stakeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => stakeInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [data.marketId, data.runner?.selectionId]);

  const handleStake = (val: string) => {
    if (val === "" || /^\d*$/.test(val)) {
      onStakeChange(val);
    }
  };

  const setStakeClamped = (n: number) => {
    onStakeChange(n > 0 ? String(n) : "");
  };

  const canPlace = !!stake && stakeNum > 0 && !stakeError && !isLoading && !isDelaying;

  return (
    <div className={`px-2 sm:px-3 py-2 border-t-2 w-full max-w-full overflow-hidden ${data.isLay ? "border-lay bg-gradient-to-b from-lay/50 to-lay/10" : "border-back bg-gradient-to-b from-back/50 to-back/10"}`}>
      {isDelaying && (
        <div className="mb-2 px-2 sm:px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-amber-700 truncate">
              Placing in {betDelayRemaining}s...
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelDelay}
            className="px-2 py-0.5 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition-colors shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:justify-end mb-2">
        <div className="text-gray-800 font-bold text-xs sm:text-sm truncate min-w-0 text-center sm:text-left sm:flex-1">
          {runnerName} - {marketName.toUpperCase()}
        </div>

        <div className="flex items-start gap-2 sm:gap-3 justify-end flex-wrap">
          <div className="flex items-center shrink-0">
            <input
              type="text"
              value={displayOdds}
              readOnly
              className="w-20 sm:w-24 bg-gray-50 text-gray-900 text-sm sm:text-base font-bold py-1.5 px-2 text-center border border-gray-300 rounded cursor-default"
            />
          </div>

          <div className="flex flex-col items-end gap-0.5 min-w-0">
            <div className="flex items-center min-w-0">
              <input
                ref={stakeInputRef}
                type="number"
                value={stake}
                onChange={(e) => handleStake(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const current = parseFloat(stake) || 0;
                    setStakeClamped(current === 0 ? 500 : current + 500);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setStakeClamped(Math.max(0, (parseFloat(stake) || 0) - 500));
                  }
                }}
                placeholder="0"
                disabled={isDelaying}
                style={{ width: `${Math.max(7, (stake?.length || 1) + 3)}ch` }}
                className={`min-w-[5rem] sm:min-w-[6rem] max-w-full bg-gray-50 text-gray-900 text-sm sm:text-base font-bold py-1.5 px-2 text-center border rounded focus:ring-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-[width] duration-150 ${
                  stakeError
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 focus:ring-[#1a3578]"
                } ${isDelaying ? "opacity-50" : ""}`}
              />
              <div className="flex flex-col ml-0.5 shrink-0">
                <button
                  type="button"
                  disabled={isDelaying}
                  onClick={() => {
                    const current = parseFloat(stake) || 0;
                    setStakeClamped(current === 0 ? 500 : current + 500);
                  }}
                  className="bg-gray-100 text-gray-600 px-1 py-0.5 text-[10px] hover:bg-gray-200 border border-gray-300 rounded-t disabled:opacity-50"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={isDelaying}
                  onClick={() => setStakeClamped(Math.max(0, (parseFloat(stake) || 0) - 500))}
                  className="bg-gray-100 text-gray-600 px-1 py-0.5 text-[10px] hover:bg-gray-200 border border-gray-300 border-t-0 rounded-b disabled:opacity-50"
                >
                  ▼
                </button>
              </div>
            </div>
            {stakeError && (
              <span className="text-danger text-[10px] sm:text-[10px] font-medium">{stakeError}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-end w-full sm:w-auto">
          {resolvedStakes.map((btn) => (
            <button
              key={btn.value}
              type="button"
              disabled={isDelaying}
              onClick={() => setStakeClamped(btn.value)}
              className="flex-1 sm:flex-none min-w-[3.5rem] px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded bg-gradient-to-b from-sports-header to-sports-header/80 hover:from-sports-header/90 hover:to-sports-header/70 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onPlaceBet(stake, rawOdds)}
            disabled={!canPlace}
            className="flex-1 sm:flex-none min-w-[84px] sm:min-w-[96px] px-3 sm:px-5 py-2 rounded text-xs sm:text-sm font-semibold bg-[var(--header-primary)] hover:from-cta-deposit-from-hover hover:to-cta-deposit-to-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-[var(--header-text)] transition-all flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                <span className="truncate">Placing...</span>
              </>
            ) : isDelaying ? (
              <span className="truncate">Waiting {betDelayRemaining}s...</span>
            ) : (
              "Place Bet"
            )}
          </button>
          <button
            type="button"
            onClick={isDelaying ? onCancelDelay : onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded text-xs sm:text-sm font-semibold bg-gradient-to-b from-danger-strong to-danger-strong/80 hover:from-danger-strong/90 hover:to-danger-strong/70 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
