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
 * Compute the best placeable full cashout for a 2-runner Match Odds market.
 */
export function computeMatchOddsCashout(
  runners: RunnerPrice[],
  c: CashoutConstraints,
): CashoutResult {
  if (runners.length !== 2) {
    return { available: false, reason: "Cashout supports 2-runner Match Odds only" };
  }

  const exposure: Record<string, number> = {};
  for (const r of runners) exposure[r.selectionId] = r.exposure ?? 0;

  const [a, b] = runners;
  const Ea = exposure[a.selectionId];
  const Eb = exposure[b.selectionId];

  if (Ea === 0 && Eb === 0) {
    return { available: false, reason: "No open position", currentExposure: exposure };
  }
  if (Math.abs(Ea - Eb) < 0.01) {
    return { available: false, reason: "Position already balanced", currentExposure: exposure };
  }

  const high = Ea > Eb ? a : b; // higher exposure -> lay it down
  const low = Ea > Eb ? b : a; // lower exposure -> back it up
  const spread = Math.abs(Ea - Eb); // (Ehigh - Elow) > 0

  const candidates: Candidate[] = [];

  const buildCandidate = (
    runner: RunnerPrice,
    side: "back" | "lay",
    price: number,
    availableSize: number,
  ): Candidate => {
    // Stake that exactly flattens: spread / odds (same form for both sides).
    const rawStake = spread / price;
    const stake = round2(rawStake);
    const bet: CashoutBet = { selectionId: runner.selectionId, side, odds: price, stake };
    const resultingExposure = applyHedge(exposure, runners, bet);
    const lockedValue = round2(Math.min(...Object.values(resultingExposure)));

    const limitCeil =
      c.transactionLimit && c.transactionLimit > 0 ? c.transactionLimit : Infinity;
    let blocked: string | null = null;
    if (stake < c.minBet) blocked = `Hedge stake ${stake} below min bet ${c.minBet}`;
    else if (stake > c.maxBet) blocked = `Hedge stake ${stake} exceeds max bet ${c.maxBet}`;
    else if (stake > limitCeil) blocked = `Hedge stake ${stake} exceeds your limit`;
    else if (stake > availableSize) blocked = `Not enough liquidity (${availableSize} available)`;

    return { bet, lockedValue, resultingExposure, availableSize, blocked };
  };

  // Option 1: LAY the higher-exposure runner at its best lay price.
  if (high.bestLay && high.bestLay.price > 1) {
    candidates.push(buildCandidate(high, "lay", high.bestLay.price, high.bestLay.size));
  }
  // Option 2: BACK the lower-exposure runner at its best back price.
  if (low.bestBack && low.bestBack.price > 1) {
    candidates.push(buildCandidate(low, "back", low.bestBack.price, low.bestBack.size));
  }

  if (candidates.length === 0) {
    return { available: false, reason: "No price available to hedge", currentExposure: exposure };
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
