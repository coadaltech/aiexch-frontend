/**
 * Cashout engine for 2-runner Match Odds markets.
 *
 * Background
 * ----------
 * Each runner carries a signed "exposure" = your net P&L if THAT runner wins
 * (the sum of `potential_return` per runner, surfaced client-side via
 * `useMarketExposure()` as marketExposureMap[marketId][selectionId]).
 *
 * Cashout = add ONE opposing bet so every outcome pays the same amount `V`
 * (a full flatten). Effect of a hedge bet on the exposure vector:
 *
 *   back r @ O, stake x :  E[r] += x*(O-1) ;  E[other] -= x
 *   lay  r @ L, stake x :  E[r] -= x*(L-1) ;  E[other] += x
 *
 * For a 2-runner book there are exactly two flattening hedges:
 *   - LAY the higher-exposure runner at its best lay price, or
 *   - BACK the lower-exposure runner at its best back price.
 * Both flatten the book but at different odds/stake -> different locked value.
 * "Auto best available" computes BOTH, discards any that aren't placeable
 * (min/max bet, user limit, available liquidity at the best price) and returns
 * the one with the highest guaranteed value. If none is placeable, cashout is
 * unavailable (we never partially flatten — full cashout only).
 */

export interface RunnerPrice {
  selectionId: string;
  /** Best back price+size = runner.back[0] from the live ladder. */
  bestBack: { price: number; size: number } | null;
  /** Best lay price+size = runner.lay[0] from the live ladder. */
  bestLay: { price: number; size: number } | null;
  /** Current P&L if this runner wins (signed). 0 when no position. */
  exposure: number;
}

export interface CashoutConstraints {
  /** market.marketCondition.minBet */
  minBet: number;
  /** market.marketCondition.maxBet */
  maxBet: number;
  /** user.transactionLimit — per-user stake ceiling. <=0 means "no extra cap". */
  transactionLimit?: number;
}

export interface CashoutBet {
  selectionId: string;
  side: "back" | "lay";
  odds: number;
  stake: number;
}

