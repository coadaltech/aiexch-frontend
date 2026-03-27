"use client";

import { useState, useRef, useEffect } from "react";
import {
  useCreateCustomMarket,
  useDeleteCustomMarket,
  useUpdateCustomOdds,
  useUpdateCustomMarketDetails,
  useListCustomMarkets,
  useCustomMarketDetails,
  useSearchEvents,
} from "@/hooks/useOwner";
import { toast } from "sonner";

// ─── Spinner ───
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

// ─── Toggle ───
function Toggle({
  checked, onChange, loading, disabled, label,
}: {
  checked: boolean; onChange: (val: boolean) => void; loading?: boolean; disabled?: boolean; label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
      {label && <span className="text-[10px] text-gray-500 font-medium">{label}</span>}
      {loading ? (
        <div className="h-5 flex items-center justify-center text-blue-500"><Spinner size={14} /></div>
      ) : (
        <button
          type="button" disabled={disabled} onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? "bg-green-500" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      )}
    </div>
  );
}

// ─── Helper: convert DB bettingType integer to string ───
function bettingTypeToString(bt: any): string {
  if (typeof bt === "string") return bt;
  // DB enum: 0=MatchOdds/ODDS, 1=Bookmaker, 2=Line
  const map: Record<number, string> = { 0: "ODDS", 1: "BOOKMAKER", 2: "LINE" };
  return map[bt] || "ODDS";
}

