"use client";

import { Timer, RefreshCw, BarChart3, ArrowDown } from "lucide-react";
import {
  toDecimalOdds,
  toDecimalfancyOdds,
} from "@/components/sports/quick-bet-panel";

/**
 * TOMEXCH bespoke match-detail market view — the modern card design (Match Odds /
 * Line Market / Fancy Market) from the reference. PRESENTATION ONLY: it receives
 * the live markets, exposure maps and the page's back/lay click handlers as props
 * and re-renders them — so odds, live updates and bet placement behave exactly as
 * on the shared page; only the look differs. Rendered by the match page when the
 * tomexch theme is active.
 */

type BetClick = (
  market: any,
  runner: any,
  odds: number | string,
  run?: string | null,
  priceIndex?: number,
  isRawOdds?: boolean
) => void;

interface TomexchMarketsProps {
  markets: any[];
  marketExposureMap?: Map<string, Map<string, number>>;
  fancyExposureMap?: Map<string, number>;
  /** Live preview P&L per runner while a bet is being entered (active market). */
  previewExposure?: { marketId: string; runners: Map<string, number> } | null;
  onBack: BetClick;
  onLay: BetClick;
}

/* ── formatters (copied from the shared page so behaviour is identical) ──────── */
const formatOddsPrice = (price: number | string | null | undefined): string => {
  if (price == null) return "0";
  const num = parseFloat(String(price));
  if (isNaN(num)) return "0";
  const dp = num < 0.1 ? 3 : 2;
  return parseFloat(num.toFixed(dp)).toString();
};
const formatAmount = (amount: number): string => {
  if (!amount) return "0";
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
};
const formatMatched = (n: any): string => {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return "0";
  return num.toLocaleString("en-IN");
};