export interface CashoutResult {
  available: boolean;
  /** Present when not available — why the button is disabled. */
  reason?: string;
  /** The hedge bet to place when available. */
  bet?: CashoutBet;
  /** Guaranteed P&L on every outcome after the hedge (the worst outcome). */
  lockedValue?: number;
  /** Exposure per runner AFTER the hedge, keyed by selectionId. */
  resultingExposure?: Record<string, number>;
  /** Current exposure spread, for display ("from -500 / +60"). */
  currentExposure?: Record<string, number>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Apply a hedge bet to an exposure map and return the new exposures. */
function applyHedge(
  exposure: Record<string, number>,
  runners: RunnerPrice[],
  bet: CashoutBet,
): Record<string, number> {
  const out: Record<string, number> = { ...exposure };
  for (const r of runners) {
    if (r.selectionId === bet.selectionId) {
      out[r.selectionId] +=
        bet.side === "back"
          ? bet.stake * (bet.odds - 1)
          : -bet.stake * (bet.odds - 1);
    } else {
      out[r.selectionId] += bet.side === "back" ? -bet.stake : bet.stake;
    }
  }
  return out;
}

interface Candidate {
  bet: CashoutBet;
  lockedValue: number;
  resultingExposure: Record<string, number>;
  /** Liquidity available at the chosen price. */
  availableSize: number;
  /** Blocking reason if not placeable, else null. */
  blocked: string | null;
}

/**
 * Compute the best placeable single-bet full cashout for an N-runner Match
 * Odds market (2-way, or 3-way with The Draw).
 *
 * A single hedge bet moves its own runner by ±stake·(odds−1) and every OTHER
 * runner by ∓stake — uniformly. So one bet can flatten the whole book only
 * when all-but-one runner already share the same exposure level: you hedge the
 * odd runner out, and the others (already equal) stay together. This is the
 * normal shape after betting on one selection (the rest sit at −stake), so it
 * covers 2-way markets and 3-way markets like Netherlands/Sweden/Draw where
 * the two un-bet runners are equal. If three distinct exposure levels exist no
 * single bet can flatten them, and no cashout is offered.
 */
export function computeMatchOddsCashout(
  runners: RunnerPrice[],
  c: CashoutConstraints,
): CashoutResult {
  if (runners.length < 2) {
    return { available: false, reason: "Need at least 2 runners" };
  }

  const exposure: Record<string, number> = {};
  for (const r of runners) exposure[r.selectionId] = r.exposure ?? 0;

  const values = Object.values(exposure);
  const hasPosition = values.some((v) => Math.abs(v) > 0.01);
  if (!hasPosition) {
    return { available: false, reason: "No open position", currentExposure: exposure };
  }
  if (Math.max(...values) - Math.min(...values) < 0.01) {
    return { available: false, reason: "Position already balanced", currentExposure: exposure };
  }

  const EPS = 0.01;
  const candidates: Candidate[] = [];

  const buildCandidate = (
    runner: RunnerPrice,
    side: "back" | "lay",
    price: number,
    availableSize: number,
    spread: number,
  ): Candidate => {
    // Stake that flattens the odd runner against the (equal) others: spread/odds.
    const stake = round2(spread / price);
    const bet: CashoutBet = { selectionId: runner.selectionId, side, odds: price, stake };
    const resultingExposure = applyHedge(exposure, runners, bet);
    const lockedValue = round2(Math.min(...Object.values(resultingExposure)));

    // Placeability is gated on min/max bet and the user's per-bet limit only.
    // We deliberately do NOT gate on the top-rung ladder size: a hedge stake
    // larger than the best price's available size still places fine (it matches
    // deeper / against the book), and the locked value is already a live-odds
    // estimate.
    //
    // Hardening: minBet/maxBet can arrive as 0 or undefined from a partial live
    // market snapshot. Never let that turn into a degenerate cashout:
    //  - DUST is an absolute floor so a residual stake that rounds toward 0
    //    (e.g. "Lay 0 @ 9") is never offered, even when minBet reads as 0.
    //  - maxBet/limit of 0 means "unset", not "max 0", so treat as no ceiling.
    const DUST = 1;
    const effectiveMin = Math.max(c.minBet || 0, DUST);
    const maxCeil = c.maxBet && c.maxBet > 0 ? c.maxBet : Infinity;
    const limitCeil =
      c.transactionLimit && c.transactionLimit > 0 ? c.transactionLimit : Infinity;
    let blocked: string | null = null;
    if (stake < effectiveMin) blocked = `Hedge stake ${stake} below min bet ${effectiveMin}`;
    else if (stake > maxCeil) blocked = `Hedge stake ${stake} exceeds max bet ${maxCeil}`;
    else if (stake > limitCeil) blocked = `Hedge stake ${stake} exceeds your limit`;

    return { bet, lockedValue, resultingExposure, availableSize, blocked };
  };

  // Each runner is a candidate "odd one out" — valid only when every OTHER
  // runner already shares a common exposure (so one bet can level the book).
  for (const target of runners) {
    const others = runners.filter((r) => r.selectionId !== target.selectionId);
    const otherExps = others.map((r) => exposure[r.selectionId]);
    if (Math.max(...otherExps) - Math.min(...otherExps) > EPS) continue; // others not equal
    const common = otherExps[0];
    const Etarget = exposure[target.selectionId];
    const spread = Math.abs(Etarget - common);
    if (spread < EPS) continue; // target already level with the rest — nothing to do

    if (Etarget > common) {
      // Lay the odd runner down to meet the others.
      if (target.bestLay && target.bestLay.price > 1) {
        candidates.push(buildCandidate(target, "lay", target.bestLay.price, target.bestLay.size, spread));
      }
    } else {
      // Back the odd runner up to meet the others.
      if (target.bestBack && target.bestBack.price > 1) {
        candidates.push(buildCandidate(target, "back", target.bestBack.price, target.bestBack.size, spread));
      }
    }
  }

  if (candidates.length === 0) {
    return { available: false, reason: "No single-bet cashout available", currentExposure: exposure };
  }

  const placeable = candidates.filter((k) => k.blocked === null);
  if (placeable.length === 0) {
    // Surface the reason from the option that locked the best value.
    const best = candidates.sort((x, y) => y.lockedValue - x.lockedValue)[0];
    return { available: false, reason: best.blocked ?? "Cashout unavailable", currentExposure: exposure };
  }

  // Best placeable = highest guaranteed value (least loss / most profit).
  const winner = placeable.sort((x, y) => y.lockedValue - x.lockedValue)[0];
  return {
    available: true,
    bet: winner.bet,
    lockedValue: winner.lockedValue,
    resultingExposure: winner.resultingExposure,
    currentExposure: exposure,
  };
}
