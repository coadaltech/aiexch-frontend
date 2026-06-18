"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveMarketsDetails, useLiveMarketsPnl, useLiveMarketsBets } from "@/hooks/useOwner";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { Activity, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatAmount(v: number) {
  if (!v) return "0";
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
}

function pnlColor(v: number) {
  return v > 0 ? "text-green-600" : v < 0 ? "text-red-600" : "text-gray-400";
}

function fmt(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

function fmtNum(v: string | number | null | undefined) {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? "0.00" : n.toFixed(2);
}

const MARKET_TYPE_LABELS: Record<number, string> = {
  0: "Match Odds",
  1: "Tied Match",
  2: "Complete Match",
  3: "Bookmaker",
  4: "Fancy",
};

const ROLE_LABELS: Record<number, string> = {
  0: "Owner",
  3: "Admin",
  4: "Super",
  5: "Master",
  6: "Agent",
  7: "User",
};

function normalizeBookmakers(bookmakers: any[]): any[] {
  if (!bookmakers?.length) return [];
  return bookmakers
    .filter((bm) => {
      const st = bm.odds?.status || "";
      return st !== "CLOSED" && st !== "INACTIVE";
    })
    .map((bm) => {
      const odds = bm.odds;
      const st = odds?.status || "OPEN";
      return {
        marketId: bm.marketId,
        marketName: bm.marketName || odds?.mname || "Bookmaker",
        bettingType: "BOOKMAKER",
        status: st === "SUSPENDED" ? "SUSPENDED" : st,
        sportingEvent: false,
        marketCondition: {
          minBet: parseFloat(odds?.min || "100"),
          maxBet: parseFloat(odds?.max || "50000"),
        },
        runners: (odds?.runners || []).map((r: any) => ({
          selectionId: r.selectionId,
          name: r.runnerName,
          status: r.status || "ACTIVE",
          back: r.back?.map((b: any) => ({ price: b.price, size: parseFloat(b.size) || 0 })) || null,
          lay: r.lay?.map((l: any) => ({ price: l.price, size: parseFloat(l.size) || 0 })) || null,
        })),
      };
    });
}

function normalizeSessions(sessions: any[]): any[] {
  if (!sessions?.length) return [];
  return sessions
    .filter((s) => {
      const gs = (s.GameStatus || "").toUpperCase();
      return gs !== "CLOSED" && gs !== "INACTIVE" && gs !== "COMPLETE";
    })
    .map((s) => {
      const isSuspended = (s.GameStatus || "").toUpperCase() === "SUSPENDED";
      const isBallRunning = s.GameStatus === "Ball Running" || s.GameStatus === "BALL RUNNING" || s.ballsess === 1;
      const st = isSuspended || isBallRunning ? "SUSPENDED" : "OPEN";
      return {
        marketId: String(s.SelectionId),
        marketName: s.RunnerName,
        bettingType: "LINE",
        status: st,
        sportingEvent: isBallRunning,
        marketCondition: { minBet: parseFloat(s.min || "100"), maxBet: parseFloat(s.max || "25000") },
        runners: [{
          selectionId: s.SelectionId,
          name: s.RunnerName,
          status: st,
          back: s.BackPrice1 ? [{ line: s.BackPrice1, price: s.BackSize1 || 100 }] : null,
          lay: s.LayPrice1 ? [{ line: s.LayPrice1, price: s.LaySize1 || 100 }] : null,
        }],
      };
    });
}

// ─── Shared odds-cell styling — mirrors components/sports/market-card.tsx ─────
// so the owner monitoring view shows the exact same odds cells as the public
// match page (just read-only — no click / quick-bet).

const oddsBtnBase =
  "flex-1 min-w-0 px-1 py-1 flex flex-col items-center justify-center rounded-md leading-tight transition-all duration-150";
const oddsPriceClass = "text-gray-900 font-bold text-base sm:text-lg";
const oddsSizeClass = "text-gray-900 font-bold text-[12px] sm:text-[14px]";

function formatOddsPrice(price: number | string | null | undefined): string {
  if (price == null) return "0";
  const num = parseFloat(String(price));
  if (isNaN(num)) return "0";
  const dp = num < 0.1 ? 3 : 2;
  return parseFloat(num.toFixed(dp)).toString();
}

// ─── Suspended overlay ───────────────────────────────────────────────────────

function backLayOverlay(market: any) {
  const show = market?.sportingEvent || market?.status === "SUSPENDED";
  if (!show) return null;
  const label = market?.status === "SUSPENDED" ? "Suspended" : "Ball Running";
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 cursor-not-allowed bg-white/70 backdrop-blur-[1px]">
      <span className="text-danger-strong font-bold text-xs sm:text-sm bg-red-50 px-3 py-1 rounded-full border border-red-200/50 shadow-sm">
        {label}
      </span>
    </div>
  );
}

