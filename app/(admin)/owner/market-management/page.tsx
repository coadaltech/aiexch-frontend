"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import {
  useEventSettings,
  useUpdateEventSettings,
  useUpdateMarketSettings,
  useBulkUpdateMarketSettings,
  useUpdateMarketNotice,
  useMarketsByEvent,
  useDeleteCustomMarket,
  useUpdateCustomOdds,
  useOddsHistory,
  useListCustomMarkets,
} from "@/hooks/useOwner";
import {
  CreateCustomMarketModal,
  EditCustomMarketModal,
  ManageMarketPriceModal,
} from "@/components/owner/custom-market-modals";
import { usePermissions } from "@/contexts/PermissionContext";

// ─── Spinner ───
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-75"
      />
    </svg>
  );
}

// ─── Toggle with loading ───
function Toggle({
  checked,
  onChange,
  loading,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
      {label && (
        <span className="text-xs text-gray-600 font-semibold">{label}</span>
      )}
      {loading ? (
        <div className="h-5 flex items-center justify-center text-blue-500">
          <Spinner size={14} />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            checked ? "bg-green-500" : "bg-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      )}
    </div>
  );
}

// ─── Compact pill toggle — used on grouped Fancy rows where horizontal
// space is tight. Renders a single-letter button that flips state on click. ───
function PillToggle({
  label,
  on,
  onClick,
  loading,
  disabled,
  activeColor = "bg-green-500",
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  activeColor?: string;
}) {
  if (loading) {
    return (
      <span className="w-6 h-6 rounded inline-flex items-center justify-center text-blue-500 bg-gray-100">
        <Spinner size={10} />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${label}: ${on ? "ON" : "OFF"}`}
      className={`w-6 h-6 rounded text-[10px] font-bold inline-flex items-center justify-center transition-colors disabled:opacity-50 ${
        on ? `${activeColor} text-white` : "bg-gray-200 text-gray-500"
      }`}
    >
      {label.charAt(0)}
    </button>
  );
}

// ─── Format amount like match page ───
function formatAmount(n: number | string | undefined) {
  if (n == null || n === "") return "0";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  if (num >= 100000) return (num / 100000).toFixed(1) + "L";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(0);
}

// ─── Format odds price (mirrors matchid: 3 dp under 0.1, 2 dp otherwise) ───
function formatOddsPrice(price: number | string | null | undefined): string {
  if (price == null) return "0";
  const num = parseFloat(String(price));
  if (isNaN(num)) return "0";
  const dp = num < 0.1 ? 3 : 2;
  return parseFloat(num.toFixed(dp)).toString();
}

// ─── Detect best rendering layout for a non-LINE market.
// Mirrors the public match page so admins see markets in the same shape
// users see them. ───
type MarketLayout =
  | "standard"
  | "team-binary"
  | "binary"
  | "odd-even"
  | "lottery"
  | "multi-grid";
function detectMarketLayout(market: any): MarketLayout {
  const runners: any[] = market.runners || [];
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

// ─── Suspended striped cell, used by ADV layouts (binary / odd-even /
// lottery / multi-grid) to mark unavailable runners. ───
function SuspendedCell({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{
        background:
          "repeating-linear-gradient(45deg,#374151 0,#374151 4px,#4B5563 4px,#4B5563 8px)",
      }}
    >
      <span className="text-red-300 font-bold text-xs relative z-10">
        Suspended
      </span>
    </div>
  );
}

// ─── Price cell — mirrors the bet-button styling on the public match page ───
//
// `emphasis="best"` renders the cell with the gradient back/lay treatment
// the public page uses for the headline (best) price. `emphasis="depth"`
// is the lighter outlined treatment used for the secondary depth levels.
// `empty` collapses to the disabled grey background.
function PriceCell({
  price,
  size,
  line,
  type,
  bettingType,
  emphasis = "best",
}: {
  price?: number | string;
  size?: number | string;
  line?: number | string;
  type: "back" | "lay";
  bettingType?: string;
  emphasis?: "best" | "depth";
}) {
  const isLine = bettingType === "LINE";

  // For LINE markets: top = line, bottom = formatAmount(price)
  // For ODDS/BOOKMAKER: top = price, bottom = formatAmount(size)
  const topValue = isLine ? line : price;
  const bottomValue = isLine ? price : size;

  const isEmpty = topValue == null || topValue === "";

  let cellClass: string;
  if (isEmpty) {
    cellClass =
      type === "back" ? "bg-back-disabled" : "bg-lay-disabled";
  } else if (emphasis === "best") {
    cellClass =
      type === "back"
        ? "bg-gradient-to-b from-back to-back-deep shadow-sm"
        : "bg-gradient-to-b from-lay to-lay-deep shadow-sm";
  } else {
    cellClass =
      type === "back"
        ? "bg-white border border-back/50"
        : "bg-white border border-lay/50";
  }

  return (
    <div
      className={`w-16 sm:w-20 px-1 py-1 flex flex-col items-center justify-center rounded-md leading-tight ${cellClass}`}
    >
      <span className="text-gray-900 font-bold text-sm sm:text-base">
        {isEmpty ? "-" : topValue}
      </span>
      <span className="text-gray-900 font-bold text-[11px] sm:text-xs">
        {isEmpty ? "-" : formatAmount(bottomValue)}
      </span>
    </div>
  );
}

// ─── Runner row with back/lay grid (matches match page layout) ───
function RunnerOddsRow({
  runner,
  isCustom,
  marketId,
  isSuspended,
  bettingType,
  displayName,
}: {
  runner: any;
  isCustom: boolean;
  marketId: string;
  isSuspended: boolean;
  bettingType?: string;
  displayName?: string;
}) {
  const updateOdds = useUpdateCustomOdds();
  const [editing, setEditing] = useState(false);
  const [editBack, setEditBack] = useState<{ price: string; size: string }[]>([]);
  const [editLay, setEditLay] = useState<{ price: string; size: string }[]>([]);

  const startEditing = () => {
    const currentBack = runner.back || [];
    const currentLay = runner.lay || [];
    const toEdit = (arr: any[]) =>
      arr.length > 0
        ? arr.map((x: any) => ({
            price: String(x.price ?? x[0] ?? ""),
            size: String(x.size ?? x[1] ?? ""),
          }))
        : [{ price: "", size: "" }];
    setEditBack(toEdit(currentBack));
    setEditLay(toEdit(currentLay));
    setEditing(true);
  };

  const handleSave = () => {
    const backPrices = editBack
      .filter((b) => b.price)
      .map((b) => ({ price: parseFloat(b.price), size: parseFloat(b.size) || 0 }));
    const layPrices = editLay
      .filter((l) => l.price)
      .map((l) => ({ price: parseFloat(l.price), size: parseFloat(l.size) || 0 }));

    updateOdds.mutate(
      { marketId, selectionId: runner.selectionId, back: backPrices, lay: layPrices },
      { onSuccess: () => setEditing(false) }
    );
  };

  const addSlot = (type: "back" | "lay") => {
    if (type === "back" && editBack.length < 3)
      setEditBack([...editBack, { price: "", size: "" }]);
    if (type === "lay" && editLay.length < 3)
      setEditLay([...editLay, { price: "", size: "" }]);
  };

  const removeSlot = (type: "back" | "lay", idx: number) => {
    if (type === "back" && editBack.length > 1)
      setEditBack(editBack.filter((_, i) => i !== idx));
    if (type === "lay" && editLay.length > 1)
      setEditLay(editLay.filter((_, i) => i !== idx));
  };

  // Build 3-slot arrays, padded with nulls
  const backItems = runner.back || [];
  const layItems = runner.lay || [];
  const backSlots: any[] = Array(3).fill(null);
  backItems.forEach((item: any, idx: number) => {
    if (idx < 3) backSlots[2 - idx] = item;
  });
  const laySlots: any[] = Array(3).fill(null);
  layItems.forEach((item: any, idx: number) => {
    if (idx < 3) laySlots[idx] = item;
  });

  if (editing && isCustom) {
    return (
      <div className="px-2 sm:px-3 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-800 font-semibold text-xs">{runner.name}</span>
          <div className="flex items-center gap-2">
            {updateOdds.isPending && (
              <span className="text-blue-500"><Spinner size={12} /></span>
            )}
            <button
              onClick={handleSave}
              disabled={updateOdds.isPending}
              className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Back edit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-green-700 font-medium">
                Back ({editBack.length}/3)
              </span>
              {editBack.length < 3 && (
                <button
                  onClick={() => addSlot("back")}
                  className="text-[10px] text-green-600 hover:text-green-700"
                >
                  + Add
                </button>
              )}
            </div>
            {editBack.map((b, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input
                  type="number"
                  value={b.price}
                  onChange={(e) => {
                    const u = [...editBack];
                    u[i] = { ...u[i], price: e.target.value };
                    setEditBack(u);
                  }}
                  placeholder="Price"
                  step="0.01"
                  className="flex-1 px-1.5 py-1 text-xs border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={b.size}
                  onChange={(e) => {
                    const u = [...editBack];
                    u[i] = { ...u[i], size: e.target.value };
                    setEditBack(u);
                  }}
                  placeholder="Size"
                  className="flex-1 px-1.5 py-1 text-xs border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                />
                {editBack.length > 1 && (
                  <button
                    onClick={() => removeSlot("back", i)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Lay edit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-red-700 font-medium">
                Lay ({editLay.length}/3)
              </span>
              {editLay.length < 3 && (
                <button
                  onClick={() => addSlot("lay")}
                  className="text-[10px] text-red-600 hover:text-red-700"
                >
                  + Add
                </button>
              )}
            </div>
            {editLay.map((l, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input
                  type="number"
                  value={l.price}
                  onChange={(e) => {
                    const u = [...editLay];
                    u[i] = { ...u[i], price: e.target.value };
                    setEditLay(u);
                  }}
                  placeholder="Price"
                  step="0.01"
                  className="flex-1 px-1.5 py-1 text-xs border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={l.size}
                  onChange={(e) => {
                    const u = [...editLay];
                    u[i] = { ...u[i], size: e.target.value };
                    setEditLay(u);
                  }}
                  placeholder="Size"
                  className="flex-1 px-1.5 py-1 text-xs border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
                {editLay.length > 1 && (
                  <button
                    onClick={() => removeSlot("lay", i)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isLine = bettingType === "LINE";

  return (
    <div className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0 bg-white hover:bg-gray-50/80 transition-colors">
      {/* Runner name (LINE markets show market name via displayName) */}
      <div className="min-w-0 pr-1 flex items-center gap-1.5">
        <span className="text-gray-900 font-bold text-sm sm:text-base truncate block leading-tight">
          {displayName ?? runner.name}
        </span>
        {isCustom && (
          <button
            onClick={startEditing}
            className="shrink-0 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
            title="Edit odds"
          >
            Edit
          </button>
        )}
      </div>

      {/* Back + Lay cells — mirrors the matchid page layout: back on the
          left (best price closest to the lay column), lay on the right. */}
      <div className="col-span-2 gap-1 sm:gap-2 relative flex min-h-[2.25rem]">
        {isLine ? (
          <>
            {/* LINE: Left = NO (lay-styled), Right = YES (back-styled) */}
            <div className="flex-1 flex flex-col items-end min-w-0">
              <div className="gap-1 flex justify-end items-center">
                {layItems.length > 0 ? (
                  layItems.map((item: any, idx: number) => (
                    <PriceCell
                      key={`no-${idx}`}
                      price={item?.price}
                      line={item?.line}
                      type="lay"
                      bettingType="LINE"
                      emphasis={idx === 0 ? "best" : "depth"}
                    />
                  ))
                ) : (
                  <PriceCell type="lay" bettingType="LINE" />
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start min-w-0">
              <div className="gap-1 flex justify-start items-center">
                {backItems.length > 0 ? (
                  backItems.map((item: any, idx: number) => (
                    <PriceCell
                      key={`yes-${idx}`}
                      price={item?.price}
                      line={item?.line}
                      type="back"
                      bettingType="LINE"
                      emphasis={idx === 0 ? "best" : "depth"}
                    />
                  ))
                ) : (
                  <PriceCell type="back" bettingType="LINE" />
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ODDS/BOOKMAKER: Back column right-aligned (best back closest
                to the lay column), then Lay column left-aligned with best
                lay nearest. Same visual ordering as the matchid page. */}
            <div className="flex-1 flex flex-col items-end min-w-0">
              <div className="gap-1 flex justify-end items-center">
                {backSlots.map((item, posIdx) => (
                  <PriceCell
                    key={`back-${posIdx}`}
                    price={item?.price}
                    size={item?.size}
                    type="back"
                    bettingType={bettingType}
                    emphasis={posIdx === 2 ? "best" : "depth"}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start min-w-0">
              <div className="gap-1 flex justify-start items-center">
                {laySlots.map((item, posIdx) => (
                  <PriceCell
                    key={`lay-${posIdx}`}
                    price={item?.price}
                    size={item?.size}
                    type="lay"
                    bettingType={bettingType}
                    emphasis={posIdx === 0 ? "best" : "depth"}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Suspended overlay — per runner if the runner itself is suspended
            (custom markets use this to show "Ball Running" on just the
            affected row); otherwise falls back to the market-level overlay. */}
        {(isSuspended || runner.status === "SUSPENDED") && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-white/70 backdrop-blur-[1px]"
          >
            <span className="text-red-600 font-bold text-xs sm:text-sm bg-red-50 px-3 py-1 rounded-full border border-red-200/50 shadow-sm">
              {isCustom && runner.status === "SUSPENDED" && !isSuspended
                ? "Ball Running"
                : "Suspended"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Market Card ───
function MarketCard({ market }: { market: any }) {
  const updateMarket = useUpdateMarketSettings();
  const updateNotice = useUpdateMarketNotice();
  const deleteCustom = useDeleteCustomMarket();
  const { has } = usePermissions();
  const canManageNotice = has("market_notice.manage");
  const [showSettings, setShowSettings] = useState(false);
  const [pendingField, setPendingField] = useState<string | null>(null);
  const [minBet, setMinBet] = useState("");
  const [maxBet, setMaxBet] = useState("");
  const [betDelay, setBetDelay] = useState("");
  const [notice, setNotice] = useState<string>(market.notice ?? "");

  // Keep the editable notice in sync when the live feed pushes a new value
  // (but don't clobber an in-progress edit on every websocket frame).
  const lastSyncedNotice = useRef<string>(market.notice ?? "");
  useEffect(() => {
    const incoming = market.notice ?? "";
    if (incoming !== lastSyncedNotice.current) {
      lastSyncedNotice.current = incoming;
      setNotice(incoming);
    }
  }, [market.notice]);

  const handleSaveNotice = () => {
    setPendingField("notice");
    updateNotice.mutate(
      {
        marketId: market.marketId,
        notice,
        eventId: String(market.eventId || ""),
      },
      { onSettled: () => setPendingField(null) }
    );
  };

  // Optimistic local overrides — applied immediately on toggle, cleared when
  // the next WebSocket push arrives with the confirmed state.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const prevMarketRef = useRef(market);

  // When the WebSocket pushes a new market object, clear optimistic overrides
  // so the UI reflects the server-confirmed state.
  useEffect(() => {
    const prev = prevMarketRef.current;
    if (
      prev.adminDisabled !== market.adminDisabled ||
      prev.adminHidden !== market.adminHidden ||
      prev.status !== market.status
    ) {
      setOptimistic({});
    }
    prevMarketRef.current = market;
  }, [market.adminDisabled, market.adminHidden, market.status]);

  const isCustom = market.isCustom || market.marketType === "CUSTOM";

  // Apply optimistic overrides on top of WebSocket state
  const isDisabled = optimistic.isActive !== undefined ? !optimistic.isActive : market.adminDisabled;
  const isHidden = optimistic.isVisible !== undefined ? !optimistic.isVisible : market.adminHidden;
  const isSuspended = optimistic.suspended !== undefined ? optimistic.suspended : market.status === "SUSPENDED";

  // Color bar at top of card
  const statusColor = isDisabled
    ? "bg-red-500"
    : isHidden
      ? "bg-yellow-500"
      : isSuspended
        ? "bg-orange-500"
        : "bg-green-500";

  const handleToggle = (field: string, value: boolean) => {
    // Immediately update UI optimistically
    setOptimistic((prev) => ({ ...prev, [field]: value }));
    setPendingField(field);
    updateMarket.mutate(
      {
        marketId: market.marketId,
        eventId: String(market.eventId || ""),
        marketName: market.marketName,
        marketType: market.marketType || market.bettingType || "ODDS",
        bettingType: market.bettingType || "ODDS",
        [field]: value,
      },
      {
        onSettled: () => setPendingField(null),
        onError: () => {
          // Revert optimistic update on failure
          setOptimistic((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        },
      }
    );
  };

  const handleSaveOverrides = () => {
    setPendingField("overrides");
    const data: any = {
      marketId: market.marketId,
      eventId: String(market.eventId || ""),
      marketName: market.marketName,
      marketType: market.marketType || "MATCH_ODDS",
      bettingType: market.bettingType || "ODDS",
    };
    if (minBet) data.minBet = parseFloat(minBet);
    if (maxBet) data.maxBet = parseFloat(maxBet);
    if (betDelay) data.betDelay = parseInt(betDelay);
    updateMarket.mutate(data, {
      onSettled: () => {
        setPendingField(null);
        setShowSettings(false);
      },
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete custom market "${market.marketName}"?`)) return;
    deleteCustom.mutate(market.marketId);
  };

  const condition = market.marketCondition || {};

  // LINE markets are routed through FancyGroupCard, so MarketCard only
  // sees non-LINE markets. Pick the same body layout the public match
  // page uses so admins see markets in their natural shape.
  const layout: MarketLayout = detectMarketLayout(market);
  const isStandardLayout = layout === "standard" || layout === "team-binary";

  const headerBadges = (
    <>
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          market.bettingType === "ODDS"
            ? "bg-blue-100 text-blue-700"
            : "bg-orange-100 text-orange-700"
        }`}
      >
        {market.bettingType}
      </span>
      {isCustom && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
          CUSTOM
        </span>
      )}
      {isDisabled && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
          DISABLED
        </span>
      )}
      {isHidden && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700">
          HIDDEN
        </span>
      )}
      {isSuspended && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">
          SUSPENDED
        </span>
      )}
    </>
  );

  const conditionLine = (
    <>
      Min: {condition.minBet ?? "-"} / Max: {condition.maxBet ?? "-"} / Delay: {condition.betDelay ?? 0}s
    </>
  );

  // Render the body matching the public match page's layout for this
  // market shape. Each branch parallels the same branch in the matchid
  // page's render so the visual structure stays in sync.
  const renderBody = () => {
    if (isStandardLayout) {
      return (
        <div className="divide-y divide-gray-100">
          {(market.runners || []).map((runner: any) => (
            <RunnerOddsRow
              key={runner.selectionId}
              runner={runner}
              isCustom={isCustom}
              marketId={market.marketId}
              isSuspended={isSuspended}
              bettingType={market.bettingType}
            />
          ))}
        </div>
      );
    }

    if (layout === "binary") {
      const runners: any[] = market.runners || [];
      const yesRunner =
        runners.find((r: any) => (r.name || "").toUpperCase() === "YES") ?? runners[0];
      const noRunner =
        runners.find((r: any) => (r.name || "").toUpperCase() === "NO") ?? runners[1];
      const renderCell = (runner: any, side: "back" | "lay") => {
        if (!runner) return <SuspendedCell className="min-h-[2.5rem]" />;
        const isRunnerSusp =
          isSuspended || runner.status === "SUSPENDED" || runner.status === "REMOVED";
        if (isRunnerSusp) return <SuspendedCell className="min-h-[2.5rem]" />;
        const backItem = runner.back?.[0];
        const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
        return (
          <div
            className={`min-h-[2.5rem] flex flex-col items-center justify-center leading-tight ${
              side === "back"
                ? "bg-gradient-to-b from-back to-back-deep"
                : "bg-gradient-to-b from-lay to-lay-deep"
            }`}
          >
            <span className="text-base text-gray-900 font-bold">
              {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
            </span>
            {backItem?.size != null && (
              <span className="text-[11px] text-gray-900 font-bold">
                {formatAmount(backItem.size)}
              </span>
            )}
          </div>
        );
      };
      return (
        <div className="bg-white grid grid-cols-2 sm:grid-cols-4 items-stretch">
          <div className="px-3 flex items-center min-h-[2.5rem] min-w-0">
            <span className="text-gray-900 font-bold text-sm sm:text-base truncate">
              {yesRunner?.name ?? "YES"}
            </span>
          </div>
          {renderCell(yesRunner, "back")}
          <div className="px-3 flex items-center min-h-[2.5rem] min-w-0">
            <span className="text-gray-900 font-bold text-sm sm:text-base truncate">
              {noRunner?.name ?? "NO"}
            </span>
          </div>
          {renderCell(noRunner, "lay")}
        </div>
      );
    }

    if (layout === "odd-even") {
      const runners: any[] = market.runners || [];
      return (
        <div className="bg-white grid grid-cols-2 sm:grid-cols-4 items-stretch">
          {runners.flatMap((runner: any) => {
            const isRunnerSusp =
              isSuspended || runner.status === "SUSPENDED" || runner.status === "REMOVED";
            const backItem = runner.back?.[0];
            const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
            return [
              <span
                key={`lbl-${runner.selectionId}`}
                className="text-gray-900 font-bold text-sm sm:text-base px-3 flex items-center truncate min-h-[2.5rem]"
              >
                {runner.name}
              </span>,
              isRunnerSusp ? (
                <SuspendedCell key={`susp-${runner.selectionId}`} className="min-h-[2.5rem]" />
              ) : (
                <div
                  key={`btn-${runner.selectionId}`}
                  className="min-h-[2.5rem] flex flex-col items-center justify-center font-bold text-gray-900 bg-back leading-tight"
                >
                  <span className="text-base">
                    {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
                  </span>
                  {backItem?.size != null && (
                    <span className="text-[11px] font-semibold">
                      {formatAmount(backItem.size)}
                    </span>
                  )}
                </div>
              ),
            ];
          })}
        </div>
      );
    }

    if (layout === "lottery") {
      const runners: any[] = market.runners || [];
      return (
        <div className="bg-white px-2 sm:px-3 py-2">
          {isSuspended ? (
            <SuspendedCell className="w-full min-h-[2.5rem] rounded" />
          ) : (
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {runners.map((runner: any) => {
                const backItem = runner.back?.[0];
                const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
                const isRunnerSusp =
                  runner.status === "SUSPENDED" || runner.status === "REMOVED";
                return (
                  <div
                    key={runner.selectionId}
                    className={`flex flex-col items-center gap-0.5 ${
                      isRunnerSusp || rawPrice == null ? "opacity-40" : ""
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full bg-[var(--header-primary)] text-[var(--header-text)] font-bold text-sm flex items-center justify-center shadow-sm">
                      {runner.name}
                    </span>
                    <span className="text-gray-700 text-[11px] font-semibold">
                      {rawPrice != null ? formatOddsPrice(rawPrice) : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // multi-grid (3+ runners with no lay): name+odds tiles, up to 3 cols.
    const runners: any[] = market.runners || [];
    const cols = Math.min(runners.length, 3);
    const mdColsClass =
      cols <= 1 ? "md:grid-cols-1" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
    return (
      <div
        className={`bg-white grid grid-cols-1 sm:grid-cols-2 ${mdColsClass} divide-x divide-y divide-gray-100`}
      >
        {runners.map((runner: any) => {
          const isRunnerSusp =
            isSuspended || runner.status === "SUSPENDED" || runner.status === "REMOVED";
          const backItem = runner.back?.[0];
          const rawPrice = backItem ? parseFloat(String(backItem.price)) : null;
          return (
            <div key={runner.selectionId} className="flex items-stretch min-w-0">
              <div className="flex-1 px-2 py-1 min-w-0 flex items-center">
                <span className="text-gray-900 font-bold text-sm truncate">{runner.name}</span>
              </div>
              {isRunnerSusp ? (
                <SuspendedCell className="w-16 min-h-[2.25rem] shrink-0" />
              ) : (
                <div className="w-16 min-h-[2.25rem] flex flex-col items-center justify-center font-bold text-sm text-gray-900 bg-back shrink-0 leading-tight">
                  <span>{rawPrice != null ? formatOddsPrice(rawPrice) : "-"}</span>
                  {backItem?.size != null && (
                    <span className="text-[10px] font-semibold">
                      {formatAmount(backItem.size)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`rounded-lg overflow-hidden border shadow-sm transition-colors ${
        isDisabled
          ? "border-red-200"
          : isHidden
            ? "border-yellow-200"
            : "border-gray-200"
      }`}
    >
      {/* Status color bar */}
      <div className={`h-1 ${statusColor}`} />

      {/* Header — standard back/lay layouts get the 3-col header with
          Back/Lay column labels (mirrors runner cells below). ADV layouts
          (binary / odd-even / lottery / multi-grid) don't have side-by-side
          back+lay columns, so they get a simpler single-row header. */}
      {isStandardLayout ? (
        <div className="grid grid-cols-3 gap-2 px-2 sm:px-3 py-1.5 border-b border-[#1e4088]/40 bg-[var(--header-primary)] items-center">
          <div className="min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight">
                {market.marketName}
              </h3>
              {headerBadges}
            </div>
            <p className="text-white/70 text-[11px] sm:text-xs truncate leading-tight">
              {conditionLine}
            </p>
          </div>
          <div className="justify-self-end font-bold uppercase bg-back text-black text-xs sm:text-sm py-0.5 px-1.5 rounded">
            Back
          </div>
          <div className="font-bold uppercase bg-lay text-black text-xs sm:text-sm py-0.5 px-1.5 rounded w-fit">
            Lay
          </div>
        </div>
      ) : (
        <div className="px-2 sm:px-3 py-1.5 border-b border-[#1e4088]/40 bg-[var(--header-primary)] flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight">
              {market.marketName}
            </h3>
            {headerBadges}
          </div>
          <span className="text-white/70 text-[11px] sm:text-xs whitespace-nowrap shrink-0">
            {conditionLine}
          </span>
        </div>
      )}

      {/* Body */}
      {renderBody()}

      {/* Controls bar */}
      <div className="px-2 sm:px-3 py-1.5 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-4">
            <Toggle
              label="Active"
              checked={!isDisabled}
              onChange={(v) => handleToggle("isActive", v)}
              loading={pendingField === "isActive"}
              disabled={updateMarket.isPending}
            />
            <Toggle
              label="Visible"
              checked={!isHidden}
              onChange={(v) => handleToggle("isVisible", v)}
              loading={pendingField === "isVisible"}
              disabled={updateMarket.isPending}
            />
            <Toggle
              label="Suspend"
              checked={isSuspended}
              onChange={(v) => handleToggle("suspended", v)}
              loading={pendingField === "suspended"}
              disabled={updateMarket.isPending}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setMinBet(String(condition.minBet || ""));
                setMaxBet(String(condition.maxBet || ""));
                setBetDelay(String(condition.betDelay || "0"));
              }}
              className="px-2.5 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-800 font-medium transition-colors"
            >
              {showSettings ? "Close" : "Settings"}
            </button>
            {isCustom && !market.hasBets && (
              <button
                onClick={handleDelete}
                disabled={deleteCustom.isPending}
                className="px-2.5 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {deleteCustom.isPending && <Spinner size={10} />}
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-600 block mb-0.5">Min Bet</label>
                <input
                  type="number"
                  value={minBet}
                  onChange={(e) => setMinBet(e.target.value)}
                  placeholder={String(condition.minBet || "")}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-0.5">Max Bet</label>
                <input
                  type="number"
                  value={maxBet}
                  onChange={(e) => setMaxBet(e.target.value)}
                  placeholder={String(condition.maxBet || "")}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-0.5">Bet Delay (s)</label>
                <input
                  type="number"
                  value={betDelay}
                  onChange={(e) => setBetDelay(e.target.value)}
                  placeholder={String(condition.betDelay || "0")}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSaveOverrides}
              disabled={pendingField === "overrides"}
              className="mt-2 px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {pendingField === "overrides" && <Spinner size={12} />}
              Save Settings
            </button>

            {/* ── Market Notice / Remark (permission-gated) ── */}
            {canManageNotice && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <label className="text-[10px] font-semibold text-gray-700 block mb-0.5">
                  Market Notice / Remark
                  <span className="font-normal text-gray-400"> (shown to users on this market)</span>
                </label>
                <textarea
                  value={notice}
                  onChange={(e) => setNotice(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="e.g. 'Market under review', 'Ball running', 'Result awaited'"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none resize-y"
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    onClick={handleSaveNotice}
                    disabled={pendingField === "notice" || notice === (market.notice ?? "")}
                    className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {pendingField === "notice" && <Spinner size={12} />}
                    Save Notice
                  </button>
                  {(market.notice ?? "") && (
                    <button
                      onClick={() => {
                        setNotice("");
                        setPendingField("notice");
                        updateNotice.mutate(
                          { marketId: market.marketId, notice: "", eventId: String(market.eventId || "") },
                          { onSettled: () => setPendingField(null) }
                        );
                      }}
                      disabled={pendingField === "notice"}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fancy market row — one LINE market rendered as a single row inside
// the grouped FancyGroupCard. Mirrors the matchid Fancy section layout
// (market name on the left, NO/YES cells in the middle) and adds a
// compact admin control strip on the right. ───
function FancyMarketRow({ market }: { market: any }) {
  const updateMarket = useUpdateMarketSettings();
  const deleteCustom = useDeleteCustomMarket();
  const updateOdds = useUpdateCustomOdds();

  const [pendingField, setPendingField] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const prevMarketRef = useRef(market);

  const [showSettings, setShowSettings] = useState(false);
  const [minBet, setMinBet] = useState("");
  const [maxBet, setMaxBet] = useState("");
  const [betDelay, setBetDelay] = useState("");

  const [editing, setEditing] = useState(false);
  const [editBack, setEditBack] = useState<{ price: string; size: string }[]>([]);
  const [editLay, setEditLay] = useState<{ price: string; size: string }[]>([]);

  useEffect(() => {
    const prev = prevMarketRef.current;
    if (
      prev.adminDisabled !== market.adminDisabled ||
      prev.adminHidden !== market.adminHidden ||
      prev.status !== market.status
    ) {
      setOptimistic({});
    }
    prevMarketRef.current = market;
  }, [market.adminDisabled, market.adminHidden, market.status]);

  const isCustom = market.isCustom || market.marketType === "CUSTOM";
  const isDisabled =
    optimistic.isActive !== undefined ? !optimistic.isActive : market.adminDisabled;
  const isHidden =
    optimistic.isVisible !== undefined ? !optimistic.isVisible : market.adminHidden;
  const isSuspended =
    optimistic.suspended !== undefined ? optimistic.suspended : market.status === "SUSPENDED";

  const handleToggle = (field: string, value: boolean) => {
    setOptimistic((prev) => ({ ...prev, [field]: value }));
    setPendingField(field);
    updateMarket.mutate(
      {
        marketId: market.marketId,
        eventId: String(market.eventId || ""),
        marketName: market.marketName,
        marketType: market.marketType || market.bettingType || "LINE",
        bettingType: market.bettingType || "LINE",
        [field]: value,
      },
      {
        onSettled: () => setPendingField(null),
        onError: () => {
          setOptimistic((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        },
      }
    );
  };

  const handleSaveOverrides = () => {
    setPendingField("overrides");
    const data: any = {
      marketId: market.marketId,
      eventId: String(market.eventId || ""),
      marketName: market.marketName,
      marketType: market.marketType || "FANCY",
      bettingType: market.bettingType || "LINE",
    };
    if (minBet) data.minBet = parseFloat(minBet);
    if (maxBet) data.maxBet = parseFloat(maxBet);
    if (betDelay) data.betDelay = parseInt(betDelay);
    updateMarket.mutate(data, {
      onSettled: () => {
        setPendingField(null);
        setShowSettings(false);
      },
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete custom market "${market.marketName}"?`)) return;
    deleteCustom.mutate(market.marketId);
  };

  const condition = market.marketCondition || {};
  const runner = market.runners?.[0];
  if (!runner) return null;

  const layItems = runner.lay || [];
  const backItems = runner.back || [];
  // Old-provider sessions are single-level "LINE" (NO/YES). Betfair fancy markets
  // are ODDS with a 3-level back/lay ladder — render exactly 3 cells each, padding
  // the missing ones with empty cells (like the odds layout).
  // Both old sessions and Betfair fancy are bettingType "LINE". Distinguish by the
  // isLineMarket flag: Betfair fancy → 3-level back/lay ladder showing price/size;
  // old sessions → single NO/YES showing the run line.
  const isBetfairFancy = !!market.isLineMarket;
  const isSession = !isBetfairFancy;
  // PriceCell shows the run "line" for LINE; for Betfair fancy we want price/size,
  // so feed it a non-LINE bettingType.
  const cellBt = isBetfairFancy ? "ODDS" : market.bettingType || "LINE";

  // Inline edit mode for custom market odds
  const startEditing = () => {
    const toEdit = (arr: any[]) =>
      arr.length > 0
        ? arr.map((x: any) => ({
            price: String(x.price ?? x[0] ?? ""),
            size: String(x.size ?? x[1] ?? ""),
          }))
        : [{ price: "", size: "" }];
    setEditBack(toEdit(backItems));
    setEditLay(toEdit(layItems));
    setEditing(true);
  };
  const handleEditSave = () => {
    const backPrices = editBack
      .filter((b) => b.price)
      .map((b) => ({ price: parseFloat(b.price), size: parseFloat(b.size) || 0 }));
    const layPrices = editLay
      .filter((l) => l.price)
      .map((l) => ({ price: parseFloat(l.price), size: parseFloat(l.size) || 0 }));
    updateOdds.mutate(
      { marketId: market.marketId, selectionId: runner.selectionId, back: backPrices, lay: layPrices },
      { onSuccess: () => setEditing(false) }
    );
  };

  if (editing && isCustom) {
    return (
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-800 font-semibold text-sm">{market.marketName}</span>
          <div className="flex items-center gap-2">
            {updateOdds.isPending && (
              <span className="text-blue-500"><Spinner size={12} /></span>
            )}
            <button
              onClick={handleEditSave}
              disabled={updateOdds.isPending}
              className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-red-700 font-medium">No (Lay)</span>
            {editLay.map((l, i) => (
              <div key={i} className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={l.price}
                  onChange={(e) => {
                    const u = [...editLay];
                    u[i] = { ...u[i], price: e.target.value };
                    setEditLay(u);
                  }}
                  placeholder="Line"
                  className="flex-1 px-1.5 py-1 text-xs border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={l.size}
                  onChange={(e) => {
                    const u = [...editLay];
                    u[i] = { ...u[i], size: e.target.value };
                    setEditLay(u);
                  }}
                  placeholder="Price"
                  className="flex-1 px-1.5 py-1 text-xs border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div>
            <span className="text-[11px] text-green-700 font-medium">Yes (Back)</span>
            {editBack.map((b, i) => (
              <div key={i} className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={b.price}
                  onChange={(e) => {
                    const u = [...editBack];
                    u[i] = { ...u[i], price: e.target.value };
                    setEditBack(u);
                  }}
                  placeholder="Line"
                  className="flex-1 px-1.5 py-1 text-xs border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={b.size}
                  onChange={(e) => {
                    const u = [...editBack];
                    u[i] = { ...u[i], size: e.target.value };
                    setEditBack(u);
                  }}
                  placeholder="Price"
                  className="flex-1 px-1.5 py-1 text-xs border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-2 sm:px-3 py-1 grid grid-cols-[1fr_auto_auto] gap-2 items-center bg-white hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-b-0 relative">
        {/* Market name + condition info + status badges */}
        <div className="min-w-0 flex flex-col gap-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-900 font-bold text-sm sm:text-base truncate">
              {market.marketName}
            </span>
            {isCustom && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                CUSTOM
              </span>
            )}
            {isDisabled && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                DISABLED
              </span>
            )}
            {isHidden && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                HIDDEN
              </span>
            )}
          </div>
          <p className="text-gray-500 text-[11px] sm:text-xs leading-tight truncate">
            Min: {condition.minBet ?? "-"} / Max: {condition.maxBet ?? "-"} / Delay: {condition.betDelay ?? 0}s
          </p>
        </div>

        {/* Price cells. Sessions (LINE): NO(lay) then YES(back). Betfair fancy
            (ODDS): like the odds layout — BACK on the left, LAY on the right. */}
        <div className="relative flex items-center gap-1 sm:gap-2 min-h-[2.25rem]">
          {(() => {
            const layGroup = (
              <div key="lay" className="flex gap-1">
                {isSession ? (
                  layItems.length > 0 ? (
                    layItems.map((item: any, idx: number) => (
                      <PriceCell key={`no-${idx}`} price={item?.price} size={item?.size} line={item?.line} type="lay" bettingType={cellBt} emphasis={idx === 0 ? "best" : "depth"} />
                    ))
                  ) : (
                    <PriceCell type="lay" bettingType={cellBt} />
                  )
                ) : (
                  // Betfair fancy: 3 lay levels, best on the LEFT (adjacent to back).
                  Array(3).fill(null).map((_, idx) => {
                    const item = layItems[idx];
                    return <PriceCell key={`lay-${idx}`} price={item?.price} size={item?.size} type="lay" bettingType={cellBt} emphasis={idx === 0 ? "best" : "depth"} />;
                  })
                )}
              </div>
            );
            const backGroup = (
              <div key="back" className="flex gap-1">
                {isSession ? (
                  backItems.length > 0 ? (
                    backItems.map((item: any, idx: number) => (
                      <PriceCell key={`yes-${idx}`} price={item?.price} size={item?.size} line={item?.line} type="back" bettingType={cellBt} emphasis={idx === 0 ? "best" : "depth"} />
                    ))
                  ) : (
                    <PriceCell type="back" bettingType={cellBt} />
                  )
                ) : (
                  // Betfair fancy: 3 back levels, best on the RIGHT (adjacent to lay).
                  Array(3).fill(null).map((_, posIdx) => {
                    const item = backItems[2 - posIdx];
                    return <PriceCell key={`back-${posIdx}`} price={item?.price} size={item?.size} type="back" bettingType={cellBt} emphasis={posIdx === 2 ? "best" : "depth"} />;
                  })
                )}
              </div>
            );
            return isSession ? [layGroup, backGroup] : [backGroup, layGroup];
          })()}
          {(isSuspended || runner.status === "SUSPENDED") && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-white/70 backdrop-blur-[1px]">
              <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-full border border-red-200/50 shadow-sm">
                {isCustom && runner.status === "SUSPENDED" && !isSuspended
                  ? "Ball Running"
                  : "Suspended"}
              </span>
            </div>
          )}
        </div>

        {/* Compact admin control strip */}
        <div className="flex items-center gap-1 shrink-0">
          <PillToggle
            label="Active"
            on={!isDisabled}
            onClick={() => handleToggle("isActive", isDisabled)}
            loading={pendingField === "isActive"}
            disabled={updateMarket.isPending}
          />
          <PillToggle
            label="Visible"
            on={!isHidden}
            onClick={() => handleToggle("isVisible", isHidden)}
            loading={pendingField === "isVisible"}
            disabled={updateMarket.isPending}
          />
          <PillToggle
            label="Suspend"
            on={isSuspended}
            onClick={() => handleToggle("suspended", !isSuspended)}
            loading={pendingField === "suspended"}
            disabled={updateMarket.isPending}
            activeColor="bg-orange-500"
          />
          {isCustom && (
            <button
              onClick={startEditing}
              className="px-1.5 h-6 text-[10px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold"
              title="Edit odds"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setMinBet(String(condition.minBet || ""));
              setMaxBet(String(condition.maxBet || ""));
              setBetDelay(String(condition.betDelay || "0"));
            }}
            className="w-6 h-6 inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-xs"
            title="Settings"
          >
            ⚙
          </button>
          {isCustom && !market.hasBets && (
            <button
              onClick={handleDelete}
              disabled={deleteCustom.isPending}
              className="w-6 h-6 inline-flex items-center justify-center bg-red-100 hover:bg-red-200 rounded text-red-700 text-xs font-bold disabled:opacity-50"
              title="Delete"
            >
              {deleteCustom.isPending ? <Spinner size={10} /> : "×"}
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-gray-600 block mb-0.5">Min Bet</label>
              <input
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
                placeholder={String(condition.minBet || "")}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-600 block mb-0.5">Max Bet</label>
              <input
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                placeholder={String(condition.maxBet || "")}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-600 block mb-0.5">Bet Delay (s)</label>
              <input
                type="number"
                value={betDelay}
                onChange={(e) => setBetDelay(e.target.value)}
                placeholder={String(condition.betDelay || "0")}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleSaveOverrides}
            disabled={pendingField === "overrides"}
            className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {pendingField === "overrides" && <Spinner size={10} />}
            Save Settings
          </button>
        </div>
      )}
    </>
  );
}

// ─── Fancy group card — mirrors the matchid Fancy section: a single
// outer card with one shared "Fancy" header, then every LINE/fancy
// market for the event listed as a row inside. ───
function FancyGroupCard({ markets }: { markets: any[] }) {
  if (markets.length === 0) return null;
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* Single shared Fancy header — mirrors matchid's layout. The
          NO/YES cell widths must match the row cells below so columns
          line up vertically. */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 sm:px-3 py-1.5 border-b border-[#1e4088]/40 bg-[var(--header-primary)] items-center">
        <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight">
          Fancy ({markets.length})
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-16 sm:w-20 text-center font-bold uppercase bg-lay text-black text-xs sm:text-sm py-0.5 rounded">
            NO
          </div>
          <div className="w-16 sm:w-20 text-center font-bold uppercase bg-back text-black text-xs sm:text-sm py-0.5 rounded">
            YES
          </div>
        </div>
        <span className="text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wide whitespace-nowrap font-semibold">
          Controls
        </span>
      </div>
      {markets.map((m) => (
        <FancyMarketRow key={m.marketId} market={m} />
      ))}
    </div>
  );
}

// ─── Betfair Fancy group ───
// Groups all Betfair line/fancy markets (Overs/Runs Line) into ONE component
// under a single "Betfair Fancy" header — mirrors the match-id page. Each market
// keeps its full owner controls via MarketCard.
function BetfairFancyGroupCard({ markets }: { markets: any[] }) {
  if (markets.length === 0) return null;
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 sm:px-3 py-1.5 border-b border-[#1e4088]/40 bg-[var(--header-primary)] items-center">
        <h3 className="font-bold text-white text-sm sm:text-base truncate leading-tight">
          Betfair Fancy ({markets.length})
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-16 sm:w-20 text-center font-bold uppercase bg-back text-black text-xs sm:text-sm py-0.5 rounded">
            Back
          </div>
          <div className="w-16 sm:w-20 text-center font-bold uppercase bg-lay text-black text-xs sm:text-sm py-0.5 rounded">
            Lay
          </div>
        </div>
        <span className="text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wide whitespace-nowrap font-semibold">
          Controls
        </span>
      </div>
      {/* One-liner rows with active/visible/suspend toggles + settings, like the
          normal fancy. FancyMarketRow shows price+size for ODDS-typed markets.
          Sorted like the match page (sortPriority then name). */}
      {[...markets]
        .sort((a, b) => {
          const sp = (a.sortPriority ?? 0) - (b.sortPriority ?? 0);
          if (sp !== 0) return sp;
          return String(a.marketName || "").localeCompare(String(b.marketName || ""));
        })
        .map((m) => (
          <FancyMarketRow key={m.marketId} market={m} />
        ))}
    </div>
  );
}

// ─── Event Settings Panel ───
function EventSettingsPanel({
  eventId,
  liveMarketCount,
}: {
  eventId: string;
  liveMarketCount: number;
}) {
  const { data: eventSettings } = useEventSettings(eventId);
  const updateEvent = useUpdateEventSettings();
  const [pendingField, setPendingField] = useState<string | null>(null);

  const handleToggle = (field: string, value: boolean) => {
    setPendingField(field);
    updateEvent.mutate(
      { eventId, [field]: value },
      { onSettled: () => setPendingField(null) }
    );
  };

  const handleBetDelay = (value: string) => {
    const num = parseInt(value) || 0;
    setPendingField("betDelay");
    updateEvent.mutate(
      { eventId, betDelay: num },
      { onSettled: () => setPendingField(null) }
    );
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-2 flex items-center gap-4 flex-wrap">
      <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">
        Event Settings
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Active</span>
        <Toggle
          checked={eventSettings?.isActive ?? true}
          onChange={(v) => handleToggle("isActive", v)}
          loading={pendingField === "isActive"}
          disabled={updateEvent.isPending}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Visible</span>
        <Toggle
          checked={eventSettings?.isVisible ?? true}
          onChange={(v) => handleToggle("isVisible", v)}
          loading={pendingField === "isVisible"}
          disabled={updateEvent.isPending}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Suspended</span>
        <Toggle
          checked={eventSettings?.suspended ?? false}
          onChange={(v) => handleToggle("suspended", v)}
          loading={pendingField === "suspended"}
          disabled={updateEvent.isPending}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-gray-700">Delay</span>
        <input
          type="number"
          min="0"
          defaultValue={eventSettings?.betDelay ?? 0}
          onBlur={(e) => handleBetDelay(e.target.value)}
          className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <span className="text-xs text-gray-500">s</span>
        {pendingField === "betDelay" && (
          <span className="text-blue-500">
            <Spinner size={12} />
          </span>
        )}
      </div>
      <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
        {liveMarketCount} market{liveMarketCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
// ─── Odds History Panel ───
function OddsHistoryPanel({ eventId }: { eventId: string }) {
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: history, isFetching } = useOddsHistory(
    selectedMarketId
      ? {
          eventId,
          marketId: selectedMarketId,
          limit: "50",
          ...(dateFrom && { from: dateFrom }),
          ...(dateTo && { to: dateTo }),
        }
      : {
          eventId,
          limit: "50",
          ...(dateFrom && { from: dateFrom }),
          ...(dateTo && { to: dateTo }),
        }
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-gray-800">Odds History</h3>
        {isFetching && (
          <span className="text-blue-500"><Spinner size={14} /></span>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input
          type="text"
          value={selectedMarketId}
          onChange={(e) => setSelectedMarketId(e.target.value)}
          placeholder="Filter by market ID..."
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="datetime-local"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="From"
        />
        <input
          type="datetime-local"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="To"
        />
      </div>

      {!history || history.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No history yet. Odds snapshots are recorded every ~10 seconds when odds change.
        </p>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-2 py-1.5">Time</th>
                <th className="px-2 py-1.5">Market ID</th>
                <th className="px-2 py-1.5">Status</th>
                <th className="px-2 py-1.5">Runners</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((row: any, idx: number) => {
                const snap = row.snapshot || {};
                return (
                  <tr key={row.id || idx} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                      {new Date(row.capturedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-gray-700 font-mono truncate max-w-[150px]">
                      {row.marketId}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`px-1 rounded text-[10px] ${
                          snap.status === "OPEN"
                            ? "bg-green-100 text-green-700"
                            : snap.status === "SUSPENDED"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {snap.status || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-600">
                      {(snap.runners || [])
                        .map(
                          (r: any) =>
                            `${r.selectionId}: B${r.backPrice ?? "-"}/L${r.layPrice ?? "-"}`
                        )
                        .join(" | ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Bulk settings panel ───
// Apply the same Min Bet / Max Bet / Bet Delay to every market of a chosen
// type (Odds, Bookmaker, Fancy/Line, or all) for the event in one shot.
const BULK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Markets" },
  { value: "ODDS", label: "Odds (Match Odds)" },
  { value: "BOOKMAKER", label: "Bookmaker" },
  { value: "LINE", label: "Fancy / Line" },
];

function BulkSettingsPanel({
  eventId,
  markets,
}: {
  eventId: string;
  markets: any[];
}) {
  const bulkUpdate = useBulkUpdateMarketSettings();
  const [open, setOpen] = useState(false);
  const [marketTypeSel, setMarketTypeSel] = useState("ALL");
  const [minBet, setMinBet] = useState("");
  const [maxBet, setMaxBet] = useState("");
  const [betDelay, setBetDelay] = useState("");

  // Count markets per betting type so each option shows how many it will hit.
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: markets.length };
    for (const m of markets) {
      const bt = (m.bettingType || "ODDS").toUpperCase();
      counts[bt] = (counts[bt] || 0) + 1;
    }
    return counts;
  }, [markets]);

  const targetMarkets = useMemo(
    () =>
      marketTypeSel === "ALL"
        ? markets
        : markets.filter(
            (m) => (m.bettingType || "ODDS").toUpperCase() === marketTypeSel
          ),
    [markets, marketTypeSel]
  );

  const hasValue =
    minBet.trim() !== "" || maxBet.trim() !== "" || betDelay.trim() !== "";

  const handleApply = () => {
    if (targetMarkets.length === 0) return;
    const payload: any = {
      eventId,
      markets: targetMarkets.map((m) => ({
        marketId: m.marketId,
        marketName: m.marketName,
        marketType: m.marketType || "MATCH_ODDS",
        bettingType: m.bettingType || "ODDS",
      })),
    };
    if (minBet.trim() !== "") payload.minBet = parseFloat(minBet);
    if (maxBet.trim() !== "") payload.maxBet = parseFloat(maxBet);
    if (betDelay.trim() !== "") payload.betDelay = parseInt(betDelay);

    const label =
      BULK_TYPE_OPTIONS.find((o) => o.value === marketTypeSel)?.label ||
      marketTypeSel;
    if (
      !confirm(
        `Apply these settings to ${targetMarkets.length} "${label}" market(s)?`
      )
    )
      return;

    bulkUpdate.mutate(payload, {
      onSuccess: () => {
        setMinBet("");
        setMaxBet("");
        setBetDelay("");
      },
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-sm font-semibold text-gray-800">
          Bulk Apply — Min / Max / Delay by Market Type
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Market Type
              </label>
              <select
                value={marketTypeSel}
                onChange={(e) => setMarketTypeSel(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BULK_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({typeCounts[o.value] || 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Min Bet
              </label>
              <input
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
                placeholder="—"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Max Bet
              </label>
              <input
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                placeholder="—"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Bet Delay (s)
              </label>
              <input
                type="number"
                value={betDelay}
                onChange={(e) => setBetDelay(e.target.value)}
                placeholder="—"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={
                !hasValue || targetMarkets.length === 0 || bulkUpdate.isPending
              }
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {bulkUpdate.isPending ? <Spinner size={14} /> : null}
              Apply to {targetMarkets.length}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Only the fields you fill are applied; blank fields are left
            unchanged on each market. Values persist across live refreshes.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
function MarketManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedEventId = searchParams.get("eventId");

  const [activeEventId] = useState(preselectedEventId || "");
  const [activeEventTypeId] = useState("4");
  const [activeTab, setActiveTab] = useState<"markets" | "custom" | "history">(
    "markets"
  );
  const [filter, setFilter] = useState<"all" | "active" | "disabled">(
    "all"
  );
  // Filters the markets currently loaded for the active event by their
  // marketName — purely client-side.
  const [marketNameQuery, setMarketNameQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomMarket, setEditingCustomMarket] = useState<any>(null);
  const [managingCustomMarket, setManagingCustomMarket] = useState<any>(null);

  const deleteCustom = useDeleteCustomMarket();

  // All custom markets across the system; filtered to this event below.
  const { data: allCustomMarkets, isLoading: isLoadingCustom } =
    useListCustomMarkets(
      activeEventId ? { status: "all", limit: 200 } : undefined
    );
  const customMarketsForEvent = activeEventId
    ? (allCustomMarkets || []).filter(
        (m: any) => String(m.eventId) === String(activeEventId)
      )
    : [];

  const handleDeleteCustom = (market: any) => {
    if (!confirm(`Delete custom market "${market.marketName}"?`)) return;
    deleteCustom.mutate(market.marketId);
  };

  const { matchOdds: rawMarkets, isConnected, status } = useLiveMatch(
    activeEventId || "", activeEventTypeId
  );

  const { data: savedMarkets } = useMarketsByEvent(activeEventId || null);

  // Map of custom marketId → hasBets so per-market card components know
  // whether the Delete button should be available.
  const customMarketBetsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const m of allCustomMarkets || []) {
      map.set(String(m.marketId), Boolean(m.hasBets));
    }
    return map;
  }, [allCustomMarkets]);

  const trimmedMarketQuery = marketNameQuery.trim().toLowerCase();
  const markets = rawMarkets
    .filter((m: any) => {
      if (filter === "active" && (m.adminDisabled || m.adminHidden)) return false;
      if (filter === "disabled" && !m.adminDisabled && !m.adminHidden) return false;
      if (
        trimmedMarketQuery &&
        !(m.marketName || "").toLowerCase().includes(trimmedMarketQuery)
      ) {
        return false;
      }
      return true;
    })
    .map((m: any) => ({
      ...m,
      hasBets: customMarketBetsMap.get(String(m.marketId)) ?? false,
    }));

  const disabledCount = rawMarkets.filter(
    (m: any) => m.adminDisabled || m.adminHidden
  ).length;

  return (
    <div className="min-h-screen bg-[#efefef] p-3">
      <div className="">
        {/* Header — single compact row: back, title, and live-event status */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm"
            title="Back to Events"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Market Management</h1>
          {activeEventId && (
            <div className="ml-auto flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-700 font-medium">
                {isConnected ? "Connected" : status}
              </span>
              <span className="text-xs text-gray-500 font-mono">ID: {activeEventId}</span>
            </div>
          )}
        </div>

        {/* Market-name search — filters the markets currently loaded for
            this event by their marketName. Replaces the old event-search
            input; events are loaded via the eventId URL param. */}
        <div className="relative mb-2">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={marketNameQuery}
            onChange={(e) => setMarketNameQuery(e.target.value)}
            placeholder="Search markets by name..."
            className="w-full pl-9 pr-9 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {marketNameQuery && (
            <button
              type="button"
              onClick={() => setMarketNameQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              title="Clear"
            >
              ×
            </button>
          )}
        </div>

        {/* Tabs - always visible */}
        <div className="flex gap-1 mb-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("markets")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "markets"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Markets {activeEventId ? `(${rawMarkets.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "custom"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Custom Market {activeEventId ? `(${customMarketsForEvent.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Odds History
          </button>
        </div>

        {/* Active Event Area */}
        {activeEventId && (
          <>
            {activeTab === "markets" && (
              <>
                {/* Event Settings */}
                <EventSettingsPanel
                  eventId={activeEventId}
                  liveMarketCount={rawMarkets.length}
                />

                {/* Bulk apply min/max/delay to all markets of a type */}
                <BulkSettingsPanel
                  eventId={activeEventId}
                  markets={rawMarkets}
                />

                {/* Filter pills (compact). The market-name search lives
                    in the top bar and applies on top of these filters. */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex gap-1">
                    {(
                      [
                        { key: "all", label: `All (${rawMarkets.length})` },
                        {
                          key: "active",
                          label: `Active (${rawMarkets.length - disabledCount})`,
                        },
                        { key: "disabled", label: `Disabled (${disabledCount})` },
                      ] as const
                    ).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          filter === key
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {savedMarkets && savedMarkets.length > 0 && (
                    <span
                      className="ml-auto text-[11px] text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5 whitespace-nowrap"
                      title={`${savedMarkets.length} market override(s) saved in DB for this event`}
                    >
                      {savedMarkets.length} override{savedMarkets.length !== 1 ? "s" : ""} saved
                    </span>
                  )}
                </div>

                {/* Markets List — non-LINE markets render as individual
                    cards (Match Odds, Bookmaker, etc). LINE/fancy markets
                    are grouped into a single card with one shared "Fancy"
                    header, mirroring the public match page so much more
                    fits on one screen. */}
                {markets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {isConnected
                      ? trimmedMarketQuery || filter !== "all"
                        ? "No markets match the current filter"
                        : "No markets available for this event"
                      : "Connecting to live feed..."}
                  </div>
                ) : (() => {
                    // Same grouping/order as the user-facing match page:
                    //   1. ODDS markets (match odds, bookmaker, tie) — top
                    //   2. Betfair fancy (isLineMarket: Overs/Runs Line) — grouped
                    //   3. Old-provider fancy (LINE sessions) — FancyGroupCard
                    //   4. Many-runner Betfair markets (e.g. "1st Innings Runs") — bottom
                    const isMany = (m: any) =>
                      String(m.provider).toUpperCase() === "BETFAIR" &&
                      (m.runners?.length ?? 0) > 6;
                    const oddsMarkets = markets
                      .filter(
                        (m: any) => m.bettingType !== "LINE" && !m.isLineMarket && !isMany(m)
                      )
                      // Match odds first, then the rest by sortPriority/name.
                      .sort((a: any, b: any) => {
                        const rank = (m: any) => {
                          const t = String(m.marketType || "").toUpperCase();
                          return t === "MATCH_ODDS" || t === "WINNING_ODDS" ? 0 : 1;
                        };
                        const r = rank(a) - rank(b);
                        if (r !== 0) return r;
                        const sp = (a.sortPriority ?? 0) - (b.sortPriority ?? 0);
                        if (sp !== 0) return sp;
                        return String(a.marketName || "").localeCompare(String(b.marketName || ""));
                      });
                    const betfairFancyMarkets = markets.filter(
                      (m: any) => m.isLineMarket && !isMany(m)
                    );
                    const oldFancyMarkets = markets.filter(
                      (m: any) => m.bettingType === "LINE" && !m.isLineMarket
                    );
                    const manyRunnerMarkets = markets.filter(isMany);
                    const wrap = (market: any) => ({
                      ...market,
                      eventId: market.eventId ?? activeEventId,
                    });
                    return (
                      <div className="space-y-1.5">
                        {oddsMarkets.map((market: any) => (
                          <MarketCard key={market.marketId} market={wrap(market)} />
                        ))}
                        <BetfairFancyGroupCard markets={betfairFancyMarkets.map(wrap)} />
                        <FancyGroupCard markets={oldFancyMarkets} />
                        {manyRunnerMarkets.map((market: any) => (
                          <MarketCard key={market.marketId} market={wrap(market)} />
                        ))}
                      </div>
                    );
                  })()}
              </>
            )}

            {activeTab === "custom" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Custom Markets for this Event
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Create new custom markets and manage their prices. Changes
                      are pushed live to users instantly.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    + Create Custom Market
                  </button>
                </div>

                {isLoadingCustom ? (
                  <div className="flex justify-center py-12">
                    <Spinner size={24} />
                  </div>
                ) : customMarketsForEvent.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No custom markets for this event yet. Click{" "}
                    <span className="font-medium">+ Create Custom Market</span>{" "}
                    to add one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customMarketsForEvent.map((market: any) => (
                      <div
                        key={market.marketId}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-800 text-sm">
                                {market.marketName}
                              </h3>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  market.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {market.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                                {market.marketType}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
                                CUSTOM
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                              {market.marketId}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Runners:{" "}
                              {(market.runners || [])
                                .map((r: any) => r.name)
                                .join(", ") || "-"}
                              <span className="mx-1.5 text-gray-300">|</span>
                              Min: {market.minBet || "-"} / Max:{" "}
                              {market.maxBet || "-"} / Delay:{" "}
                              {market.betDelay ?? 0}s
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setEditingCustomMarket(market)}
                              className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setManagingCustomMarket(market)}
                              className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                            >
                              Manage Prices
                            </button>
                            {!market.hasBets && (
                              <button
                                onClick={() => handleDeleteCustom(market)}
                                disabled={deleteCustom.isPending}
                                className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <OddsHistoryPanel eventId={activeEventId} />
            )}
          </>
        )}

        {/* Custom market modals — available from the "Custom Market" tab */}
        {showCreateModal && activeEventId && (
          <CreateCustomMarketModal
            onClose={() => setShowCreateModal(false)}
            lockedEventId={activeEventId}
            lockedEventName={`Event ${activeEventId}`}
          />
        )}
        {editingCustomMarket && (
          <EditCustomMarketModal
            market={editingCustomMarket}
            onClose={() => setEditingCustomMarket(null)}
          />
        )}
        {managingCustomMarket && (
          <ManageMarketPriceModal
            market={managingCustomMarket}
            onClose={() => setManagingCustomMarket(null)}
          />
        )}

        {/* Empty state */}
        {!activeEventId && (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-gray-700 font-medium text-lg">
              No event selected
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Open this page with an <code className="font-mono">?eventId=…</code> URL parameter to load an event.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketManagementGate() {
  const { hasAny } = usePermissions();
  // Page-level gate. Allow anyone with any market-write permission to land
  // here; backend re-checks every individual action. Pure viewers get a
  // friendly 'no access' panel instead of staring at disabled controls.
  const allowed = hasAny([
    "custom_markets.view",
    "custom_markets.edit",
    "custom_markets.manage_odds",
    "live_markets.settle",
  ]);
  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          You don't have permission to manage markets.
        </div>
      </div>
    );
  }
  return <MarketManagementContent />;
}

export default function MarketManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <MarketManagementGate />
    </Suspense>
  );
}
