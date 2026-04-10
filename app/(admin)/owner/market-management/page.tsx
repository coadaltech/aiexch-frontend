"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import {
  useEventSettings,
  useUpdateEventSettings,
  useUpdateMarketSettings,
  useMarketsByEvent,
  useDeleteCustomMarket,
  useUpdateCustomOdds,
  useOddsHistory,
  useSearchEvents,
} from "@/hooks/useOwner";

import { toast } from "sonner";

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
        <span className="text-[10px] text-gray-500 font-medium">{label}</span>
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

// ─── Format amount like match page ───
function formatAmount(n: number | string | undefined) {
  if (n == null || n === "") return "0";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  if (num >= 100000) return (num / 100000).toFixed(1) + "L";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(0);
}

// ─── Price cell (matches the frontend match page style) ───
function PriceCell({
  price,
  size,
  line,
  type,
  bettingType,
}: {
  price?: number | string;
  size?: number | string;
  line?: number | string;
  type: "back" | "lay";
  bettingType?: string;
}) {
  const isLine = bettingType === "LINE";

  // For LINE markets: top = line, bottom = formatAmount(price)
  // For ODDS/BOOKMAKER: top = price, bottom = formatAmount(size)
  const topValue = isLine ? line : price;
  const bottomValue = isLine ? price : size;

  const isEmpty = !topValue && topValue !== 0;

  // For LINE: NO side uses lay color (red), YES side uses back color (green)
  // In LINE the left column = lay items shown as NO (red), right column = back items shown as YES (green)
  const bgClass =
    type === "back" ? "bg-green-900" : "bg-[#39111A]";

  return (
    <div
      className={`min-w-[50px] w-[60px] px-1 py-1 flex flex-col items-center justify-center rounded leading-tight ${bgClass} ${
        isEmpty ? "opacity-100" : ""
      }`}
    >
      <span className="text-white font-bold text-[10px] sm:text-xs">
        {isEmpty ? "-" : topValue}
      </span>
      <span className="text-gray-400 font-medium text-[8px] sm:text-[9px]">
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
    <div className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0">
      {/* Runner name (LINE markets show market name via displayName) */}
      <div className="min-w-0 pr-1 flex items-center gap-1.5">
        <span className="text-gray-800 font-semibold text-[11px] sm:text-xs truncate block leading-tight">
          {displayName ?? runner.name}
        </span>
        {isCustom && (
          <button
            onClick={startEditing}
            className="shrink-0 px-1 py-0.5 text-[8px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            title="Edit odds"
          >
            Edit
          </button>
        )}
      </div>

      {/* Back + Lay cells */}
      <div className="col-span-2 gap-2 relative flex min-h-[2.25rem]">
        {isLine ? (
          <>
            {/* LINE: Left = NO (lay items, red bg), Right = YES (back items, green bg) */}
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
            {/* ODDS/BOOKMAKER: Left = Back (reversed order), Right = Lay */}
            <div className="flex-1 flex flex-col items-end min-w-0">
              <div className="gap-1 flex justify-end items-center">
                {backSlots.map((item, posIdx) => (
                  <PriceCell
                    key={`back-${posIdx}`}
                    price={item?.price}
                    size={item?.size}
                    type="back"
                    bettingType={bettingType}
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
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Suspended overlay */}
        {isSuspended && (
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[70%] min-w-[4rem] flex items-center justify-center pointer-events-none z-10"
            style={{
              background:
                "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 12px)",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <span className="text-red-600 font-bold text-sm drop-shadow-sm">
              Suspended
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
  const deleteCustom = useDeleteCustomMarket();
  const [showSettings, setShowSettings] = useState(false);
  const [pendingField, setPendingField] = useState<string | null>(null);
  const [minBet, setMinBet] = useState("");
  const [maxBet, setMaxBet] = useState("");
  const [betDelay, setBetDelay] = useState("");

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

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        isDisabled
          ? "border-red-200 bg-red-50/30"
          : isHidden
            ? "border-yellow-200 bg-yellow-50/30"
            : "border-gray-200 hover:border-blue-300"
      }`}
    >
      {/* Status color bar */}
      <div className={`h-1 ${statusColor}`} />

      {/* Market header: name + back/lay or NO/YES labels */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 border-b border-gray-100 bg-gray-50/80 items-center">
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-[11px] sm:text-xs truncate leading-tight">
              {market.bettingType === "LINE" ? "Fancy" : market.marketName}
            </h3>
            <span
              className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                market.bettingType === "ODDS"
                  ? "bg-blue-100 text-blue-700"
                  : market.bettingType === "LINE"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-orange-100 text-orange-700"
              }`}
            >
              {market.bettingType}
            </span>
            {isCustom && (
              <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-indigo-100 text-indigo-700">
                CUSTOM
              </span>
            )}
            {isDisabled && (
              <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-red-100 text-red-700">
                DISABLED
              </span>
            )}
            {isHidden && (
              <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-yellow-100 text-yellow-700">
                HIDDEN
              </span>
            )}
            {isSuspended && (
              <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-orange-100 text-orange-700">
                SUSPENDED
              </span>
            )}
          </div>
          <p className="text-gray-500 text-[9px] sm:text-[10px] truncate leading-tight">
            Min: {condition.minBet ?? "-"} / Max: {condition.maxBet ?? "-"} / Delay: {condition.betDelay ?? 0}s
          </p>
        </div>
        {market.bettingType === "LINE" ? (
          <>
            <div className="justify-self-end font-semibold uppercase bg-[#39111A] text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded w-fit">
              NO
            </div>
            <div className="w-fit font-semibold uppercase bg-green-900 text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded">
              YES
            </div>
          </>
        ) : (
          <>
            <div className="justify-self-end font-semibold uppercase bg-green-900 text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded">
              Back
            </div>
            <div className="font-semibold uppercase bg-[#39111A] text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded w-fit">
              Lay
            </div>
          </>
        )}
      </div>

      {/* Runners with back/lay prices */}
      <div className="divide-y divide-gray-100">
        {(market.runners || []).map((runner: any) => (
          <RunnerOddsRow
            key={runner.selectionId}
            runner={runner}
            isCustom={isCustom}
            marketId={market.marketId}
            isSuspended={isSuspended}
            bettingType={market.bettingType}
            displayName={market.bettingType === "LINE" ? market.marketName : undefined}
          />
        ))}
      </div>

      {/* Controls bar */}
      <div className="px-2 sm:px-3 py-2 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
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
              className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              {showSettings ? "Close" : "Settings"}
            </button>
            {isCustom && (
              <button
                onClick={handleDelete}
                disabled={deleteCustom.isPending}
                className="px-2 py-1 text-[10px] bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
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
            <div className="grid grid-cols-3 gap-2">
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
          </div>
        )}
      </div>
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Event Settings</h3>
        <span className="text-xs text-gray-500">
          {liveMarketCount} market{liveMarketCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-700">Active</span>
          <Toggle
            checked={eventSettings?.isActive ?? true}
            onChange={(v) => handleToggle("isActive", v)}
            loading={pendingField === "isActive"}
            disabled={updateEvent.isPending}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-700">Visible</span>
          <Toggle
            checked={eventSettings?.isVisible ?? true}
            onChange={(v) => handleToggle("isVisible", v)}
            loading={pendingField === "isVisible"}
            disabled={updateEvent.isPending}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-700">Suspended</span>
          <Toggle
            checked={eventSettings?.suspended ?? false}
            onChange={(v) => handleToggle("suspended", v)}
            loading={pendingField === "suspended"}
            disabled={updateEvent.isPending}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 whitespace-nowrap">Delay</span>
          <input
            type="number"
            min="0"
            defaultValue={eventSettings?.betDelay ?? 0}
            onBlur={(e) => handleBetDelay(e.target.value)}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <span className="text-xs text-gray-500">s</span>
          {pendingField === "betDelay" && (
            <span className="text-blue-500"><Spinner size={12} /></span>
          )}
        </div>
      </div>
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

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
function MarketManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const panelPrefix = usePanelPrefix();
  const preselectedEventId = searchParams.get("eventId");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeEventId, setActiveEventId] = useState(preselectedEventId || "");
  const [activeEventTypeId, setActiveEventTypeId] = useState("4");
  const [activeTab, setActiveTab] = useState<"markets" | "history">("markets");
  const [filter, setFilter] = useState<"all" | "active" | "disabled">(
    "all"
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading: isSearching } = useSearchEvents(searchQuery);

  const { matchOdds: rawMarkets, isConnected, status } = useLiveMatch(
    activeEventId || "", activeEventTypeId
  );

  const { data: savedMarkets } = useMarketsByEvent(activeEventId || null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectEvent = useCallback((eventId: string, eventName: string, eventTypeId?: string) => {
    setSearchQuery(eventName);
    setActiveEventId(eventId);
    if (eventTypeId) setActiveEventTypeId(eventTypeId);
    setShowDropdown(false);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // If the input looks like a raw event ID (all digits), load it directly
      const trimmed = searchQuery.trim();
      if (trimmed && /^\d+$/.test(trimmed)) {
        setActiveEventId(trimmed);
        setShowDropdown(false);
      } else if (searchResults && searchResults.length > 0) {
        // Auto-select first result on Enter
        handleSelectEvent(searchResults[0].eventId, searchResults[0].name, searchResults[0].eventTypeId);
      }
    }
  }, [searchQuery, searchResults, handleSelectEvent]);

  const markets = rawMarkets.filter((m: any) => {
    if (filter === "active") return !m.adminDisabled && !m.adminHidden;
    if (filter === "disabled") return m.adminDisabled || m.adminHidden;
    return true;
  });

  const disabledCount = rawMarkets.filter(
    (m: any) => m.adminDisabled || m.adminHidden
  ).length;

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Market Management</h1>
          <p className="text-gray-600 mt-1">
            View live markets, manage settings, and review odds history
          </p>
        </div>

        {/* Event Search */}
        <div className="relative mb-6" ref={searchRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by team name, event name, or Event ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500">
                  <Spinner size={16} />
                </div>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && searchQuery.trim().length >= 2 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                  <Spinner size={14} /> Searching...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((event: any) => (
                  <button
                    key={event.eventId}
                    onClick={() => handleSelectEvent(event.eventId, event.name, event.eventTypeId)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 text-sm truncate">
                          {event.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {event.sportName}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-xs text-gray-500 truncate">
                            {event.seriesName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {event.inPlay && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">
                            LIVE
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">
                          {event.eventId}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No events found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs - always visible */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
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
            {/* Connection Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected
                    ? `Connected - Event ${activeEventId}`
                    : `${status} - Event ${activeEventId}`}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                ID: {activeEventId}
              </span>
            </div>

            {activeTab === "markets" && (
              <>
                {/* Event Settings */}
                <EventSettingsPanel
                  eventId={activeEventId}
                  liveMarketCount={rawMarkets.length}
                />

                {/* Saved Overrides Info */}
                {savedMarkets && savedMarkets.length > 0 && (
                  <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    {savedMarkets.length} market override(s) saved in DB for this event
                  </div>
                )}

                {/* Filter pills */}
                <div className="flex gap-2 mb-3">
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

                {/* Markets List */}
                {markets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {isConnected
                      ? filter !== "all"
                        ? "No markets match this filter"
                        : "No markets available for this event"
                      : "Connecting to live feed..."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {markets.map((market: any) => (
                      <MarketCard key={market.marketId} market={market} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "history" && (
              <OddsHistoryPanel eventId={activeEventId} />
            )}
          </>
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
              Search for an event to get started
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Search by team name, event name, or enter an Event ID directly
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <MarketManagementContent />
    </Suspense>
  );
}