// ─── Odds / Bookmaker market ─────────────────────────────────────────────────

function OddsMarket({
  market,
  oddsExposureMap,
}: {
  market: any;
  oddsExposureMap: Map<string, Map<string, number>>;
}) {
  const runnerPnlMap = oddsExposureMap.get(String(market.marketId));
  const isMarketSusp = market.status === "SUSPENDED" || !!market.sportingEvent;
  const minBet = market.marketCondition?.minBet ?? "-";
  const maxBet = market.marketCondition?.maxBet ?? "-";

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-[var(--header-primary)]">
        <h3 className="min-w-0 font-bold text-[var(--header-text)] text-sm sm:text-base leading-tight flex-1 break-words">
          {market.marketName}
        </h3>
        <span className="shrink-0 text-[var(--header-text)]/70 text-xs sm:text-sm whitespace-nowrap hidden md:block">
          Min: {minBet} / Max: {maxBet}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {market.runners.map((runner: any) => {
          const runnerId = String(runner.selectionId);
          const pnl = runnerPnlMap?.get(runnerId) ?? null;
          const isRunnerSuspended =
            runner.status === "SUSPENDED" || runner.status === "REMOVED" || isMarketSusp;
          return (
            <div
              key={runner.selectionId}
              className="px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center bg-white"
            >
              <div className="min-w-0 pr-1 flex flex-col gap-0.5">
                <span className="text-gray-900 font-bold text-sm sm:text-base block leading-tight truncate">
                  {runner.name}
                </span>
                {pnl !== null && (
                  <span className={`text-[10px] sm:text-xs font-bold leading-tight ${pnlColor(pnl)}`}>
                    {fmt(pnl)}
                  </span>
                )}
              </div>
              <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                {/* Back */}
                <div className="flex-1 flex flex-col items-end min-w-0">
                  <div className="gap-1 flex justify-end items-center flex-wrap">
                    {(() => {
                      if (isRunnerSuspended) {
                        return Array(3).fill(null).map((_, posIdx) => (
                          <div
                            key={`bs-${posIdx}`}
                            className={`${oddsBtnBase} bg-back-disabled w-24 ${posIdx !== 2 ? "hidden sm:flex" : ""}`}
                          >
                            <span className={oddsPriceClass}>0</span>
                            <span className={oddsSizeClass}>0</span>
                          </div>
                        ));
                      }
                      const backItems = runner.back || [];
                      const positions = Array(3).fill(null);
                      backItems.forEach((item: any, idx: number) => { if (idx < 3) positions[2 - idx] = item; });
                      return positions.map((item, posIdx) =>
                        item ? (
                          <div
                            key={`b-${posIdx}`}
                            className={`${oddsBtnBase} w-24 ${
                              posIdx === 2
                                ? "bg-gradient-to-b from-back to-back-deep shadow-sm"
                                : "bg-white border border-back/50 hidden sm:flex"
                            }`}
                          >
                            <span className={oddsPriceClass}>{formatOddsPrice(item.price)}</span>
                            <span className={oddsSizeClass}>{formatAmount(item.size)}</span>
                          </div>
                        ) : (
                          <div
                            key={`be-${posIdx}`}
                            className={`${oddsBtnBase} bg-back-disabled w-24 ${posIdx !== 2 ? "hidden sm:flex" : ""}`}
                          >
                            <span className={oddsPriceClass}>-</span>
                            <span className={oddsSizeClass}>-</span>
                          </div>
                        )
                      );
                    })()}
                  </div>
                </div>
                {/* Lay */}
                <div className="flex-1 flex flex-col items-start min-w-0">
                  <div className="gap-1 flex justify-start items-center flex-wrap">
                    {isRunnerSuspended ? (
                      Array(3).fill(null).map((_, idx) => (
                        <div
                          key={`ls-${idx}`}
                          className={`${oddsBtnBase} bg-lay-disabled w-24 ${idx !== 0 ? "hidden sm:flex" : ""}`}
                        >
                          <span className={oddsPriceClass}>0</span>
                          <span className={oddsSizeClass}>0</span>
                        </div>
                      ))
                    ) : (
                      <>
                        {runner.lay && runner.lay.length > 0
                          ? runner.lay.map((layItem: any, layIdx: number) => (
                              <div
                                key={`l-${layIdx}`}
                                className={`${oddsBtnBase} w-24 ${
                                  layIdx === 0
                                    ? "bg-gradient-to-b from-lay to-lay-deep shadow-sm"
                                    : "bg-white border border-lay/50 hidden sm:flex"
                                }`}
                              >
                                <span className={oddsPriceClass}>
                                  {layItem.price ? formatOddsPrice(layItem.price) : "0"}
                                </span>
                                <span className={oddsSizeClass}>{formatAmount(layItem.size)}</span>
                              </div>
                            ))
                          : null}
                        {Array.from({ length: Math.max(0, 3 - (runner.lay?.length || 0)) }).map((_, emptyIdx) => {
                          const hasLay = (runner.lay?.length || 0) > 0;
                          const hideOnMobile = hasLay || emptyIdx > 0;
                          return (
                            <div
                              key={`le-${emptyIdx}`}
                              className={`${oddsBtnBase} bg-lay-disabled w-24 ${hideOnMobile ? "hidden sm:flex" : ""}`}
                            >
                              <span className={oddsPriceClass}>-</span>
                              <span className={oddsSizeClass}>-</span>
                            </div>
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
    </div>
  );
}

// ─── Fancy markets ───────────────────────────────────────────────────────────

function FancyMarket({
  market,
  fancyExposureMap,
}: {
  market: any;
  fancyExposureMap: Map<string, number>;
}) {
  const pnl = fancyExposureMap.get(String(market.marketId)) ?? null;
  const isMarketSusp = market.status === "SUSPENDED" || !!market.sportingEvent;
  const runners: any[] = market.runners || [];
  const visibleRunners = isMarketSusp
    ? runners
    : runners.filter((r: any) => r.status !== "SUSPENDED" && r.status !== "REMOVED");
  if (!visibleRunners.length) return null;

  const midIdx = Math.floor((visibleRunners.length - 1) / 2);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-2 sm:px-3 py-1 border-b border-[#1e4088]/40 bg-[var(--header-primary)]">
        <h3 className="min-w-0 font-bold text-[var(--header-text)] text-sm sm:text-base leading-tight flex-1 break-words">
          {market.marketName}
        </h3>
      </div>
      <div className="border-b border-gray-100 last:border-b-0 bg-white">
        {visibleRunners.map((runner: any, runnerIdx: number) => {
          const showLabel = runnerIdx === midIdx;
          return (
            <div
              key={runner.selectionId}
              className={`px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-2 items-center bg-white${visibleRunners.length > 1 ? " py-0.5" : ""}`}
            >
              {showLabel ? (
                <div className="min-w-0 pr-1 flex flex-col gap-0.5">
                  <span className="text-gray-900 font-bold text-sm sm:text-base block leading-tight">
                    {market.marketName}
                  </span>
                  {pnl !== null && (
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight ${pnlColor(pnl)}`}>
                      {fmt(pnl)}
                    </span>
                  )}
                </div>
              ) : (
                <div />
              )}
              <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
                {/* No (lay) */}
                <div className="flex-1 flex flex-col items-end min-w-0">
                  <div className="gap-1 flex justify-end items-center flex-wrap">
                    {isMarketSusp ? (
                      <div className={`${oddsBtnBase} bg-back-disabled w-24`}>
                        <span className={oddsPriceClass}>0</span>
                        <span className={oddsSizeClass}>0</span>
                      </div>
                    ) : runner.lay?.length > 0 ? (
                      runner.lay.map((layItem: any, layIdx: number) => (
                        <div
                          key={layIdx}
                          className={`${oddsBtnBase} bg-gradient-to-b from-lay to-lay-deep shadow-sm w-24`}
                        >
                          <span className={oddsPriceClass}>{layItem.line}</span>
                          <span className={oddsSizeClass}>{formatAmount(layItem.price)}</span>
                        </div>
                      ))
                    ) : (
                      <div className={`${oddsBtnBase} bg-lay-disabled w-24`}>
                        <span className={oddsPriceClass}>-</span>
                        <span className={oddsSizeClass}>-</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Yes (back) + limits */}
                <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                  <div className="gap-1 flex justify-start items-center flex-wrap min-w-0">
                    {isMarketSusp ? (
                      <div className={`${oddsBtnBase} bg-back-disabled w-24`}>
                        <span className={oddsPriceClass}>0</span>
                        <span className={oddsSizeClass}>0</span>
                      </div>
                    ) : runner.back?.length > 0 ? (
                      runner.back.map((backItem: any, backIdx: number) => (
                        <div
                          key={backIdx}
                          className={`${oddsBtnBase} w-24 ${
                            backIdx === 0
                              ? "bg-gradient-to-b from-back to-back-deep shadow-sm"
                              : "bg-white border border-back/50"
                          }`}
                        >
                          <span className={oddsPriceClass}>{backItem.line}</span>
                          <span className={oddsSizeClass}>{formatAmount(backItem.price)}</span>
                        </div>
                      ))
                    ) : (
                      <div className={`${oddsBtnBase} bg-lay-disabled w-24`}>
                        <span className={oddsPriceClass}>-</span>
                        <span className={oddsSizeClass}>-</span>
                      </div>
                    )}
                  </div>
                  {showLabel && (
                    <div className="hidden sm:flex flex-col text-xs text-black font-bold leading-tight text-right shrink-0">
                      <span>Max:{market.marketCondition?.maxBet ?? "-"}</span>
                    </div>
                  )}
                </div>
                {backLayOverlay(market)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: "Soccer",
  2: "Tennis",
  4: "Cricket",
};

function eventTypeLabel(id: number) {
  return EVENT_TYPE_LABELS[id] ?? `Sport ${id}`;
}

type DbMarket = { market_id: string; market_name: string; market_type: number };
type MatchGroup = {
  matchId: string;
  eventTypeId: string;
  eventName: string;
  competitionId: string;
  competitionName: string;
  markets: DbMarket[];
};

type EventTypeGroup = {
  eventTypeId: number;
  matches: MatchGroup[];
};

// ─── Bet Detail Modal ────────────────────────────────────────────────────────

function BetDetailModal({
  bet,
  onClose,
}: {
  bet: any;
  onClose: () => void;
}) {
  const stake = parseFloat(bet.stake ?? 0);
  const potReturn = parseFloat(bet.potential_return ?? 0);
  const potProfit = potReturn - stake;        // user's profit if they win (back bet)
  const isBack = bet.bet_type === 0;

  // Build hierarchy rows: owner at top, agent at bottom
  // each level's NET share = cumulative_percent - next_lower_percent
  const ownerPct  = parseFloat(bet.owner_percent  ?? 0);
  const adminPct  = parseFloat(bet.admin_percent  ?? 0);
  const superPct  = parseFloat(bet.super_percent  ?? 0);
  const masterPct = parseFloat(bet.master_percent ?? 0);
  const agentPct  = parseFloat(bet.agent_percent  ?? 0);

  type HRow = {
    role: string;
    username: string | null;
    id: string | null;
    cumPct: number;
    netPct: number;
  };

  const hierarchyRows: HRow[] = [
    { role: "Owner",  username: bet.owner_name,  id: bet.owner_id,  cumPct: ownerPct,  netPct: ownerPct  - adminPct  },
    { role: "Admin",  username: bet.admin_name,  id: bet.admin_id,  cumPct: adminPct,  netPct: adminPct  - superPct  },
    { role: "Super",  username: bet.super_name,  id: bet.super_id,  cumPct: superPct,  netPct: superPct  - masterPct },
    { role: "Master", username: bet.master_name, id: bet.master_id, cumPct: masterPct, netPct: masterPct - agentPct  },
    { role: "Agent",  username: bet.agent_name,  id: bet.agent_id,  cumPct: agentPct,  netPct: agentPct             },
  ].filter((r) => r.id);                        // hide levels not present in chain

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${isBack ? "bg-[#72bbef] text-black" : "bg-[#faa9ba] text-black"}`}>
              {isBack ? "BACK" : "LAY"}
            </span>
            Bet Details
          </DialogTitle>
        </DialogHeader>

        {/* ── Event & Market ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Event & Market</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Row label="Event"       value={bet.event_name       ?? "—"} />
            <Row label="Competition" value={bet.competition_name ?? "—"} />
            <Row label="Market"      value={bet.market_name      ?? "—"} />
            <Row label="Market Type" value={MARKET_TYPE_LABELS[bet.market_type] ?? bet.market_type} />
            <Row label="Selection"   value={bet.selection_name   ?? "—"} />
            {bet.run != null && bet.run !== 0 && <Row label="Run" value={String(bet.run)} />}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* ── Bet Info ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Bet Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Row label="Stake"             value={`₹ ${fmtNum(bet.stake)}`} />
            <Row label="Odds"              value={fmtNum(bet.odds)} />
            <Row label="Potential Return"  value={`₹ ${fmtNum(bet.potential_return)}`} />
            <Row label="Potential Profit"  value={`₹ ${fmtNum(potProfit)}`} valueClass={potProfit >= 0 ? "text-green-600" : "text-red-600"} />
            <Row label="Status"            value={bet.status ?? "—"} />
            {bet.settled_amount != null && (
              <Row label="Settled Amount"  value={`₹ ${fmtNum(bet.settled_amount)}`} />
            )}
            <Row label="Placed At"         value={bet.matched_at ? new Date(bet.matched_at).toLocaleString() : "—"} />
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* ── User & Whitelabel ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">User & Whitelabel</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Row label="Username"   value={bet.user_name      ?? "—"} />
            <Row label="Whitelabel" value={bet.whitelabel_name ?? "—"} />
            {bet.ip_address && <Row label="IP Address" value={bet.ip_address} />}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* ── Hierarchy P&L ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Commission Hierarchy &amp; P&amp;L Exposure</p>
          <p className="text-[10px] text-gray-400 mb-2">
            Exposure = what each level stands to lose if the user wins this bet.
          </p>
          <div className="rounded border border-gray-200 overflow-hidden text-xs">
            <div className="grid grid-cols-4 bg-gray-50 px-3 py-1.5 font-semibold text-gray-600 text-[11px]">
              <span>Role</span>
              <span>Username</span>
              <span className="text-right">Net Share %</span>
              <span className="text-right">Exposure</span>
            </div>
            {hierarchyRows.map((row) => {
              const exposure = -(potProfit * row.netPct / 100);
              return (
                <div
                  key={row.role}
                  className="grid grid-cols-4 px-3 py-1.5 border-t border-gray-100 items-center"
                >
                  <span className="font-medium text-gray-700">{row.role}</span>
                  <span className="text-gray-600 truncate">{row.username ?? "—"}</span>
                  <span className="text-right text-gray-700">{row.netPct.toFixed(2)}%</span>
                  <span className={cn("text-right font-semibold", exposure >= 0 ? "text-green-600" : "text-red-600")}>
                    {exposure >= 0 ? "+" : ""}₹{Math.abs(exposure).toFixed(2)}
                  </span>
                </div>
              );
            })}
            {hierarchyRows.length === 0 && (
              <div className="px-3 py-3 text-center text-gray-400 text-xs">No hierarchy data</div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Positive = gain if user loses · Negative = loss if user wins
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className={cn("font-medium text-gray-900 truncate", valueClass)}>{value}</span>
    </div>
  );
}

// ─── Bets Panel ──────────────────────────────────────────────────────────────

function BetsPanel({ matchId }: { matchId: string }) {
  const { data: bets, isLoading, isError, isFetching, refetch } = useLiveMarketsBets(matchId);
  const [selectedBet, setSelectedBet] = useState<any | null>(null);

  const betList: any[] = Array.isArray(bets) ? bets : [];

  return (
    <>
      <div className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#174b73] shrink-0">
          <span className="text-white font-semibold text-sm">
            All Bets
            {betList.length > 0 && (
              <span className="ml-1.5 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {betList.length}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/owner/live-markets/details/all-bets?matchId=${encodeURIComponent(matchId)}`}
              className="flex items-center gap-1 text-[11px] text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Show All
            </Link>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-white/70 hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Column Headers */}
        {!isLoading && !isError && betList.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-600 shrink-0">
            <span className="flex-1 min-w-0">Username</span>
            <span className="flex-1 min-w-0">Market</span>
            <span className="shrink-0 w-14 text-right">Odds</span>
            <span className="shrink-0 w-20 text-right">Stake</span>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-center py-8 text-red-500 text-xs px-3">
              Failed to load bets.{" "}
              <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
          )}

          {!isLoading && !isError && betList.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs px-3">
              No bets placed on this match yet.
            </div>
          )}

          {betList.map((bet) => {
            const isBack = bet.bet_type === 0;
            const stake = parseFloat(bet.stake ?? 0);
            const odds = parseFloat(bet.odds ?? 0);
            return (
              <button
                key={bet.id}
                onClick={() => setSelectedBet(bet)}
                className={cn(
                  "w-full flex items-center gap-2 border-b border-gray-100 last:border-b-0 px-3 py-2 transition-colors text-left text-[13px] hover:brightness-95",
                  isBack ? "bg-blue-300 text-gray-800" : "bg-pink-300 text-gray-800"
                )}
              >
                <span className="font-semibold text-gray-900 truncate flex-1 min-w-0" title={bet.user_name}>
                  {bet.user_name ?? "—"}
                </span>
                <span className="text-gray-600 truncate flex-1 min-w-0" title={bet.market_name}>
                  {bet.market_name ?? "—"}
                </span>
                <span className="shrink-0 font-semibold text-gray-900 w-14 text-right">
                  {odds.toFixed(2)}
                </span>
                <span className="shrink-0 text-gray-700 w-20 text-right">
                  ₹{fmtNum(stake)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedBet && (
        <BetDetailModal bet={selectedBet} onClose={() => setSelectedBet(null)} />
      )}
    </>
  );
}

// ─── Match detail view ────────────────────────────────────────────────────────

function MatchDetailView({
  match,
  oddsExposureMap,
  fancyExposureMap,
  onBack,
}: {
  match: MatchGroup;
  oddsExposureMap: Map<string, Map<string, number>>;
  fancyExposureMap: Map<string, number>;
  onBack: () => void;
}) {
  const { matchOdds, bookmakers, sessions } = useLiveMatch(match.matchId, match.eventTypeId);

  const allMarkets = useMemo(() => {
    const bmNorm = normalizeBookmakers(bookmakers);
    const sessNorm = normalizeSessions(sessions);
    const seenIds = new Set(matchOdds.map((m: any) => m.marketId));
    return [
      ...matchOdds,
      ...bmNorm.filter((m) => !seenIds.has(m.marketId)),
      ...sessNorm,
    ].filter((m) => m.status !== "CLOSED" && m.status !== "INACTIVE");
  }, [matchOdds, bookmakers, sessions]);

  const dbMarketIds = useMemo(
    () => new Set(match.markets.map((m) => String(m.market_id))),
    [match.markets]
  );

  const oddsMarkets = allMarkets.filter(
    (m) => (m.bettingType === "ODDS" || m.bettingType === "BOOKMAKER") && dbMarketIds.has(String(m.marketId))
  );
  const fancyMarkets = allMarkets.filter(
    (m) => m.bettingType === "LINE" && dbMarketIds.has(String(m.marketId))
  );

  const showPlaceholders = allMarkets.length === 0;

  return (
    <div className="space-y-4">
      {/* Back + match header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Matches
        </button>
        <div className="rounded-lg bg-[#174b73] px-4 py-3 text-white">
          <p className="text-[10px] text-white/70">{match.competitionName}</p>
          <p className="font-semibold text-sm">{match.eventName || `Match ${match.matchId}`}</p>
          <p className="text-[10px] text-white/50 mt-0.5">{match.markets.length} market{match.markets.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Two-column layout: markets left, bets right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* ── Left: Live Markets ── */}
        <div className="lg:col-span-3 space-y-2">
          {showPlaceholders ? (
            <div className="space-y-2">
              {match.markets.map((m) => (
                <div key={m.market_id} className="rounded border border-gray-200 px-3 py-2 flex items-center justify-between bg-gray-50">
                  <span className="text-sm text-gray-700">{m.market_name}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {oddsMarkets.map((market) => (
                <OddsMarket key={market.marketId} market={market} oddsExposureMap={oddsExposureMap} />
              ))}
              {fancyMarkets.map((market) => (
                <FancyMarket key={market.marketId} market={market} fancyExposureMap={fancyExposureMap} />
              ))}
              {oddsMarkets.length === 0 && fancyMarkets.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">No open markets at this time</p>
              )}
            </>
          )}
        </div>

        {/* ── Right: Bets Panel ── */}
        <div className="lg:col-span-2">
          <BetsPanel matchId={match.matchId} />
        </div>
      </div>
    </div>
  );
}

// ─── Match list item ──────────────────────────────────────────────────────────

function MatchListItem({
  match,
  onClick,
}: {
  match: MatchGroup;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{match.competitionName}</p>
        <p className="font-medium text-gray-900 text-sm truncate">
          {match.eventName || `Match ${match.matchId}`}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{match.markets.length}</p>
          <p className="text-[10px] text-gray-500">Markets</p>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveMarketsDetailsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useLiveMarketsDetails();
  const { data: pnlData } = useLiveMarketsPnl();
  const [selectedMatch, setSelectedMatch] = useState<MatchGroup | null>(null);

  const oddsExposureMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const row of (pnlData?.odds ?? []) as any[]) {
      const mId = String(row.market_id);
      if (!map.has(mId)) map.set(mId, new Map());
      map.get(mId)!.set(String(row.runner_id), parseFloat(row.runner_profit ?? "0"));
    }
    return map;
  }, [pnlData]);

  const fancyExposureMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of (pnlData?.fancy ?? []) as any[]) {
      map.set(String(row.market_id), parseFloat(row.runner_profit ?? "0"));
    }
    return map;
  }, [pnlData]);

  const eventTypeGroups = useMemo<EventTypeGroup[]>(() => {
    if (!data?.length) return [];

    const eventMap = new Map<number, Map<string, MatchGroup>>();

    for (const row of data as any[]) {
      const etId: number = row.event_type_id ?? 0;
      const matchKey = String(row.match_id ?? 0);

      if (!eventMap.has(etId)) eventMap.set(etId, new Map());
      const matchMap = eventMap.get(etId)!;

      if (!matchMap.has(matchKey)) {
        matchMap.set(matchKey, {
          matchId: matchKey,
          eventTypeId: String(etId),
          eventName: row.event_name ?? "",
          competitionId: String(row.competition_id),
          competitionName: row.competitions_name ?? "",
          markets: [],
        });
      }
      matchMap.get(matchKey)!.markets.push({
        market_id: row.market_id,
        market_name: row.market_name,
        market_type: row.market_type,
      });
    }

    const ORDER: Record<number, number> = { 4: 0, 1: 1, 2: 2 };
    return Array.from(eventMap.entries())
      .sort(([a], [b]) => (ORDER[a] ?? 99) - (ORDER[b] ?? 99))
      .map(([eventTypeId, matchMap]) => ({
        eventTypeId,
        matches: Array.from(matchMap.values()),
      }));
  }, [data]);

  if (selectedMatch) {
    return (
      <MatchDetailView
        match={selectedMatch}
        oddsExposureMap={oddsExposureMap}
        fancyExposureMap={fancyExposureMap}
        onBack={() => setSelectedMatch(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Live Markets — Details</h1>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-center py-16 text-red-500">
          Failed to load markets.{" "}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {!isLoading && !isError && eventTypeGroups.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No active markets found. Markets appear here once bets are placed.
        </div>
      )}

      {eventTypeGroups.length > 0 && (
        <div className="space-y-5">
          {eventTypeGroups.map((et) => (
            <div key={et.eventTypeId}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {eventTypeLabel(et.eventTypeId)}
                </span>
                <span className="text-xs text-gray-400">({et.matches.length} match{et.matches.length !== 1 ? "es" : ""})</span>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {et.matches.map((match) => (
                  <MatchListItem
                    key={match.matchId}
                    match={match}
                    onClick={() => setSelectedMatch(match)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
