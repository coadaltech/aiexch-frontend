"use client";

import { cn } from "@/lib/utils";

export interface OddsButtonProps {
  /** The odds price, e.g. "1.94". Falsy → renders a muted dash. */
  price?: string | number | null;
  /** Optional stake/size shown under the price. */
  size?: string | number | null;
  /** Which side of the book this price is. */
  side: "back" | "lay";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Premium Diamond back/lay odds button. Presentational only — colors come from
 * the shared `--back*` / `--lay*` tokens (re-mapped by diamond.css), so it stays
 * in sync with the active theme and the admin color customization. Reuse this on
 * any future bespoke Diamond market view instead of re-styling odds inline.
 */
export function OddsButton({
  price,
  size,
  side,
  onClick,
  disabled,
  className,
}: OddsButtonProps) {
  const empty = price === null || price === undefined || price === "" || price === "-";
  const isBack = side === "back";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || empty}
      aria-label={`${side} odds ${empty ? "unavailable" : price}`}
      className={cn(
        "group flex h-11 min-w-[3.5rem] flex-1 flex-col items-center justify-center rounded-xl px-2 leading-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-150",
        "enabled:hover:-translate-y-0.5 enabled:hover:brightness-[1.03] enabled:active:translate-y-0",
        isBack
          ? "bg-gradient-to-b from-back to-back-deep enabled:hover:shadow-[0_8px_18px_-6px_rgba(0,174,239,0.55)]"
          : "bg-gradient-to-b from-lay to-lay-deep enabled:hover:shadow-[0_8px_18px_-6px_rgba(244,63,94,0.4)]",
        empty && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <span className="text-sm font-bold text-slate-900 sm:text-base">
        {empty ? "–" : price}
      </span>
      {size !== undefined && size !== null && size !== "" && (
        <span className="text-[10px] font-semibold text-slate-700/80 sm:text-xs">
          {size}
        </span>
      )}
    </button>
  );
}
