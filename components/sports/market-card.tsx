"use client";

// Shared market card used on the /multimarket page. Picks the right layout
// (standard back/lay, team-binary, binary YES/NO, odd/even, lottery, multi-grid,
// or fancy/LINE) based on the market's shape — mirrors the match page's
// rendering so the user sees exactly the same UI for each market type.

import { Timer } from "lucide-react";
import {
  QuickBetPanel,
  toDecimalOdds,
  toDecimalfancyOdds,
  type QuickBetData,
} from "@/components/sports/quick-bet-panel";

const oddsBtnClass =
  "flex-1 min-w-0 px-1 py-1 flex flex-col items-center justify-center rounded-md cursor-pointer leading-tight transition-all duration-150";
const oddsPriceClass = "text-gray-900 font-bold text-sm sm:text-base";
const oddsSizeClass = "text-gray-900 font-bold text-[11px] sm:text-[13px]";

function formatOddsPrice(price: number | string | null | undefined): string {
  if (price == null) return "0";
  const num = parseFloat(String(price));
  if (isNaN(num)) return "0";
  const dp = num < 0.1 ? 3 : 2;
  return parseFloat(num.toFixed(dp)).toString();
}

function formatAmount(amount: any): string {
  if (amount == null) return "0";
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (!isFinite(n) || n === 0) return "0";
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

// ── Layout detection — identical to the match page ────────────────────────
type Layout =
  | "standard"
  | "team-binary"
  | "binary"
  | "odd-even"
  | "lottery"
  | "multi-grid"
  | "fancy";

function detectLayout(market: any): Layout {
  if ((market?.bettingType ?? "").toUpperCase() === "LINE") return "fancy";
  const runners: any[] = market?.runners || [];
  const names = runners.map((r: any) => (r.name || "").toUpperCase().trim());
  const hasLay = runners.some((r: any) => {
    const lay = r.lay || [];
    return lay.length > 0 && parseFloat(String(lay[0]?.price)) > 0;
  });
  if (hasLay) return "standard";
  if (runners.length >= 8 && names.every((n) => /^\d$/.test(n))) return "lottery";
  if (names.includes("ODD") && names.includes("EVEN")) return "odd-even";
  if (names.includes("YES") && names.includes("NO")) return "binary";
  if (runners.length === 2) return "team-binary";
  return "multi-grid";
}

// ── Shared exposure cell ──────────────────────────────────────────────────
function RunnerExposureLine({
  marketId,
  runnerId,
  isFancy,
  isFirstRunner,
  quickBet,
  quickBetStake,
  liveQuickBetOdds,
  marketExposureMap,
  fancyExposureMap,
  previewExposure,
}: {
  marketId: string;
  runnerId: string;
  isFancy: boolean;
  isFirstRunner: boolean;
  quickBet: QuickBetData | null;
  quickBetStake: string;
  liveQuickBetOdds: string | undefined;
  marketExposureMap: Map<string, Map<string, number>> | undefined;
  fancyExposureMap: Map<string, number> | undefined;
  previewExposure: { marketId: string; runners: Map<string, number> } | null;
}) {
  let pnl: number | null = null;
  let prevPnl: number | null = null;

  if (isFancy) {
    if (!isFirstRunner) return null;
    const raw = fancyExposureMap?.get(String(marketId));
    const settled = raw != null && raw !== 0 ? raw : null;
    if (
      quickBet &&
      String(quickBet.marketId) === String(marketId) &&
      quickBet.bettingType === "LINE"
    ) {
      const stakeNum = parseFloat(quickBetStake) || 0;
      const oddsNum = parseFloat(liveQuickBetOdds ?? quickBet.odds) || 0;
      if (stakeNum > 0 && oddsNum > 0) {
        const layRisk = stakeNum * oddsNum;
        const betPnl = quickBet.isLay ? -layRisk : -stakeNum;
        prevPnl = settled;
        pnl = (settled ?? 0) + betPnl;
      } else {
        pnl = settled;
      }
    } else {
      pnl = settled;
    }
  } else if (previewExposure && previewExposure.marketId === String(marketId)) {
    prevPnl = marketExposureMap?.get(String(marketId))?.get(runnerId) ?? null;
    pnl = previewExposure.runners.get(runnerId) ?? null;
  } else {
    pnl = marketExposureMap?.get(String(marketId))?.get(runnerId) ?? null;
  }

  if (pnl == null && prevPnl == null) return null;
  const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

  if (pnl !== null && prevPnl !== null) {
    const diff = pnl - prevPnl;
    return (
      <span className="text-[10px] sm:text-xs font-bold leading-tight flex items-center gap-1 flex-wrap">
        <span className={prevPnl >= 0 ? "text-live-text" : "text-danger"}>{fmt(prevPnl)}</span>
        <span className="text-gray-400">=&gt;</span>
        <span className={pnl >= 0 ? "text-live-text" : "text-danger"}>{fmt(pnl)}</span>
        <span className="text-gray-400">=&gt;</span>
        <span className="text-gray-500 font-normal">diff:</span>
        <span className={diff >= 0 ? "text-live-text" : "text-danger"}>{fmt(diff)}</span>
      </span>
    );
  }
  return (
    <span
      className={`text-[10px] sm:text-xs font-bold leading-tight ${
        (pnl as number) >= 0 ? "text-live-text" : "text-danger"
      }`}
    >
      {fmt(pnl as number)}
    </span>
  );
}

function RunnerNameCell({
  runner,
  marketId,
  displayName,
  isFancy,
  isFirstRunner,
  betDelay,
  exposureProps,
}: {
  runner: any;
  marketId: string;
  displayName?: string;
  isFancy?: boolean;
  isFirstRunner?: boolean;
  betDelay?: number;
  exposureProps: {
    quickBet: QuickBetData | null;
    quickBetStake: string;
    liveQuickBetOdds: string | undefined;
    marketExposureMap: Map<string, Map<string, number>> | undefined;
    fancyExposureMap: Map<string, number> | undefined;
    previewExposure: { marketId: string; runners: Map<string, number> } | null;
  };
}) {
  const runnerId = runner.selectionId?.toString() ?? "";

  return (
    <div className="min-w-0 pr-1 flex flex-col gap-0.5">
      <div className="flex items-center gap-4">
        {(displayName !== "" || !isFancy) && (
          <span
            className={`text-gray-900 font-bold text-sm sm:text-base block leading-tight ${isFancy ? "cursor-default" : "truncate"}`}
          >
            {displayName || runner.name}
          </span>
        )}
        {betDelay != null && (
          <span className=" md:flex items-center text-[8px] sm:text-[9px] text-black font-medium leading-tight hidden ">
            <Timer size={20} />
            <span>{betDelay}s</span>
          </span>
        )}
      </div>
      <RunnerExposureLine
        marketId={marketId}
        runnerId={runnerId}
        isFancy={!!isFancy}
        isFirstRunner={!!isFirstRunner}
        {...exposureProps}
      />
    </div>
  );
}

function SuspendedCell({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded flex items-center justify-center ${className}`}
      style={{
        background: "repeating-linear-gradient(45deg,#374151 0,#374151 4px,#4B5563 4px,#4B5563 8px)",
      }}
    >
      <span className="text-red-400 font-bold text-xs relative z-10">Suspended</span>
    </div>
  );
}

function backLayOverlay(market: any) {
  const show = market?.sportingEvent || market?.status === "SUSPENDED";
  if (!show) return null;
  const label = market?.status === "SUSPENDED" ? "Suspended" : "Ball Running";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-10 cursor-not-allowed bg-white/70 backdrop-blur-[1px]"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-danger-strong font-bold text-xs sm:text-sm bg-red-50 px-3 py-1 rounded-full border border-red-200/50 shadow-sm">
        {label}
      </span>
    </div>
  );
}

// ── MarketCard — main entry point ─────────────────────────────────────────
export interface MarketCardProps {
  market: any;
  // fallback name / min / max when market is missing (no live odds yet)
  fallbackName?: string;
  fallbackMinBet?: number | string;
  fallbackMaxBet?: number | string;
  headerPrefix?: React.ReactNode;
  // If set, overrides the title shown in the header (used on /multimarket to
  // render "Event Name (Market Name)" without mutating market.marketName).
  titleOverride?: string;
  // click handlers
  handleBackClick: (
    market: any,
    runner: any,
    odds: number,
    run: string | null,
    priceIndex: number,
    isRawOdds: boolean,
  ) => void;
  handleLayClick: (
    market: any,
    runner: any,
    odds: number,
    run: string | null,
    priceIndex: number,
    isRawOdds: boolean,
  ) => void;
  // quick bet state
  quickBet: QuickBetData | null;
  quickBetStake: string;
  setQuickBetStake: (v: string) => void;
  isPlacing: boolean;
  betDelayRemaining: number;
  cancelBetDelay: () => void;
  handleQuickBetClose: () => void;
  handleQuickBetPlace: (stake: string, odds: string) => void;
  liveQuickBetOdds: string | undefined;
  customStakes: { label: string; value: number }[] | undefined;
  // exposure
  marketExposureMap: Map<string, Map<string, number>> | undefined;
  fancyExposureMap: Map<string, number> | undefined;
  previewExposure: { marketId: string; runners: Map<string, number> } | null;
}

export function MarketCard(props: MarketCardProps) {
  const {
    market,
    fallbackName,
    fallbackMinBet,
    fallbackMaxBet,
    headerPrefix,
    titleOverride,
    handleBackClick,
    handleLayClick,
    quickBet,
    quickBetStake,
    setQuickBetStake,
    isPlacing,
    betDelayRemaining,
    cancelBetDelay,
    handleQuickBetClose,
    handleQuickBetPlace,
    liveQuickBetOdds,
    customStakes,
    marketExposureMap,
    fancyExposureMap,
    previewExposure,
  } = props;

  const exposureProps = {
    quickBet,
    quickBetStake,
    liveQuickBetOdds,
    marketExposureMap,
    fancyExposureMap,
    previewExposure,
  };

  // No live odds yet — show a placeholder card so the pin stays visible
  if (!market) {
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
        <div className="px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] flex items-center justify-between gap-2">
          <h3 className="min-w-0 font-bold text-white text-sm sm:text-base leading-tight flex items-center gap-1.5 flex-1">
            {headerPrefix}
            <span className="flex-1 break-words">{fallbackName ?? "Market"}</span>
          </h3>
          <span className="shrink-0 text-white/70 text-xs sm:text-sm whitespace-nowrap">
            Min: {fallbackMinBet ?? "-"} | Max: {fallbackMaxBet ?? "-"}
          </span>
        </div>
        <div className="bg-white px-3 py-4 text-center text-xs text-gray-500">
          Waiting for live odds…
        </div>
      </div>
    );
  }

  const layout = detectLayout(market);
  const marketId: string = market.marketId;
  const isMarketSusp = market.status === "SUSPENDED" || !!market.sportingEvent;
  const minBet = market.marketCondition?.minBet ?? fallbackMinBet ?? "-";
  const maxBet = market.marketCondition?.maxBet ?? fallbackMaxBet ?? "-";

  const renderQuickBet = () =>
    quickBet && quickBet.marketId === marketId ? (
      <QuickBetPanel
        data={quickBet}
        stake={quickBetStake}
        onStakeChange={setQuickBetStake}
        onClose={handleQuickBetClose}
        onPlaceBet={handleQuickBetPlace}
        isLoading={isPlacing}
        betDelayRemaining={betDelayRemaining}
        onCancelDelay={cancelBetDelay}
        stakeButtons={customStakes}
        currentOdds={liveQuickBetOdds}
      />
    ) : null;

  // ── STANDARD (back/lay 3x3 grid) ─────────────────────────────────────
  if (layout === "standard") {
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578]">
          <h3 className="min-w-0 font-bold text-white text-sm sm:text-base leading-tight flex items-center gap-1.5 flex-1">
            {headerPrefix}
            <span className="flex-1 break-words">
              {titleOverride ?? market.marketName ?? fallbackName}
            </span>
          </h3>
          <div className="shrink-0 text-white/70 text-xs sm:text-sm hidden md:flex items-center gap-x-1">
            <span>
              Min: {minBet} / Max: {maxBet}
            </span>
            {market.marketCondition?.betDelay != null && (
              <span className="flex items-center text-yellow-300">
                · <Timer size={15} /> <span>{market.marketCondition.betDelay}s</span>
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {market.runners.map((runner: any) => {
            const isRunnerSuspended =
              runner.status === "SUSPENDED" ||
              runner.status === "REMOVED" ||
              isMarketSusp;
            return (
              <div
                key={runner.selectionId}
                className="px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white hover:bg-gray-50/80 transition-colors"
              >
                <RunnerNameCell
                  runner={runner}
                  marketId={marketId}
                  exposureProps={exposureProps}
                />
                <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                  {/* Back */}
                  <div className="flex-1 flex flex-col items-end min-w-0">
                    <div className="gap-1 flex justify-end items-center flex-wrap">
                      {(() => {
                        if (isRunnerSuspended) {
                          return Array(3)
                            .fill(null)
                            .map((_, posIdx) => (
                              <button
                                key={`bs-${posIdx}`}
                                className={`${oddsBtnClass} bg-back-disabled w-24 ${posIdx !== 2 ? "hidden sm:flex" : ""}`}
                                disabled
                              >
                                <span className={oddsPriceClass}>0</span>
                                <span className={oddsSizeClass}>0</span>
                              </button>
                            ));
                        }
                        const backItems = runner.back || [];
                        const positions = Array(3).fill(null);
                        backItems.forEach((item: any, idx: number) => {
                          if (idx < 3) positions[2 - idx] = item;
                        });
                        return positions.map((item, posIdx) =>
                          item ? (
                            <button
                              key={`b-${posIdx}`}
                              onClick={() =>
                                handleBackClick(
                                  market,
                                  runner,
                                  toDecimalOdds(parseFloat(String(item.price)), market.provider, market.marketType),
                                  null,
                                  2 - posIdx,
                                  false,
                                )
                              }
                              className={`${oddsBtnClass} transition-all w-24 ${
                                posIdx === 2
                                  ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm"
                                  : "bg-white hover:bg-back/30 border border-back/50 hidden sm:flex"
                              }`}
                            >
                              <span className={oddsPriceClass}>{formatOddsPrice(item.price)}</span>
                              <span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                            </button>
                          ) : (
                            <button
                              key={`be-${posIdx}`}
                              className={`${oddsBtnClass} bg-back-disabled w-24 ${posIdx !== 2 ? "hidden sm:flex" : ""}`}
                              disabled
                            >
                              <span className={oddsPriceClass}>-</span>
                              <span className={oddsSizeClass}>-</span>
                            </button>
                          ),
                        );
                      })()}
                    </div>
                  </div>
                  {/* Lay */}
                  <div className="flex-1 flex flex-col items-start min-w-0">
                    <div className="gap-1 flex justify-start items-center flex-wrap">
                      {isRunnerSuspended ? (
                        Array(3)
                          .fill(null)
                          .map((_, idx) => (
                            <button
                              key={`ls-${idx}`}
                              className={`${oddsBtnClass} bg-lay-disabled w-24 ${idx !== 0 ? "hidden sm:flex" : ""}`}
                              disabled
                            >
                              <span className={oddsPriceClass}>0</span>
                              <span className={oddsSizeClass}>0</span>
                            </button>
                          ))
                      ) : (
                        <>
                          {runner.lay && runner.lay.length > 0
                            ? runner.lay.map((layItem: any, layIdx: number) => (
                                <button
                                  key={`l-${layIdx}`}
                                  onClick={() =>
                                    handleLayClick(
                                      market,
                                      runner,
                                      toDecimalOdds(parseFloat(String(layItem.price)), market.provider, market.marketType),
                                      null,
                                      layIdx,
                                      false,
                                    )
                                  }
                                  className={`${oddsBtnClass} transition-all w-24 ${
                                    layIdx === 0
                                      ? "bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay shadow-sm"
                                      : "bg-white hover:bg-lay/30 border border-lay/50 hidden sm:flex"
                                  }`}
                                >
                                  <span className={oddsPriceClass}>
                                    {layItem.price ? formatOddsPrice(layItem.price) : "0"}
                                  </span>
                                  <span className={oddsSizeClass}>{formatAmount(layItem.size)}</span>
                                </button>
                              ))
                            : null}
                          {Array.from({
                            length: Math.max(0, 3 - (runner.lay?.length || 0)),
                          }).map((_, emptyIdx) => {
                            const hasLay = (runner.lay?.length || 0) > 0;
                            const hideOnMobile = hasLay || emptyIdx > 0;
                            return (
                              <button
                                key={`le-${emptyIdx}`}
                                className={`${oddsBtnClass} bg-lay-disabled w-24 ${hideOnMobile ? "hidden sm:flex" : ""}`}
                                disabled
                              >
                                <span className={oddsPriceClass}>-</span>
                                <span className={oddsSizeClass}>-</span>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                  {backLayOverlay(market)}
                </div>
              </div>
            );
          })}
        </div>
        {renderQuickBet()}
      </div>
    );
  }

  // ── TEAM-BINARY (2 runners with team names, no lay) ─────────────────
  if (layout === "team-binary") {
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578]">
          <h3 className="min-w-0 font-bold text-white text-sm sm:text-base leading-tight flex items-center gap-1.5 flex-1">
            {headerPrefix}
            <span className="flex-1 break-words">
              {titleOverride ?? market.marketName ?? fallbackName}
            </span>
          </h3>
          <p className="shrink-0 text-white/70 text-xs sm:text-sm leading-tight hidden md:block">
            Min: {minBet} / Max: {maxBet}
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {market.runners.map((runner: any) => {
            const isRunnerSuspended =
              runner.status === "SUSPENDED" || runner.status === "REMOVED" || isMarketSusp;
            return (
              <div
                key={runner.selectionId}
                className="px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white hover:bg-gray-50/80 transition-colors"
              >
                <RunnerNameCell
                  runner={runner}
                  marketId={marketId}
                  exposureProps={exposureProps}
                />
                <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                  <div className="flex-1 flex flex-col items-end min-w-0">
                    <div className="gap-1 flex justify-end items-center flex-wrap">
                      {(() => {
                        if (isRunnerSuspended)
                          return Array(3)
                            .fill(null)
                            .map((_, i) => (
                              <button
                                key={i}
                                className={`${oddsBtnClass} bg-back-disabled w-24 ${i !== 2 ? "hidden sm:flex" : ""}`}
                                disabled
                              >
                                <span className={oddsPriceClass}>0</span>
                                <span className={oddsSizeClass}>0</span>
                              </button>
                            ));
                        const backItems = runner.back || [];
                        const positions = Array(3).fill(null);
                        backItems.forEach((item: any, idx: number) => {
                          if (idx < 3) positions[2 - idx] = item;
                        });
                        return positions.map((item, posIdx) =>
                          item ? (
                            <button
                              key={posIdx}
                              onClick={() =>
                                handleBackClick(
                                  market,
                                  runner,
                                  toDecimalOdds(parseFloat(String(item.price)), market.provider, market.marketType),
                                  null,
                                  2 - posIdx,
                                  false,
                                )
                              }
                              className={`${oddsBtnClass} transition-all w-24 ${
                                posIdx === 2
                                  ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm"
                                  : "bg-white hover:bg-back/30 border border-back/50 hidden sm:flex"
                              }`}
                            >
                              <span className={oddsPriceClass}>{formatOddsPrice(item.price)}</span>
                              <span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                            </button>
                          ) : (
                            <button
                              key={posIdx}
                              className={`${oddsBtnClass} bg-back-disabled w-24 ${posIdx !== 2 ? "hidden sm:flex" : ""}`}
                              disabled
                            >
                              <span className={oddsPriceClass}>-</span>
                              <span className={oddsSizeClass}>-</span>
                            </button>
                          ),
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-start min-w-0">
                    <div className="gap-1 flex justify-start items-center flex-wrap">
                      {Array(3)
                        .fill(null)
                        .map((_, idx) => (
                          <button
                            key={idx}
                            className={`${oddsBtnClass} bg-lay-disabled w-24 ${idx !== 0 ? "hidden sm:flex" : ""}`}
                            disabled
                          >
                            <span className={oddsPriceClass}>-</span>
                            <span className={oddsSizeClass}>-</span>
                          </button>
                        ))}
                    </div>
                  </div>
                  {backLayOverlay(market)}
                </div>
              </div>
            );
          })}
        </div>
        {renderQuickBet()}
      </div>
    );
  }

  // ── Shared ADV header ────────────────────────────────────────────────
  const advHeader = (
    <div className="px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578] flex items-center justify-between gap-2">
      <h3 className="min-w-0 font-bold text-white text-sm sm:text-base leading-tight flex items-center gap-1.5 flex-1">
        {headerPrefix}
        <span className="flex-1 break-words">
          {titleOverride ?? market.marketName ?? fallbackName}
        </span>
      </h3>
      <span className="shrink-0 text-white/70 text-xs sm:text-sm whitespace-nowrap">
        Min: {minBet} | Max: {maxBet}
      </span>
    </div>
  );

  // ── BINARY (YES/NO) ───────────────────────────────────────────────────
  if (layout === "binary") {
    const runners: any[] = market.runners || [];
    const yesRunner = runners.find((r: any) => r.name?.toUpperCase() === "YES") ?? runners[0];
    const noRunner = runners.find((r: any) => r.name?.toUpperCase() === "NO") ?? runners[1];
    const renderBinaryCell = (runner: any, side: "back" | "lay") => {
      if (!runner) return null;
      const isRunnerSusp = isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
      const backItem = runner.back?.[0];
      const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
      if (isRunnerSusp) return <SuspendedCell className="min-h-[2.75rem]" />;
      return (
        <button
          onClick={() =>
            rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)
          }
          className={`min-h-[2.75rem] mb-1 flex flex-col items-center justify-center font-bold text-sm text-gray-900 transition-all ${side === "back" ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back" : "bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay"}`}
        >
          <span className="text-base font-bold">
            {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
          </span>
          {backItem?.size && (
            <span className="text-[11px]">{formatAmount(parseFloat(String(backItem.size)))}</span>
          )}
        </button>
      );
    };
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {advHeader}
        <div className="bg-white grid grid-cols-2 sm:grid-cols-4 items-stretch">
          <div className="px-3 flex items-center min-h-[2.75rem] min-w-0">
            {yesRunner && (
              <RunnerNameCell runner={yesRunner} marketId={marketId} exposureProps={exposureProps} />
            )}
          </div>
          {renderBinaryCell(yesRunner, "back")}
          <div className="px-3 flex items-center min-h-[2.75rem] min-w-0">
            {noRunner && (
              <RunnerNameCell runner={noRunner} marketId={marketId} exposureProps={exposureProps} />
            )}
          </div>
          {renderBinaryCell(noRunner, "lay")}
        </div>
        {renderQuickBet()}
      </div>
    );
  }

  // ── ODD/EVEN ──────────────────────────────────────────────────────────
  if (layout === "odd-even") {
    const runners: any[] = market.runners || [];
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {advHeader}
        <div className="bg-white grid grid-cols-2 sm:grid-cols-4 items-stretch">
          {runners.flatMap((runner: any) => {
            const isRunnerSusp =
              isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
            const backItem = runner.back?.[0];
            const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
            return [
              <div key={`lbl-${runner.selectionId}`} className="px-3 flex items-center min-h-[2.75rem]">
                <RunnerNameCell runner={runner} marketId={marketId} exposureProps={exposureProps} />
              </div>,
              isRunnerSusp ? (
                <SuspendedCell key={`susp-${runner.selectionId}`} className="min-h-[2.75rem]" />
              ) : (
                <button
                  key={`btn-${runner.selectionId}`}
                  onClick={() =>
                    rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)
                  }
                  className="min-h-[2.75rem] mb-1 flex items-center justify-center font-bold text-base text-gray-900 bg-back hover:bg-back-hover transition-all"
                >
                  {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
                </button>
              ),
            ];
          })}
        </div>
        {renderQuickBet()}
      </div>
    );
  }

  // ── LOTTERY ──────────────────────────────────────────────────────────
  if (layout === "lottery") {
    const runners: any[] = market.runners || [];
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {advHeader}
        <div className="bg-white px-2 sm:px-3 py-3">
          {isMarketSusp ? (
            <SuspendedCell className="w-full min-h-[2.5rem]" />
          ) : (
            <div className="flex items-end justify-end gap-2 flex-wrap">
              {runners.map((runner: any) => {
                const backItem = runner.back?.[0];
                const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                const isRunnerSusp = runner.status === "SUSPENDED" || runner.status === "REMOVED";
                const rId = runner.selectionId?.toString() ?? "";
                const runnerPnl: number | null = (() => {
                  if (previewExposure && previewExposure.marketId === String(marketId)) {
                    return previewExposure.runners.get(rId) ?? null;
                  }
                  return marketExposureMap?.get(String(marketId))?.get(rId) ?? null;
                })();
                return (
                  <div key={runner.selectionId} className="flex flex-col items-center gap-0.5">
                    <button
                      disabled={isRunnerSusp || rawPrice == null}
                      onClick={() =>
                        rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)
                      }
                      className="w-9 h-9 rounded-full bg-[#142669] hover:bg-[#142669] text-white font-bold text-sm flex items-center justify-center shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {runner.name}
                    </button>
                    {runnerPnl !== null && (
                      <span
                        className={`text-[9px] font-bold leading-none ${runnerPnl >= 0 ? "text-live-text" : "text-danger"}`}
                      >
                        {runnerPnl >= 0 ? "+" : ""}
                        {runnerPnl.toFixed(0)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {renderQuickBet()}
      </div>
    );
  }

  // ── FANCY / LINE ──────────────────────────────────────────────────────
  if (layout === "fancy") {
    const runners: any[] = market.runners || [];
    const visibleRunners = isMarketSusp
      ? runners
      : runners.filter((r: any) => r.status !== "SUSPENDED" && r.status !== "REMOVED");

    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-gradient-to-r from-[#142969] to-[#1a3578]">
          <h3 className="min-w-0 font-bold text-white text-sm sm:text-base leading-tight flex items-center gap-1.5 flex-1">
            {headerPrefix}
            <span className="flex-1 break-words">
              {titleOverride ?? market.marketName ?? fallbackName}
            </span>
          </h3>
        </div>
        <div className="border-b border-gray-100 last:border-b-0 bg-white">
          {(() => {
            const midIdx = Math.floor((visibleRunners.length - 1) / 2);
            return visibleRunners.map((runner: any, runnerIdx: number) => {
              const isRunnerSuspended = isMarketSusp;
              const showLabel = runnerIdx === midIdx;
              return (
                <div
                  key={runner.selectionId}
                  className={`px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white${visibleRunners.length > 1 ? " py-0.5" : ""}`}
                >
                  {showLabel ? (
                    <RunnerNameCell
                      runner={runner}
                      marketId={marketId}
                      displayName={ market.marketName ?? fallbackName}
                      isFancy
                      isFirstRunner
                      betDelay={market.marketCondition?.betDelay}
                      exposureProps={exposureProps}
                    />
                  ) : (
                    <div />
                  )}
                  <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                    <div className="flex-1 flex flex-col items-end min-w-0">
                      <div className="gap-1 flex justify-end items-center flex-wrap">
                        {isRunnerSuspended ? (
                          <button className={`${oddsBtnClass} bg-back-disabled w-24`} disabled>
                            <span className={oddsPriceClass}>0</span>
                            <span className={oddsSizeClass}>0</span>
                          </button>
                        ) : runner.lay?.length > 0 ? (
                          runner.lay.map((layItem: any, layIdx: number) => (
                            <button
                              key={layIdx}
                              onClick={() =>
                                handleLayClick(
                                  market,
                                  runner,
                                  toDecimalfancyOdds(layItem.price, market.provider),
                                  String(layItem.line ?? ""),
                                  layIdx,
                                  false,
                                )
                              }
                              className={`${oddsBtnClass} bg-gradient-to-b from-lay to-lay-deep hover:from-lay-hover hover:to-lay shadow-sm transition-all w-24`}
                            >
                              <span className={oddsPriceClass}>{layItem.line}</span>
                              <span className={oddsSizeClass}>{formatAmount(layItem.price)}</span>
                            </button>
                          ))
                        ) : (
                          <button className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled>
                            <span className={oddsPriceClass}>-</span>
                            <span className={oddsSizeClass}>-</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                      <div className="gap-1 flex justify-start items-center flex-wrap min-w-0">
                        {isRunnerSuspended ? (
                          <button className={`${oddsBtnClass} bg-back-disabled w-24`} disabled>
                            <span className={oddsPriceClass}>0</span>
                            <span className={oddsSizeClass}>0</span>
                          </button>
                        ) : runner.back?.length > 0 ? (
                          runner.back.map((backItem: any, backIdx: number) => (
                            <button
                              key={backIdx}
                              onClick={() =>
                                handleBackClick(
                                  market,
                                  runner,
                                  toDecimalfancyOdds(backItem.price, market.provider),
                                  String(backItem.line ?? ""),
                                  backIdx,
                                  false,
                                )
                              }
                              className={`${oddsBtnClass} transition-all w-24 ${backIdx === 0 ? "bg-gradient-to-b from-back to-back-deep hover:from-back-hover hover:to-back shadow-sm" : "bg-white hover:bg-back/30 border border-back/50"}`}
                            >
                              <span className={oddsPriceClass}>{backItem.line}</span>
                              <span className={oddsSizeClass}>{formatAmount(backItem.price)}</span>
                            </button>
                          ))
                        ) : (
                          <button className={`${oddsBtnClass} bg-lay-disabled w-24`} disabled>
                            <span className={oddsPriceClass}>-</span>
                            <span className={oddsSizeClass}>-</span>
                          </button>
                        )}
                      </div>
                      {showLabel && (
                        <div className="hidden sm:flex flex-col text-xs text-black font-bold leading-tight text-right shrink-0">
                          <span>Max:{market.marketCondition?.["maxBet"] ?? "-"}</span>
                          <span>
                            MKT:
                            {market.marketCondition?.["potLimit"] ?? market.marketCondition?.["maxProfit"] ?? "-"}
                          </span>
                        </div>
                      )}
                    </div>
                    {backLayOverlay(market)}
                  </div>
                </div>
              );
            });
          })()}
        </div>
        {renderQuickBet()}
      </div>
    );
  }

  // ── MULTI-GRID (fallthrough) ─────────────────────────────────────────
  const runners: any[] = market.runners || [];
  const cols = Math.min(runners.length, 3);
  const mdColsClass =
    cols === 1 ? "md:grid-cols-1" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {advHeader}
      <div
        className={`bg-white grid grid-cols-1 sm:grid-cols-2 ${mdColsClass} divide-x divide-y divide-gray-100`}
      >
        {runners.map((runner: any) => {
          const isRunnerSusp =
            isMarketSusp || runner.status === "SUSPENDED" || runner.status === "REMOVED";
          const backItem = runner.back?.[0];
          const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
          return (
            <div key={runner.selectionId} className="flex items-stretch min-w-0">
              <div className="flex-1 px-2 py-1.5 min-w-0">
                <RunnerNameCell runner={runner} marketId={marketId} exposureProps={exposureProps} />
              </div>
              {isRunnerSusp ? (
                <SuspendedCell className="w-16 min-h-[2.25rem] shrink-0" />
              ) : (
                <button
                  onClick={() =>
                    rawPrice != null && handleBackClick(market, runner, rawPrice, null, 0, true)
                  }
                  className="w-16 min-h-[2.25rem] flex items-center justify-center font-bold text-sm text-gray-900 bg-back hover:bg-back-hover transition-all shrink-0"
                >
                  {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {renderQuickBet()}
    </div>
  );
}
