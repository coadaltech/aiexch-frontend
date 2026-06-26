"use client";

// Shared quick-bet pieces — types, odds converters, and the inline stake
// panel. Used by both the single-match page (/sports/.../[matchId]) and the
// multimarket page (/multimarket), so the bet-placement UX stays identical
// across both.

import { useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Trash2, Pencil } from "lucide-react";
import { DEFAULT_STAKES } from "@/hooks/useUserQueries";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteTheme } from "@/contexts/ThemeContext";

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
  // true when this placement is an auto-generated Cashout hedge.
  isCashout?: boolean;
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
  stakeButtons?: { label: string; value: number }[];
  currentOdds?: string;
  currentRun?: string;
}) {
  const { user: currentUser } = useAuth();
  const { theme } = useSiteTheme();
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
  const marketMaxBet = parseFloat(market?.marketCondition?.maxBet) || 0;
  // Per-user single-bet cap from /profile/me. 0 means "no per-bet cap".
  const txLimit = parseFloat(String(currentUser?.transactionLimit ?? "0")) || 0;
  // The effective ceiling is the more restrictive of (market maxBet, user txLimit).
  // 0 from either side means "no limit on that side", so we ignore zeros when
  // taking the min — the min of two positive values, or whichever is positive.
  const effectiveMaxBet =
    marketMaxBet > 0 && txLimit > 0
      ? Math.min(marketMaxBet, txLimit)
      : marketMaxBet > 0
        ? marketMaxBet
        : txLimit;
  const stakeNum = parseFloat(stake) || 0;

  // Impossible bet limits: a positive min above the market max (e.g. min=1,
  // max=0) means no stake can ever be valid, so betting on this market must be
  // blocked entirely. max=0 is a hard zero here — its "no upper limit" meaning
  // only applies when there is no minimum.
  const limitsImpossible = minBet > 0 && minBet > marketMaxBet;
  const belowMin = stakeNum > 0 && minBet > 0 && stakeNum < minBet;
  const aboveMax = stakeNum > 0 && effectiveMaxBet > 0 && stakeNum > effectiveMaxBet;
  // When the user's own per-bet cap is the tighter limit, surface that wording
  // so they understand why the bet is being rejected.
  const cappedByTxLimit = aboveMax && txLimit > 0 && txLimit <= (marketMaxBet || Infinity);
  const stakeError = limitsImpossible
    ? "Betting is not available on this market"
    : belowMin
      ? `Min bet is ${minBet}`
      : aboveMax
        ? cappedByTxLimit
          ? `Per-bet limit is ${txLimit}`
          : `Max bet is ${marketMaxBet}`
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

  // Potential profit if the bet wins. For a BACK bet that's stake × (decimalOdds − 1).
  // For a LAY bet the user's profit on a win is the stake amount itself.
  const decimalOddsForCalc = data.isRawOdds
    ? toDecimalOdds(numOdds, data.market?.provider, data.market?.marketType)
    : numOdds;
  const profit = !stakeNum || isNaN(decimalOddsForCalc)
    ? 0
    : data.isLay
      ? stakeNum
      : stakeNum * (decimalOddsForCalc - 1);
  const formatProfit = (n: number) => {
    if (!Number.isFinite(n) || n === 0) return "0";
    return n.toFixed(2).replace(/\.00$/, "");
  };

  const formatStakeBtn = (v: number) => {
    if (v >= 10000000) return `+${v / 10000000}Cr`;
    if (v >= 100000) return `+${v / 100000}L`;
    if (v >= 1000) return `+${v / 1000}k`;
    return `+${v}`;
  };

  const tintRunnerBg = data.isLay ? "bg-lay" : "bg-back";
  const tintListBg = data.isLay ? "bg-lay" : "bg-back";

  // ── TomExch theme layout — the reference "Bet Slip" panel (Bet For / Odds /
  // Stake / Profit-or-Liability table, single-row quick stakes, Clear All /
  // Submit). Reuses ALL the same state/handlers, so placement is identical. ──────
  if (theme === "tomexch") {
    const betTypeLabel =
      data.bettingType === "LINE"
        ? "Fancy"
        : data.bettingType?.toUpperCase() === "BOOKMAKER"
          ? "Bookmaker"
          : "Odds";
    const fmtStake = (v: number) => {
      if (v >= 10000000) return `${v / 10000000}Cr`;
      if (v >= 100000) return `${v / 100000}L`.replace(".0L", "L");
      if (v >= 1000) return `${v / 1000}K`.replace(".0K", "K");
      return String(v);
    };
    const rowTint = data.isLay ? "bg-[#f7d2dd]" : "bg-[#d2e4f6]";
    return (
      <div className="w-full overflow-hidden bg-white text-slate-800">
        {/* Bet Slip header */}
        <div className="flex items-center justify-between border-b-2 border-[#1ba9c9] bg-slate-50 px-3 py-2">
          <span className="text-[15px] font-bold text-slate-700">Bet Slip</span>
          <span className="flex items-center gap-2 text-[15px] font-semibold text-slate-600">
            
            {/* <span className="inline-flex h-6 w-14 items-center rounded-full bg-slate-300 px-1">
              <span className="h-4 w-4 rounded-full bg-slate-800" />
              <span className="ml-1 text-[11px] font-bold text-slate-600">OFF</span>
            </span> */}
          </span>
        </div>

        {isDelaying && (
          <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="flex items-center gap-2 truncate text-sm font-medium text-amber-700">
              <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              Placing in {betDelayRemaining}s...
            </span>
          </div>
        )}

        {/* Single Bet - <type> */}
        <div className="py-2 text-center text-[15px] font-semibold text-slate-700">
          Single Bet - <span className="font-bold text-[#1ba9c9]">{betTypeLabel}</span>
        </div>

        {/* Customize Stake Buttons */}
        <div className="flex justify-end px-3 pb-2">
          {/* <button
            type="button"
            className="flex items-center gap-1.5 rounded bg-[#2f8fd0] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#2a82bf]"
          >
            Customize Stake Buttons <Pencil className="h-3.5 w-3.5" />
          </button> */}
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_7rem_5.5rem_4.5rem] items-center gap-2 bg-slate-200 px-3 py-2 text-[13px] font-bold text-slate-700">
          <span>(Bet For)</span>
          <span className="text-center">Odds</span>
          <span className="text-center">Stake</span>
          <span className="text-center leading-tight">Profit or Liability</span>
        </div>

        {/* Runner row */}
        <div className={`grid grid-cols-[1fr_7rem_5.5rem_4.5rem] items-center gap-2 px-3 py-2 ${rowTint}`}>
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={onClose} aria-label="Remove">
              <Trash2 className="h-5 w-5 text-red-500 hover:text-red-600" />
            </button>
            <span className="font-bold leading-tight text-slate-800">{runnerName}</span>
          </div>
          {/* Odds with steppers (market-driven, read-only) */}
          <div className="flex h-9 items-stretch overflow-hidden rounded border border-slate-400 bg-white">
            <span className="flex w-7 items-center justify-center border-r border-slate-300 text-lg font-bold text-slate-600">−</span>
            <input readOnly value={displayOdds} className="w-full bg-transparent text-center text-sm font-bold text-slate-500 outline-none" />
            <span className="flex w-7 items-center justify-center border-l border-slate-300 text-lg font-bold text-slate-600">+</span>
          </div>
          {/* Stake */}
          <input
            ref={stakeInputRef}
            type="number"
            inputMode="numeric"
            value={stake}
            disabled={isDelaying}
            placeholder="stake"
            onChange={(e) => handleStake(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (canPlace) onPlaceBet(stake, rawOdds); } }}
            className={`h-9 rounded border bg-white text-center text-sm font-semibold text-slate-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${
              stakeError ? "border-red-400" : "border-slate-400"
            }`}
          />
          {/* Profit or Liability */}
          <span className="text-center text-sm font-bold text-red-600">{formatProfit(profit)}</span>
        </div>
        {stakeError && (
          <div className="px-3 pt-1 text-right text-[11px] font-medium text-danger">{stakeError}</div>
        )}

        {/* Quick stakes — single row */}
        <div className="grid grid-cols-4 gap-1.5 px-3 py-2 sm:grid-cols-8">
          {resolvedStakes.slice(0, 8).map((btn) => (
            <button
              key={btn.value}
              type="button"
              disabled={isDelaying}
              onClick={() => setStakeClamped((parseFloat(stake) || 0) + btn.value)}
              className="rounded border border-slate-300 bg-white py-2 text-[13px] font-bold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              {fmtStake(btn.value)}
            </button>
          ))}
        </div>

        {/* Clear All | Submit */}
        <div className="flex items-center justify-between px-3 pb-3">
          <button
            type="button"
            onClick={() => onStakeChange("")}
            className="rounded border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => onPlaceBet(stake, rawOdds)}
            disabled={!canPlace}
            className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Placing..." : isDelaying ? `${betDelayRemaining}s…` : "Submit"}
          </button>
        </div>
      </div>
    );
  }

  // ── Diamond theme layout — the reference "Place Bet" panel (Odds/Stake/Profit
  // columns, +1k…+75k quick stakes, Edit / Reset / Submit). Reuses ALL the same
  // state and handlers above, so bet placement behaviour is identical. ──────────
  if (theme === "diamond") {
    const runnerTint = data.isLay ? "bg-[var(--lay)]" : "bg-[var(--back)]";
    return (
      <div className="w-full overflow-hidden bg-white">
        {isDelaying && (
          <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm">
            <span className="flex items-center gap-2 truncate text-sm font-medium text-amber-700">
              <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              Placing in {betDelayRemaining}s...
            </span>
          </div>
        )}

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_5.5rem_5.5rem_auto] items-center gap-2 px-3 pt-2 text-[13px] font-semibold text-slate-600">
          <span>(Bet for)</span>
          <span className="text-center">Odds</span>
          <span className="text-center">Stake</span>
          <span className="text-right">Profit</span>
        </div>

        {/* Runner row */}
        <div className={`mt-1 grid grid-cols-[1fr_5.5rem_5.5rem_auto] items-center gap-2 px-3 py-2 ${runnerTint}`}>
          <span className="truncate font-bold text-slate-900" title={`${runnerName} - ${marketName}`}>
            {runnerName}
          </span>
          {/* Odds (market-driven, read-only) with a decorative stepper */}
          <div className="flex h-9 items-stretch overflow-hidden rounded border border-slate-300 bg-white">
            <input readOnly value={displayOdds} className="w-full bg-transparent text-center text-sm font-bold text-slate-900 outline-none" />
            <div className="flex flex-col border-l border-slate-300 text-slate-500">
              <span className="flex flex-1 items-center px-1"><ChevronUp className="h-3 w-3" /></span>
              <span className="flex flex-1 items-center border-t border-slate-300 px-1"><ChevronDown className="h-3 w-3" /></span>
            </div>
          </div>
          {/* Stake */}
          <input
            ref={stakeInputRef}
            type="number"
            inputMode="numeric"
            value={stake}
            disabled={isDelaying}
            onChange={(e) => handleStake(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); if (canPlace) onPlaceBet(stake, rawOdds); }
            }}
            className={`h-9 rounded border bg-white text-center text-sm font-bold text-slate-900 outline-none focus:ring-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              stakeError ? "border-red-400 focus:ring-red-400" : "border-slate-300 focus:ring-sky-500"
            }`}
          />
          {/* Profit */}
          <span className="text-right text-sm font-bold text-slate-900">{formatProfit(profit)}</span>
        </div>
        {stakeError && (
          <div className="px-3 pt-1 text-right text-[11px] font-medium text-danger">{stakeError}</div>
        )}

        {/* Quick stakes: +1k … +75k, then clear */}
        <div className="grid grid-cols-5 gap-1.5 px-3 py-2">
          {resolvedStakes.slice(0, 8).map((btn) => (
            <button
              key={btn.value}
              type="button"
              disabled={isDelaying}
              onClick={() => setStakeClamped((parseFloat(stake) || 0) + btn.value)}
              className="rounded bg-slate-200 py-2 text-[13px] font-bold text-slate-800 transition-colors hover:bg-slate-300 disabled:opacity-50"
            >
              {formatStakeBtn(btn.value)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onStakeChange("")}
            className="text-[13px] font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900"
          >
            clear
          </button>
        </div>

        {/* Edit | Reset | Submit */}
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={() => stakeInputRef.current?.focus()}
            className="rounded bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onStakeChange("")}
            className="rounded bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onPlaceBet(stake, rawOdds)}
            disabled={!canPlace}
            className="flex items-center justify-center gap-1.5 rounded bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span className="truncate">Placing...</span>
              </>
            ) : isDelaying ? (
              <span className="truncate">{betDelayRemaining}s…</span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden bg-white">
      {isDelaying && (
        <div className="mx-3 mt-2 px-2 sm:px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 shadow-sm">
          <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-amber-700 truncate">
            Placing in {betDelayRemaining}s...
          </span>
        </div>
      )}

      {/* Runner name + profit summary */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2 ${tintRunnerBg}`}>
        <span className="font-bold text-sm text-gray-900 truncate" title={`${runnerName} - ${marketName}`}>
          {runnerName}
        </span>
        <span className="text-sm text-gray-800 shrink-0">
          Profit: <span className="font-semibold">{formatProfit(profit)}</span>
        </span>
      </div>

      {/* Odds + Amount inputs */}
      <div className="grid grid-cols-2 gap-3 px-3 py-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-700 font-semibold text-center mb-1">Odds</span>
          <input
            type="text"
            value={displayOdds}
            readOnly
            className="w-full h-9 text-center font-bold text-base border border-gray-300 rounded bg-gray-50 text-gray-900"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-700 font-semibold text-center mb-1">Amount</span>
          <input
            ref={stakeInputRef}
            type="number"
            inputMode="numeric"
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
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (canPlace) onPlaceBet(stake, rawOdds);
              }
            }}
            placeholder=""
            disabled={isDelaying}
            className={`w-full h-9 text-center font-bold text-base border rounded bg-white text-gray-900 focus:ring-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              stakeError
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-[#1a3578]"
            } ${isDelaying ? "opacity-50" : ""}`}
          />
        </div>
      </div>
      {stakeError && (
        <div className="px-3 pb-1 -mt-1 text-right text-danger text-[11px] font-medium">{stakeError}</div>
      )}

      {/* Stake quick buttons — 4 per row */}
      <div className="grid grid-cols-4 gap-1.5 px-3 pb-2">
        {resolvedStakes.slice(0, 8).map((btn) => (
          <button
            key={btn.value}
            type="button"
            disabled={isDelaying}
            onClick={() => setStakeClamped(btn.value)}
            className={`px-1 py-2 text-xs sm:text-sm font-bold rounded ${tintListBg} cursor-pointer text-black transition-colors disabled:opacity-50`}
          >
            {formatStakeBtn(btn.value)}
          </button>
        ))}
      </div>

      {/* Action row: Place Bet | Cancel */}
      <div className="flex items-center gap-2 px-3 pb-3 justify-end">
        <button
          type="button"
          onClick={() => onPlaceBet(stake, rawOdds)}
          disabled={!canPlace}
          className="flex-1 sm:flex-none min-w-[96px] px-4 py-2 text-sm font-semibold rounded text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
          onClick={onClose}
          disabled={isLoading || isDelaying}
          className="flex-1 sm:flex-none min-w-[96px] px-4 py-2 text-sm font-semibold rounded text-white bg-danger-strong hover:bg-danger-strong/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {/* Runner list (all selections in this market) */}
      {data.allRunners?.length > 0 && (
        <div className={`px-3 py-2 ${tintListBg} border-t border-black/5`}>
          {data.allRunners.map((r) => (
            <div key={r.id} className="text-sm text-gray-900 font-medium py-0.5 truncate">
              {r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