// ─── Event Search Dropdown ───
function EventSearchDropdown({ onSelect }: { onSelect: (eventId: string, eventName: string) => void }) {
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: results, isLoading } = useSearchEvents(query);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        type="text" value={query}
        onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
        onFocus={() => query.trim().length >= 2 && setShowDrop(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const trimmed = query.trim();
            if (trimmed && /^\d+$/.test(trimmed)) {
              onSelect(trimmed, `Event ${trimmed}`);
              setShowDrop(false);
            } else if (results && results.length > 0) {
              onSelect(results[0].eventId, results[0].name);
              setQuery(results[0].name);
              setShowDrop(false);
            }
          }
        }}
        placeholder="Search event by name, team, or Event ID..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500"><Spinner size={14} /></div>
      )}
      {showDrop && query.trim().length >= 2 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2"><Spinner size={14} /> Searching...</div>
          ) : results && results.length > 0 ? (
            results.map((event: any) => (
              <button key={event.eventId} onClick={() => { onSelect(event.eventId, event.name); setQuery(event.name); setShowDrop(false); }}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 text-sm">
                <div className="font-medium text-gray-800 truncate">{event.name}</div>
                <div className="text-xs text-gray-500">
                  {event.sportName} | {event.seriesName} | {event.eventId}
                  {event.inPlay && <span className="ml-2 px-1 py-0.5 text-[10px] bg-green-100 text-green-700 rounded">LIVE</span>}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">No events found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create Custom Market Modal ───
function CreateCustomMarketModal({ onClose }: { onClose: () => void }) {
  const createCustom = useCreateCustomMarket();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventName, setSelectedEventName] = useState("");
  const [marketName, setMarketName] = useState("");
  const [bettingType, setBettingType] = useState("ODDS");
  const [minBet, setMinBet] = useState("100");
  const [maxBet, setMaxBet] = useState("50000");
  const [betDelay, setBetDelay] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [runners, setRunners] = useState([{ name: "" }, { name: "" }]);

  const handleCreate = () => {
    if (!selectedEventId) { toast.error("Please select an event"); return; }
    if (!marketName.trim()) { toast.error("Market name is required"); return; }
    const validRunners = runners.filter((r) => r.name.trim());
    if (validRunners.length < 1) { toast.error("At least 1 runner is required"); return; }

    createCustom.mutate(
      {
        eventId: selectedEventId,
        marketName,
        bettingType,
        minBet: parseFloat(minBet) || 100,
        maxBet: parseFloat(maxBet) || 50000,
        betDelay: parseInt(betDelay) || 0,
        isActive,
        runners: validRunners.map((r) => ({ name: r.name })),
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Create Custom Market</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Event</label>
            {selectedEventId ? (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-800">{selectedEventName}</span>
                  <span className="ml-2 text-xs text-gray-500 font-mono">{selectedEventId}</span>
                </div>
                <button onClick={() => { setSelectedEventId(""); setSelectedEventName(""); }} className="text-xs text-red-500 hover:text-red-700">Change</button>
              </div>
            ) : (
              <EventSearchDropdown onSelect={(id, name) => { setSelectedEventId(id); setSelectedEventName(name); }} />
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Market Name</label>
            <input type="text" value={marketName} onChange={(e) => setMarketName(e.target.value)} placeholder="e.g. Custom Bookmaker" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Market Type</label>
              <select value={bettingType} onChange={(e) => setBettingType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm">
                <option value="ODDS">ODDS</option>
                <option value="BOOKMAKER">BOOKMAKER</option>
                <option value="LINE">LINE</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Delay (s)</label>
              <input type="number" value={betDelay} onChange={(e) => setBetDelay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Min Bet</label>
              <input type="number" value={minBet} onChange={(e) => setMinBet(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Max Bet</label>
              <input type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Status:</label>
            <Toggle checked={isActive} onChange={setIsActive} label={isActive ? "Active" : "Inactive"} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 font-medium">Runners (max 3)</label>
              {runners.length < 3 && (
                <button onClick={() => setRunners([...runners, { name: "" }])} className="text-xs text-blue-600 hover:text-blue-700">+ Add Runner</button>
              )}
            </div>
            <div className="space-y-2">
              {runners.map((runner, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={runner.name} onChange={(e) => { const u = [...runners]; u[idx] = { name: e.target.value }; setRunners(u); }}
                    placeholder={`Runner ${idx + 1} name`} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                  {runners.length > 1 && (
                    <button onClick={() => setRunners(runners.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-lg">&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleCreate} disabled={createCustom.isPending} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {createCustom.isPending && <Spinner size={14} />}
            {createCustom.isPending ? "Creating..." : "Create Market"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Custom Market Modal ───
function EditCustomMarketModal({ market, onClose }: { market: any; onClose: () => void }) {
  const updateMarket = useUpdateCustomMarketDetails();
  const [marketName, setMarketName] = useState(market.marketName || "");
  const [bettingType, setBettingType] = useState(bettingTypeToString(market.bettingType));
  const [minBet, setMinBet] = useState(String(market.minBet || "100"));
  const [maxBet, setMaxBet] = useState(String(market.maxBet || "50000"));
  const [betDelay, setBetDelay] = useState(String(market.betDelay || "0"));
  const [isActive, setIsActive] = useState(market.isActive ?? true);
  const [runners, setRunners] = useState<{ selectionId?: number; name: string }[]>(
    (market.runners || []).map((r: any) => ({ selectionId: r.selectionId, name: r.name }))
  );

  const handleSave = () => {
    if (!marketName.trim()) { toast.error("Market name is required"); return; }
    updateMarket.mutate(
      {
        marketId: market.marketId,
        marketName,
        bettingType,
        minBet: parseFloat(minBet) || 100,
        maxBet: parseFloat(maxBet) || 50000,
        betDelay: parseInt(betDelay) || 0,
        isActive,
        runners,
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Edit Custom Market</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Market Name</label>
            <input type="text" value={marketName} onChange={(e) => setMarketName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Market Type</label>
              <select value={bettingType} onChange={(e) => setBettingType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm">
                <option value="ODDS">ODDS</option>
                <option value="BOOKMAKER">BOOKMAKER</option>
                <option value="LINE">LINE</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Delay (s)</label>
              <input type="number" value={betDelay} onChange={(e) => setBetDelay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Min Bet</label>
              <input type="number" value={minBet} onChange={(e) => setMinBet(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Max Bet</label>
              <input type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Status:</label>
            <Toggle checked={isActive} onChange={setIsActive} label={isActive ? "Active" : "Inactive"} />
          </div>
          <div>
            <label className="text-sm text-gray-600 font-medium block mb-2">Runner Names</label>
            <div className="space-y-2">
              {runners.map((runner, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                  <input type="text" value={runner.name}
                    onChange={(e) => { const u = [...runners]; u[idx] = { ...u[idx], name: e.target.value }; setRunners(u); }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={updateMarket.isPending} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {updateMarket.isPending && <Spinner size={14} />}
            {updateMarket.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Market Price Modal ───
function ManageMarketPriceModal({ market, onClose }: { market: any; onClose: () => void }) {
  const { data: details, isLoading } = useCustomMarketDetails(market.marketId);
  const updateOdds = useUpdateCustomOdds();
  const runners = details?.runners || [];

  const [selectedRunner, setSelectedRunner] = useState(0);
  const [backLayDiff, setBackLayDiff] = useState(1);
  const [addDiffs, setAddDiffs] = useState<number[]>([]);
  const [backPrices, setBackPrices] = useState<string[]>([]);
  const [ballRunning, setBallRunning] = useState<boolean[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize state ONLY on first load, not on every details change
  useEffect(() => {
    if (runners.length > 0 && !initialized) {
      setAddDiffs(runners.map(() => 25));
      setBackPrices(runners.map((r: any) => {
        const bp = r.backPrices?.[0]?.price;
        return bp != null ? String(bp) : "";
      }));
      setBallRunning(runners.map(() => false));
      setInitialized(true);
    }
  }, [runners, initialized]);

  const computeLay = (backStr: string, diff: number) => {
    const back = parseFloat(backStr);
    if (isNaN(back)) return { layInput: 0 };
    return { layInput: back + diff };
  };

  const computeFinalBack = (backStr: string) => {
    const back = parseFloat(backStr);
    return isNaN(back) ? 0 : back;
  };

  const computeFinalLay = (backStr: string, diff: number, addDiff: number) => {
    const back = parseFloat(backStr);
    if (isNaN(back)) return 0;
    return parseFloat((back + diff + addDiff / 100).toFixed(2));
  };

  const handleSubmitPrice = (runnerIdx: number) => {
    const runner = runners[runnerIdx];
    if (!runner) return;
    const backVal = parseFloat(backPrices[runnerIdx]);
    if (isNaN(backVal)) { toast.error("Enter a valid back price"); return; }

    const finalBack = computeFinalBack(backPrices[runnerIdx]);
    const finalLay = computeFinalLay(backPrices[runnerIdx], backLayDiff, addDiffs[runnerIdx]);

    updateOdds.mutate({
      marketId: market.marketId,
      selectionId: String(runner.selectionId),
      back: [{ price: finalBack, size: 0 }],
      lay: [{ price: finalLay, size: 0 }],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, runnerIdx: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitPrice(runnerIdx);
    }
  };

  const toggleBallRunning = (idx: number) => {
    const updated = [...ballRunning];
    updated[idx] = !updated[idx];
    setBallRunning(updated);

    const runner = runners[idx];
    if (runner) {
      if (!updated[idx]) {
        handleSubmitPrice(idx);
      } else {
        updateOdds.mutate({
          marketId: market.marketId,
          selectionId: String(runner.selectionId),
          back: [{ price: 0, size: 0 }],
          lay: [{ price: 0, size: 0 }],
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8"><Spinner size={24} /></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Manage Prices - {market.marketName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Top controls */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-wrap">
          {runners.map((_: any, idx: number) => (
            <label key={idx} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="selectedRunner" checked={selectedRunner === idx} onChange={() => setSelectedRunner(idx)} className="accent-blue-600" />
              <span className={`text-sm font-medium ${selectedRunner === idx ? "text-blue-700" : "text-gray-600"}`}>
                Runner {idx + 1} Is Active
              </span>
            </label>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Back/Lay Diff</span>
            <select value={backLayDiff} onChange={(e) => setBackLayDiff(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none">
              {[1, 2, 3, 5, 10, 20].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Runner rows */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_90px_80px_80px_60px_60px_60px] gap-1 px-3 py-2 bg-yellow-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
            <span>Runner Name</span>
            <span className="text-center">Back</span>
            <span className="text-center">Bowl Chalu</span>
            <span className="text-center">Lay</span>
            <span className="text-center">Add Dif</span>
            <span></span>
            <span className="text-center text-green-700">Back</span>
            <span className="text-center text-red-700">Lay</span>
          </div>

          {runners.map((runner: any, idx: number) => {
            const { layInput } = computeLay(backPrices[idx] || "", backLayDiff);
            const finalBack = computeFinalBack(backPrices[idx] || "");
            const finalLay = computeFinalLay(backPrices[idx] || "", backLayDiff, addDiffs[idx] || 25);
            const isSelected = selectedRunner === idx;

            return (
              <div key={idx} className={`grid grid-cols-[1fr_80px_90px_80px_80px_60px_60px_60px] gap-1 px-3 py-2 items-center border-b border-gray-100 ${isSelected ? "bg-yellow-50" : "bg-white"}`}>
                <span className="text-sm font-medium text-gray-800 truncate">{runner.name}</span>

                <input
                  type="number" value={backPrices[idx] || ""}
                  onChange={(e) => { const u = [...backPrices]; u[idx] = e.target.value; setBackPrices(u); }}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  disabled={!isSelected || ballRunning[idx]}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  step="0.01"
                />

                <button onClick={() => toggleBallRunning(idx)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${ballRunning[idx] ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"}`}>
                  {ballRunning[idx] ? "Ball Running" : "Bowl Chalu"}
                </button>

                <div className="text-center text-sm text-gray-600 bg-gray-50 rounded py-1">
                  {backPrices[idx] ? layInput : 0}
                </div>

                <select value={addDiffs[idx] || 25}
                  onChange={(e) => { const u = [...addDiffs]; u[idx] = parseInt(e.target.value); setAddDiffs(u); }}
                  disabled={!isSelected}
                  className="w-full px-1 py-1 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100">
                  {[25, 50, 75].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>

                <div />

                <div className="text-center text-sm font-bold text-green-700 bg-green-50 rounded py-1">
                  {backPrices[idx] ? finalBack : 0}
                </div>
                <div className="text-center text-sm font-bold text-red-700 bg-red-50 rounded py-1">
                  {backPrices[idx] ? finalLay : 0}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Enter Back price, press Tab then Enter to save. Lay = Back + Back/Lay Diff. Final Lay = Lay + (Add Diff / 100).
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function CustomMarketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMarket, setEditingMarket] = useState<any>(null);
  const [managingMarket, setManagingMarket] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const deleteCustom = useDeleteCustomMarket();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: customMarkets, isLoading } = useListCustomMarkets({
    search: debouncedSearch || undefined,
    status: statusFilter,
  });

  const handleDelete = (market: any) => {
    if (!confirm(`Delete custom market "${market.marketName}"?`)) return;
    deleteCustom.mutate(market.marketId);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Custom Market Management</h1>
        <p className="text-gray-600 mt-1">Create and manage custom markets, set prices, and control market status</p>
      </div>

      {/* Search + Create */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by market name, event name, team name, event ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
          + Create Custom Market
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "active", "inactive"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Markets List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={24} /></div>
      ) : !customMarkets || customMarkets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? "No custom markets found matching your search" : "No custom markets yet. Create one to get started."}
        </div>
      ) : (
        <div className="space-y-2">
          {customMarkets.map((market: any) => (
            <div key={market.marketId} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 text-sm">{market.marketName}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${market.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {market.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                      {market.marketType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Event: <span className="font-medium text-gray-600">{market.eventName}</span>
                    <span className="mx-1.5 text-gray-300">|</span>
                    Event ID: <span className="font-mono text-gray-600">{market.eventId}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Runners: {(market.runners || []).map((r: any) => r.name).join(", ")}
                    <span className="mx-1.5 text-gray-300">|</span>
                    Min: {market.minBet || "-"} / Max: {market.maxBet || "-"} / Delay: {market.betDelay ?? 0}s
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button onClick={() => setEditingMarket(market)}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">Edit</button>
                  <button onClick={() => setManagingMarket(market)}
                    className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium">Manage Prices</button>
                  <button onClick={() => handleDelete(market)} disabled={deleteCustom.isPending}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateCustomMarketModal onClose={() => setShowCreateModal(false)} />}
      {editingMarket && <EditCustomMarketModal market={editingMarket} onClose={() => setEditingMarket(null)} />}
      {managingMarket && <ManageMarketPriceModal market={managingMarket} onClose={() => setManagingMarket(null)} />}
    </div>
  );
}
