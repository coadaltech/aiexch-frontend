"use client";

import { cn } from "@/lib/utils";
import { OddsButton } from "./odds-button";

export interface MarketRunner {
  name: string;
  back?: string | number | null;
  backSize?: string | number | null;
  lay?: string | number | null;
  laySize?: string | number | null;
}

export interface MarketCardProps {
  title: string;
  /** e.g. "20/06/2026 17:00" or "In-Play". */
  meta?: string;
  live?: boolean;
  /** Optional small badges (e.g. "BM", "F"). */
  badges?: string[];
  runners: MarketRunner[];
  onPick?: (runner: MarketRunner, side: "back" | "lay") => void;
  className?: string;
}

/**
 * Card-based Diamond market row: a glassy rounded card with the event title, a
 * live/time meta line, optional badges and premium back/lay buttons per runner.
 * Purely presentational and data-shape agnostic — feed it values from the
 * existing market hooks to get the Diamond look with zero logic duplication.
 */
export function MarketCard({
  title,
  meta,
  live,
  badges,
  runners,
  onPick,
  className,
}: MarketCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_14px_-8px_rgba(15,23,42,0.35)] transition-shadow hover:shadow-[0_12px_30px_-14px_rgba(15,23,42,0.4)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h4>
          {meta && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {live && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 font-semibold text-success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  LIVE
                </span>
              )}
              {meta}
            </p>
          )}
        </div>
        {badges && badges.length > 0 && (
          <div className="flex shrink-0 gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Runners */}
      <div className="divide-y divide-border">
        {runners.map((r) => (
          <div
            key={r.name}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[linear-gradient(90deg,rgba(0,174,239,0.06),rgba(34,211,238,0.04))]"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {r.name}
            </span>
            <div className="flex w-[9.5rem] shrink-0 gap-1.5">
              <OddsButton
                side="back"
                price={r.back}
                size={r.backSize}
                onClick={() => onPick?.(r, "back")}
              />
              <OddsButton
                side="lay"
                price={r.lay}
                size={r.laySize}
                onClick={() => onPick?.(r, "lay")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