/* ── one odds price box ──────────────────────────────────────────────────────── */
function OddsCell({
  price,
  size,
  side,
  best,
  disabled,
  onClick,
}: {
  price?: any;
  size?: any;
  side: "back" | "lay";
  best?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const empty = price == null || disabled;
  const base =
    "flex h-12 w-[5.25rem] shrink-0 flex-col items-center justify-center rounded-lg leading-tight transition-all";
  // Glossy gradients + an inset top highlight for the "shiny" look.
  const shine = "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.12)]";
  const tone = empty
    ? "cursor-not-allowed border border-slate-400 bg-slate-100"
    : best
      ? side === "back"
        ? `cursor-pointer bg-gradient-to-b from-[#7cbbe8] to-[#4a97d8] ${shine} hover:brightness-105`
        : `cursor-pointer bg-gradient-to-b from-[#f9bbd4] to-[#ee87b2] ${shine} hover:brightness-105`
      : side === "back"
        ? `cursor-pointer border border-slate-400 bg-gradient-to-b from-white to-[#e7f1fa] ${shine} hover:to-[#d8eafc]`
        : `cursor-pointer border border-slate-400 bg-gradient-to-b from-white to-[#fdebf3] ${shine} hover:to-[#fbdcea]`;
  return (
    <button
      type="button"
      disabled={empty}
      onClick={onClick}
      className={`${base} ${tone}`}
    >
      <span className="text-[15px] font-bold tabular-nums text-slate-900 sm:text-base">
        {empty ? "-" : price}
      </span>
      <span className="text-[11px] font-semibold text-slate-600">
        {empty ? "" : size}
      </span>
    </button>
  );
}

/* ── card header (name + Ladder badge | timer + Rules) ───────────────────────── */
function CardHead({
  title,
  badge,
  badgeColor = "amber",
  betDelay,
  refresh,
}: {
  title: string;
  badge?: string;
  badgeColor?: "amber" | "blue";
  betDelay?: number | null;
  refresh?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="flex items-center gap-2">
        {badgeColor === "blue" ? (
          <span className="rounded-md bg-[#2f6bb0] px-2.5 py-1 text-sm font-bold text-white">
            {title}
          </span>
        ) : (
          <span className="text-[17px] font-bold text-slate-800">{title}</span>
        )}
        {badge && (
          <span className="rounded bg-[#f0a830] px-2 py-0.5 text-xs font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {betDelay != null && (
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-500">
            <Timer className="h-4 w-4" />
            {betDelay}s
          </span>
        )}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-[#2f6bb0] px-3 py-1 text-sm font-semibold text-[#2f6bb0] hover:bg-[#eaf3fb]"
        >
          {refresh && <RefreshCw className="h-3.5 w-3.5" />}
          Rules
        </button>
      </div>
    </div>
  );
}

/* ── Match Odds / Bookmaker card (3 back + 3 lay) ────────────────────────────── */
function OddsMarketCard({
  market,
  exposure,
  preview,
  onBack,
  onLay,
}: {
  market: any;
  exposure?: Map<string, number>;
  /** Per-runner preview P&L (set only while a bet is being entered here). */
  preview?: Map<string, number>;
  onBack: BetClick;
  onLay: BetClick;
}) {
  const suspended = market.status === "SUSPENDED" || !!market.sportingEvent;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHead
        title={market.marketName}
        badge="Ladder"
        betDelay={market.marketCondition?.betDelay ?? null}
      />

      {/* MATCHED total */}
      <div className="px-3 pb-0.5 text-[13px] font-bold text-slate-700">
        MATCHED:{formatMatched(market.totalMatched)}
      </div>

      {/* Column header: Level Profit | Back | Lay — each box has its OWN coloured
          line (segmented, with gaps between), label + arrow over the best cell. */}
      <div className="flex items-stretch gap-0.5 px-3">
        <div className="flex-1" />
        {/* Back group — per-cell blue line, "Back ⬇" over the best (rightmost) */}
        <div className="flex items-stretch gap-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex w-[5.25rem] shrink-0 flex-col justify-end ${i !== 2 ? "hidden sm:flex" : ""}`}
            >
              {i === 2 && (
                <div className="flex items-center justify-center gap-1 text-[15px] font-bold text-slate-800">
                  Back
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3f9be0] text-white">
                    <ArrowDown className="h-3 w-3" strokeWidth={3} />
                  </span>
                </div>
              )}
              <div className="mt-0.5 h-[3px] rounded-full bg-[#3f9be0]" />
            </div>
          ))}
        </div>
        {/* Lay group — per-cell pink line, "Lay ⬇" over the best (leftmost) */}
        <div className="flex items-stretch gap-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex w-[5.25rem] shrink-0 flex-col justify-end ${i !== 0 ? "hidden sm:flex" : ""}`}
            >
              {i === 0 && (
                <div className="flex items-center justify-center gap-1 text-[15px] font-bold text-slate-800">
                  Lay
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef8cb5] text-white">
                    <ArrowDown className="h-3 w-3" strokeWidth={3} />
                  </span>
                </div>
              )}
              <div className="mt-0.5 h-[3px] rounded-full bg-[#ef8cb5]" />
            </div>
          ))}
        </div>
      </div>

      {/* Runner rows */}
      <div className="divide-y divide-slate-400">
        {market.runners?.map((runner: any) => {
          const rSusp =
            suspended ||
            runner.status === "SUSPENDED" ||
            runner.status === "REMOVED";
          // Live preview P&L (while entering a bet here) overrides the settled
          // exposure, matching the shared page's per-runner exposure display.
          const rid = String(runner.selectionId);
          const pnl = preview ? preview.get(rid) ?? null : exposure?.get(rid) ?? null;
          // back: best (index 0) sits adjacent to lay → render back[2],back[1],back[0]
          const back: any[] = [null, null, null];
          (runner.back ?? []).slice(0, 3).forEach((it: any, i: number) => {
            back[2 - i] = it;
          });
          const lay: any[] = (runner.lay ?? []).slice(0, 3);
          return (
            <div
              key={runner.selectionId}
              className="relative flex items-center gap-0.5 px-3 py-1.5"
            >
              {/* Name + P&L */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0 text-[#2f6bb0]" />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold text-slate-800">
                    {runner.name}
                  </div>
                  {pnl != null && pnl !== 0 && (
                    <div
                      className={`text-xs font-semibold ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {pnl >= 0 ? pnl.toFixed(0) : `(${Math.abs(pnl).toFixed(0)})`}
                    </div>
                  )}
                </div>
              </div>

              {/* Odds area (Back + Lay) — relative wrapper so the suspended box
                  covers ONLY the cells (centered), for any number of columns. */}
              <div className="relative flex shrink-0 items-stretch gap-0.5">
                {/* Back (3) */}
                <div className="flex shrink-0 gap-0.5">
                  {back.map((it, i) => (
                    <div key={`b${i}`} className={i !== 2 ? "hidden sm:block" : ""}>
                      <OddsCell
                        side="back"
                        best={i === 2}
                        disabled={rSusp || !it}
                        price={it ? formatOddsPrice(it.price) : null}
                        size={it ? formatAmount(it.size) : ""}
                        onClick={
                          it
                            ? () =>
                                onBack(
                                  market,
                                  runner,
                                  toDecimalOdds(it.price, market.provider, market.marketType),
                                  null,
                                  2 - i
                                )
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Lay (3) */}
                <div className="flex shrink-0 gap-0.5">
                  {[0, 1, 2].map((i) => {
                    const it = lay[i];
                    return (
                      <div key={`l${i}`} className={i !== 0 ? "hidden sm:block" : ""}>
                        <OddsCell
                          side="lay"
                          best={i === 0}
                          disabled={rSusp || !it}
                          price={it ? formatOddsPrice(it.price) : null}
                          size={it ? formatAmount(it.size) : ""}
                          onClick={
                            it
                              ? () =>
                                  onLay(
                                    market,
                                    runner,
                                    toDecimalOdds(it.price, market.provider, market.marketType),
                                    null,
                                    i
                                  )
                              : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                {rSusp && (
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-lg border-2 px-2 text-center text-[13px] font-bold uppercase tracking-wide text-[#e0232e] sm:text-[15px]"
                    style={{
                      borderColor: "#ec8aa3",
                      background: "linear-gradient(90deg,#fdf1f5 0%,#ffffff 55%,#eef6fd 100%)",
                    }}
                  >
                    {market.sportingEvent ? "Ball Running" : "Suspended"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Fancy / Session card (No / Yes) ─────────────────────────────────────────── */
const FANCY_TABS = ["All", "Session", "W/P", "Extra", "Others", "Ball By Ball"];

function FancyCard({
  markets,
  onBack,
  onLay,
}: {
  markets: any[];
  onBack: BetClick;
  onLay: BetClick;
}) {
  // Real bet-delay from the markets (no hardcoded value).
  const betDelay = markets[0]?.marketCondition?.betDelay ?? null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHead title="Fancy Market" badgeColor="blue" betDelay={betDelay} />

      {/* Filter pills (visual) */}
      <div className="flex flex-wrap gap-2 px-3 pb-3">
        {FANCY_TABS.map((t, i) => (
          <span
            key={t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              i === 0
                ? "bg-[#2f6bb0] text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="px-3 pb-1 text-[13px] font-bold text-[#2f6bb0]">SESSION</div>

      {/* No / Yes column labels */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 pb-1">
        <span className="flex-1" />
        <span className="w-[4.5rem] text-center text-[15px] font-bold text-[#d56a9c] sm:w-20">
          No
        </span>
        <span className="w-[4.5rem] text-center text-[15px] font-bold text-[#2f6bb0] sm:w-20">
          Yes
        </span>
        <span className="hidden w-32 sm:block" />
      </div>

      <div className="divide-y divide-slate-400">
        {markets.map((market) =>
          (market.runners ?? []).map((runner: any) => {
            const susp = market.status === "SUSPENDED" || !!market.sportingEvent;
            const no = runner.lay?.[0];
            const yes = runner.back?.[0];
            return (
              <div
                key={`${market.marketId}-${runner.selectionId}`}
                className="flex items-center gap-2 px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-800">
                  {market.marketName}
                </span>

                {susp ? (
                  /* Ball Running / Suspended — a pink-bordered red box spanning
                     the No + Yes columns (the reference look). */
                  <div
                    className="flex h-12 w-[11rem] shrink-0 items-center justify-center rounded-lg border-2 px-2 text-center text-[13px] font-bold uppercase tracking-wide text-[#e0232e] sm:text-[15px]"
                    style={{
                      borderColor: "#ec8aa3",
                      background: "linear-gradient(90deg,#fdf1f5 0%,#ffffff 55%,#eef6fd 100%)",
                    }}
                  >
                    {market.sportingEvent ? "Ball Running" : "Suspended"}
                  </div>
                ) : (
                  <>
                    {/* No (lay) — shows the line, with size below */}
                    <OddsCell
                      side="lay"
                      best
                      disabled={!no}
                      price={no?.line ?? null}
                      size={no ? formatAmount(no.price) : ""}
                      onClick={
                        no
                          ? () =>
                              onLay(
                                market,
                                runner,
                                toDecimalfancyOdds(no.price, market.provider),
                                String(no.line ?? ""),
                                0
                              )
                          : undefined
                      }
                    />
                    {/* Yes (back) */}
                    <OddsCell
                      side="back"
                      best
                      disabled={!yes}
                      price={yes?.line ?? null}
                      size={yes ? formatAmount(yes.price) : ""}
                      onClick={
                        yes
                          ? () =>
                              onBack(
                                market,
                                runner,
                                toDecimalfancyOdds(yes.price, market.provider),
                                String(yes.line ?? ""),
                                0
                              )
                          : undefined
                      }
                    />
                  </>
                )}

                <span className="hidden w-32 text-right text-[11px] italic leading-tight text-slate-500 sm:block">
                  Min Bet: {market.marketCondition?.minBet ?? "-"}
                  <br />
                  Max Bet: {market.marketCondition?.maxBet ?? "-"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function TomexchMarkets({
  markets,
  marketExposureMap,
  previewExposure,
  onBack,
  onLay,
}: TomexchMarketsProps) {
  const oddsMarkets = markets.filter((m) => m.bettingType !== "LINE");
  const lineMarkets = markets.filter((m) => m.bettingType === "LINE");

  return (
    <div className="space-y-1">
      {oddsMarkets.map((market) => (
        <OddsMarketCard
          key={market.marketId}
          market={market}
          exposure={marketExposureMap?.get(String(market.marketId))}
          preview={
            previewExposure?.marketId === String(market.marketId)
              ? previewExposure.runners
              : undefined
          }
          onBack={onBack}
          onLay={onLay}
        />
      ))}

      {lineMarkets.length > 0 && (
        <FancyCard markets={lineMarkets} onBack={onBack} onLay={onLay} />
      )}
    </div>
  );
}
