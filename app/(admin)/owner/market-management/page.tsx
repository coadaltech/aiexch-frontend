"use client";

import { useState, useCallback } from "react";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";
import {
  useEventSettings,
  useUpdateEventSettings,
  useUpdateMarketSettings,
  useMarketsByEvent,
  useCreateCustomMarket,
  useDeleteCustomMarket,
  useUpdateCustomOdds,
  useOddsHistory,
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
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(0);
}

// ─── Price cell (matches the frontend match page style) ───
function PriceCell({
  price,
  size,
  type,
}: {
  price?: number | string;
  size?: number | string;
  type: "back" | "lay";
}) {
  const isEmpty = !price && price !== 0;
  const bgClass =
    type === "back" ? "bg-green-900" : "bg-[#39111A]";

  return (
    <div
      className={`min-w-[50px] w-[60px] px-1 py-1 flex flex-col items-center justify-center rounded leading-tight ${bgClass} ${
        isEmpty ? "opacity-100" : ""
      }`}
    >
      <span className="text-white font-bold text-[10px] sm:text-xs">
        {isEmpty ? "-" : price}
      </span>
      <span className="text-gray-400 font-medium text-[8px] sm:text-[9px]">
        {isEmpty ? "-" : formatAmount(size)}
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
}: {
  runner: any;
  isCustom: boolean;
  marketId: string;
  isSuspended: boolean;
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

  return (
    <div className="px-2 sm:px-3 py-1 grid grid-cols-3 gap-1 sm:gap-2 items-center min-h-0">
      {/* Runner name */}
      <div className="min-w-0 pr-1 flex items-center gap-1.5">
        <span className="text-gray-800 font-semibold text-[11px] sm:text-xs truncate block leading-tight">
          {runner.name}
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
        {/* Back prices (right-aligned, reversed order) */}
        <div className="flex-1 flex flex-col items-end min-w-0">
          <div className="gap-1 flex justify-end items-center">
            {backSlots.map((item, posIdx) => (
              <PriceCell
                key={`back-${posIdx}`}
                price={item?.price}
                size={item?.size}
                type="back"
              />
            ))}
          </div>
        </div>
        {/* Lay prices (left-aligned) */}
        <div className="flex-1 flex flex-col items-start min-w-0">
          <div className="gap-1 flex justify-start items-center">
            {laySlots.map((item, posIdx) => (
              <PriceCell
                key={`lay-${posIdx}`}
                price={item?.price}
                size={item?.size}
                type="lay"
              />
            ))}
          </div>
        </div>

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

  const isCustom = market.isCustom || market.marketType === "CUSTOM";
  const isDisabled = market.adminDisabled;
  const isHidden = market.adminHidden;
  const isSuspended = market.status === "SUSPENDED";

  // Color bar at top of card
  const statusColor = isDisabled
    ? "bg-red-500"
    : isHidden
      ? "bg-yellow-500"
      : isSuspended
        ? "bg-orange-500"
        : "bg-green-500";

  const handleToggle = (field: string, value: boolean) => {
    setPendingField(field);
    updateMarket.mutate(
      {
        marketId: market.marketId,
        eventId: market.eventId || "",
        marketName: market.marketName,
        marketType: market.marketType || market.bettingType || "ODDS",
        bettingType: market.bettingType || "ODDS",
        [field]: value,
      },
      { onSettled: () => setPendingField(null) }
    );
  };

  const handleSaveOverrides = () => {
    setPendingField("overrides");
    const data: any = {
      marketId: market.marketId,
      eventId: market.eventId || "",
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

      {/* Market header: name + back/lay labels */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 border-b border-gray-100 bg-gray-50/80 items-center">
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-[11px] sm:text-xs truncate leading-tight">
              {market.marketName}
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
        <div className="justify-self-end font-semibold uppercase bg-green-900 text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded">
          Back
        </div>
        <div className="font-semibold uppercase bg-[#39111A] text-white text-[10px] sm:text-xs py-0.5 px-1.5 rounded w-fit">
          Lay
        </div>
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

// ─── Create Custom Market Modal ───
function CreateCustomMarketForm({
  eventId,
  onClose,
}: {
  eventId: string;
  onClose: () => void;
}) {
  const createCustom = useCreateCustomMarket();
  const [marketName, setMarketName] = useState("");
  const [bettingType, setBettingType] = useState("ODDS");
  const [minBet, setMinBet] = useState("100");
  const [maxBet, setMaxBet] = useState("50000");
  const [betDelay, setBetDelay] = useState("0");
  const [runners, setRunners] = useState([
    {
      name: "",
      back: [{ price: "", size: "" }] as { price: string; size: string }[],
      lay: [{ price: "", size: "" }] as { price: string; size: string }[],
    },
    {
      name: "",
      back: [{ price: "", size: "" }] as { price: string; size: string }[],
      lay: [{ price: "", size: "" }] as { price: string; size: string }[],
    },
  ]);

  const addRunner = () => {
    setRunners([
      ...runners,
      { name: "", back: [{ price: "", size: "" }], lay: [{ price: "", size: "" }] },
    ]);
  };

  const removeRunner = (idx: number) => {
    if (runners.length <= 1) return;
    setRunners(runners.filter((_, i) => i !== idx));
  };

  const updateRunnerName = (idx: number, name: string) => {
    const updated = [...runners];
    updated[idx] = { ...updated[idx], name };
    setRunners(updated);
  };

  const addPriceRow = (runnerIdx: number, type: "back" | "lay") => {
    const updated = [...runners];
    if (updated[runnerIdx][type].length < 3) {
      updated[runnerIdx] = {
        ...updated[runnerIdx],
        [type]: [...updated[runnerIdx][type], { price: "", size: "" }],
      };
      setRunners(updated);
    }
  };

  const removePriceRow = (runnerIdx: number, type: "back" | "lay", priceIdx: number) => {
    const updated = [...runners];
    if (updated[runnerIdx][type].length > 1) {
      updated[runnerIdx] = {
        ...updated[runnerIdx],
        [type]: updated[runnerIdx][type].filter((_, i) => i !== priceIdx),
      };
      setRunners(updated);
    }
  };

  const updatePriceField = (
    runnerIdx: number,
    type: "back" | "lay",
    priceIdx: number,
    field: "price" | "size",
    value: string
  ) => {
    const updated = [...runners];
    const prices = [...updated[runnerIdx][type]];
    prices[priceIdx] = { ...prices[priceIdx], [field]: value };
    updated[runnerIdx] = { ...updated[runnerIdx], [type]: prices };
    setRunners(updated);
  };

  const handleCreate = () => {
    if (!marketName.trim()) {
      toast.error("Market name is required");
      return;
    }
    const validRunners = runners.filter((r) => r.name.trim());
    if (validRunners.length < 1) {
      toast.error("At least 1 runner is required");
      return;
    }

    createCustom.mutate(
      {
        eventId,
        marketName,
        bettingType,
        minBet: parseFloat(minBet) || 100,
        maxBet: parseFloat(maxBet) || 50000,
        betDelay: parseInt(betDelay) || 0,
        runners: validRunners.map((r) => ({
          name: r.name,
          back: r.back
            .filter((b) => b.price)
            .map((b) => ({ price: parseFloat(b.price), size: parseFloat(b.size) || 0 })),
          lay: r.lay
            .filter((l) => l.price)
            .map((l) => ({ price: parseFloat(l.price), size: parseFloat(l.size) || 0 })),
        })),
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Create Custom Market
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Market Name</label>
            <input
              type="text"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              placeholder="e.g. Custom Bookmaker"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Type</label>
              <select
                value={bettingType}
                onChange={(e) => setBettingType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ODDS">ODDS</option>
                <option value="BOOKMAKER">BOOKMAKER</option>
                <option value="LINE">LINE</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Min Bet</label>
              <input
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Max Bet</label>
              <input
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Delay (s)</label>
              <input
                type="number"
                value={betDelay}
                onChange={(e) => setBetDelay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Runners */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 font-medium">
                Runners (min 1)
              </label>
              <button
                onClick={addRunner}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Add Runner
              </button>
            </div>
            <div className="space-y-3">
              {runners.map((runner, rIdx) => (
                <div key={rIdx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={runner.name}
                      onChange={(e) => updateRunnerName(rIdx, e.target.value)}
                      placeholder={`Runner ${rIdx + 1} name`}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => removeRunner(rIdx)}
                      disabled={runners.length <= 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Back */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-green-700 font-medium">
                          Back ({runner.back.length}/3)
                        </span>
                        {runner.back.length < 3 && (
                          <button
                            onClick={() => addPriceRow(rIdx, "back")}
                            className="text-[10px] text-green-600 hover:text-green-700"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                      {runner.back.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1 mb-1">
                          <input
                            type="number"
                            value={b.price}
                            onChange={(e) => updatePriceField(rIdx, "back", bIdx, "price", e.target.value)}
                            placeholder="Price"
                            step="0.01"
                            className="flex-1 px-1.5 py-1 text-xs border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            value={b.size}
                            onChange={(e) => updatePriceField(rIdx, "back", bIdx, "size", e.target.value)}
                            placeholder="Size"
                            className="flex-1 px-1.5 py-1 text-xs border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                          />
                          {runner.back.length > 1 && (
                            <button
                              onClick={() => removePriceRow(rIdx, "back", bIdx)}
                              className="text-red-400 hover:text-red-600 text-sm"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Lay */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-red-700 font-medium">
                          Lay ({runner.lay.length}/3)
                        </span>
                        {runner.lay.length < 3 && (
                          <button
                            onClick={() => addPriceRow(rIdx, "lay")}
                            className="text-[10px] text-red-600 hover:text-red-700"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                      {runner.lay.map((l, lIdx) => (
                        <div key={lIdx} className="flex items-center gap-1 mb-1">
                          <input
                            type="number"
                            value={l.price}
                            onChange={(e) => updatePriceField(rIdx, "lay", lIdx, "price", e.target.value)}
                            placeholder="Price"
                            step="0.01"
                            className="flex-1 px-1.5 py-1 text-xs border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            value={l.size}
                            onChange={(e) => updatePriceField(rIdx, "lay", lIdx, "size", e.target.value)}
                            placeholder="Size"
                            className="flex-1 px-1.5 py-1 text-xs border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                          />
                          {runner.lay.length > 1 && (
                            <button
                              onClick={() => removePriceRow(rIdx, "lay", lIdx)}
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
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createCustom.isPending}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {createCustom.isPending && <Spinner size={14} />}
            {createCustom.isPending ? "Creating..." : "Create Market"}
          </button>
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
export default function MarketManagementPage() {
  const [eventId, setEventId] = useState("");
  const [activeEventId, setActiveEventId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"markets" | "history">("markets");
  const [filter, setFilter] = useState<"all" | "active" | "custom" | "disabled">(
    "all"
  );

  const { markets: rawMarkets, isConnected, status } = useMarketWebSocket(
    activeEventId || ""
  );

  const { data: savedMarkets } = useMarketsByEvent(activeEventId || null);

  const handleLoadEvent = useCallback(() => {
    const trimmed = eventId.trim();
    if (!trimmed) {
      toast.error("Enter an Event ID");
      return;
    }
    setActiveEventId(trimmed);
  }, [eventId]);

  const markets = rawMarkets.filter((m: any) => {
    if (filter === "active") return !m.adminDisabled && !m.adminHidden;
    if (filter === "custom") return m.isCustom || m.marketType === "CUSTOM";
    if (filter === "disabled") return m.adminDisabled || m.adminHidden;
    return true;
  });

  const customCount = rawMarkets.filter(
    (m: any) => m.isCustom || m.marketType === "CUSTOM"
  ).length;
  const disabledCount = rawMarkets.filter(
    (m: any) => m.adminDisabled || m.adminHidden
  ).length;

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Market Management</h1>
          <p className="text-gray-600 mt-1">
            View live markets, manage settings, create custom markets, and review
            odds history
          </p>
        </div>

        {/* Event ID Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoadEvent()}
            placeholder="Enter Event ID (Match ID) e.g. 34110895"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLoadEvent}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load
          </button>
        </div>

        {/* Active Event Area */}
        {activeEventId && (
          <>
            {/* Connection Status + Actions */}
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                + Custom Market
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("markets")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "markets"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Markets ({rawMarkets.length})
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
                      { key: "custom", label: `Custom (${customCount})` },
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
              Enter an Event ID to get started
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              You will see live markets, can customize settings, create custom
              markets, and view price history
            </p>
          </div>
        )}

        {/* Create Custom Market Modal */}
        {showCreateModal && activeEventId && (
          <CreateCustomMarketForm
            eventId={activeEventId}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
}
