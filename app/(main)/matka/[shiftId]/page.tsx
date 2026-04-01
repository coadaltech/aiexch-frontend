"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useMatkaShift,
  useMatkaShifts,
  useMatkaJantri,
  usePlaceMatka,
} from "@/hooks/useMatkaApi";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, AlertCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { toast } from "sonner";

function useShiftCountdown(
  shiftDate?: string,
  endTime?: string,
  nextDayAllow?: boolean
) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!shiftDate || !endTime) return;

    const calcTarget = () => {
      const [h, m] = endTime.split(":").map(Number);
      const target = new Date(shiftDate);
      target.setHours(h, m, 0, 0);
      if (nextDayAllow) {
        target.setDate(target.getDate() + 1);
      }
      return target;
    };

    const update = () => {
      const target = calcTarget();
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Ended");
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (hrs > 0) {
        setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      } else if (mins > 0) {
        setTimeLeft(`${mins}m ${secs}s`);
      } else {
        setTimeLeft(`${secs}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [shiftDate, endTime, nextDayAllow]);

  return { timeLeft, isExpired };
}
import { RandomModal } from "./random-modal";
import { CrossModal } from "./cross-modal";
import { FromToModal } from "./fromto-modal";
import { Random2Modal } from "./random2-modal";

/*
 * Number system:
 *   Dara      : 1–100  (type 1, stored as "1"–"100")
 *   Bahar (B) : B1=111, B2=222 … B9=999  (type 2, stored as "111"–"999")
 *   Ander (A) : A1=1111, A2=2222 … A9=9999 (type 3, stored as "1111"–"9999")
 *
 * In quick-entry the user can type any of:
 *   1-100          → dara
 *   111-999        → bahar akhar  (only repeated-digit like 111,222…999)
 *   1111-9999      → ander akhar  (only repeated-digit like 1111,2222…9999)
 */

const COLS = 10;
const ROWS = 10;

function buildMainGrid(): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(String(r * COLS + c + 1));
    }
    grid.push(row);
  }
  return grid;
}

const MAIN_GRID = buildMainGrid();

// B row labels → actual number stored
const B_LABELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const bLabelToNum = (d: number) => (d === 0 ? null : String(d).repeat(3)); // B1→"111"
// A row labels → actual number stored
const A_LABELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const aLabelToNum = (d: number) => (d === 0 ? null : String(d).repeat(4)); // A1→"1111"

// 3-digit repeated set: {111,222,...,999}
const BAHAR_SET = new Set(
  Array.from({ length: 9 }, (_, i) => String(i + 1).repeat(3))
);
// 4-digit repeated set: {1111,2222,...,9999}
const ANDER_SET = new Set(
  Array.from({ length: 9 }, (_, i) => String(i + 1).repeat(4))
);

/** Parse any user input into { key, numberType }. Returns null if invalid. */
function parseNumberInput(
  raw: string
): { key: string; numberType: number } | null {
  const s = raw.trim();
  if (!s) return null;

  // 4-digit repeated → ander akhar
  if (ANDER_SET.has(s)) return { key: `3:${s}`, numberType: 3 };
  // 3-digit repeated → bahar akhar
  if (BAHAR_SET.has(s)) return { key: `2:${s}`, numberType: 2 };
  // 1-100 → dara
  const n = parseInt(s, 10);
  if (!isNaN(n) && n >= 1 && n <= 100 && String(n) === s)
    return { key: `1:${n}`, numberType: 1 };

  return null;
}

type BetMode = "grid" | "quick";

interface QuickEntry {
  id: number;
  numberInput: string;
  amount: string;
}

export default function JantriPage() {
  const params = useParams();
  const router = useRouter();
  const shiftId = params.shiftId as string;
  const { isLoggedIn } = useAuth();

  const { data: shift, isLoading: shiftLoading } = useMatkaShift(shiftId);
  const { data: jantriTotals = [] } = useMatkaJantri(shiftId);
  const placeMutation = usePlaceMatka();

  // All shifts for right sidebar
  const today = new Date().toISOString().split("T")[0];
  const { data: allShifts = [] } = useMatkaShifts(
    shift?.shiftDate || today
  );
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(
    new Set()
  );

  // Initialise current shift as selected
  useEffect(() => {
    if (shiftId) {
      setSelectedShifts(new Set([shiftId]));
    }
  }, [shiftId]);

  const toggleShift = useCallback((id: string) => {
    setSelectedShifts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Amounts (single source of truth) ─────────────────────────────────
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<BetMode>("quick");

  // Quick entry
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);
  const nextId = useRef(1);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const gridFirstCellRef = useRef<HTMLInputElement>(null);
  const [draftNumber, setDraftNumber] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [crossModalOpen, setCrossModalOpen] = useState(false);
  const [fromToModalOpen, setFromToModalOpen] = useState(false);
  const [random2ModalOpen, setRandom2ModalOpen] = useState(false);

  // F4 to open Random modal, F6 to open Cross modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F4") {
        e.preventDefault();
        setRandomModalOpen(true);
      }
      if (e.key === "F6") {
        e.preventDefault();
        setCrossModalOpen(true);
      }
      if (e.key === "F7") {
        e.preventDefault();
        setFromToModalOpen(true);
      }
      if (e.key === "F8") {
        e.preventDefault();
        setRandom2ModalOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Handle Random/Cross modal save → merge into amounts + quick entries
  const handleRandomSave = useCallback(
    (entries: { number: string; amount: number }[]) => {
      // Update amounts (source of truth for grid)
      setAmounts((prev) => {
        const next = { ...prev };
        for (const entry of entries) {
          const parsed = parseNumberInput(entry.number);
          if (parsed) {
            next[parsed.key] = (next[parsed.key] || 0) + entry.amount;
          }
        }
        return next;
      });

      // Also add to quick entries so they show in quick mode
      const newQuickEntries: QuickEntry[] = entries
        .filter((e) => parseNumberInput(e.number))
        .map((e) => ({
          id: nextId.current++,
          numberInput: e.number,
          amount: String(e.amount),
        }));

      if (newQuickEntries.length > 0) {
        setQuickEntries((prev) => [...prev, ...newQuickEntries]);
      }
    },
    []
  );

  // F12 to switch view
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        setMode((prev) => {
          const next = prev === "grid" ? "quick" : "grid";
          if (prev === "grid" && next === "quick") {
            // Build quick entries from amounts
            const entries: QuickEntry[] = Object.entries(amounts)
              .filter(([, v]) => v > 0)
              .map(([key, val]) => ({
                id: nextId.current++,
                numberInput: key.split(":")[1],
                amount: String(val),
              }));
            setQuickEntries(entries);
          } else if (prev === "quick" && next === "grid") {
            // Sync quick entries → amounts
            syncQuickToAmounts([
              ...quickEntries,
              ...(draftNumber && draftAmount
                ? [
                    {
                      id: 0,
                      numberInput: draftNumber,
                      amount: draftAmount,
                    },
                  ]
                : []),
            ]);
            // Focus grid cell #1 after render
            setTimeout(() => gridFirstCellRef.current?.focus(), 50);
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [amounts, quickEntries, draftNumber, draftAmount]);

  // ── Sync helpers ──────────────────────────────────────────────────────
  const syncQuickToAmounts = useCallback((entries: QuickEntry[]) => {
    const next: Record<string, number> = {};
    for (const entry of entries) {
      const parsed = parseNumberInput(entry.numberInput);
      const amt = parseInt(entry.amount, 10);
      if (parsed && amt > 0) {
        next[parsed.key] = (next[parsed.key] || 0) + amt;
      }
    }
    setAmounts(next);
  }, []);

  // ── Totals from server ────────────────────────────────────────────────
  const totalsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of jantriTotals) {
      map[`${t.numberType}:${t.number}`] = Number(t.totalAmount);
    }
    return map;
  }, [jantriTotals]);

  // ── Grid helpers ──────────────────────────────────────────────────────
  const setAmount = useCallback((key: string, value: string) => {
    const num = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setAmounts((prev) => {
      if (num === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: num };
    });
  }, []);

  const rowTotals = useMemo(() => {
    const totals: number[] = new Array(ROWS).fill(0);
    for (const [key, val] of Object.entries(amounts)) {
      const [type, num] = key.split(":");
      if (type === "1") totals[Math.floor((parseInt(num) - 1) / COLS)] += val;
    }
    return totals;
  }, [amounts]);

  const colTotals = useMemo(() => {
    const totals: number[] = new Array(COLS).fill(0);
    for (const [key, val] of Object.entries(amounts)) {
      const [type, num] = key.split(":");
      if (type === "1") totals[(parseInt(num) - 1) % COLS] += val;
    }
    return totals;
  }, [amounts]);

  const grandTotal = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + v, 0),
    [amounts]
  );

  // ── Quick entry: add from draft inputs ────────────────────────────────
  const addFromDraft = useCallback(() => {
    const parsed = parseNumberInput(draftNumber);
    const amt = parseInt(draftAmount, 10);
    if (!parsed) {
      toast.error("Invalid number");
      numberInputRef.current?.focus();
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      amountInputRef.current?.focus();
      return;
    }
    const entry: QuickEntry = {
      id: nextId.current++,
      numberInput: draftNumber,
      amount: draftAmount,
    };
    setQuickEntries((prev) => {
      const updated = [...prev, entry];
      syncQuickToAmounts(updated);
      return updated;
    });
    setDraftNumber("");
    setDraftAmount("");
    numberInputRef.current?.focus();
  }, [draftNumber, draftAmount, syncQuickToAmounts]);

  const removeQuickEntry = useCallback(
    (id: number) => {
      setQuickEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        syncQuickToAmounts(next);
        return next;
      });
    },
    [syncQuickToAmounts]
  );

  // ── Clear all ─────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setAmounts({});
    setQuickEntries([]);
    setDraftNumber("");
    setDraftAmount("");
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isLoggedIn) {
      window.dispatchEvent(new Event("openAuthModal"));
      return;
    }

    const bets = Object.entries(amounts)
      .filter(([, v]) => v > 0)
      .map(([key, amount]) => {
        const [type, number] = key.split(":");
        return { number, numberType: parseInt(type), amount };
      });

    if (bets.length === 0) {
      toast.error("No bets to submit");
      return;
    }
    if (selectedShifts.size === 0) {
      toast.error("Select at least one shift");
      return;
    }

    setSubmitting(true);
    try {
      // Place on all selected shifts
      const promises = Array.from(selectedShifts).map((sid) =>
        placeMutation.mutateAsync({ shiftId: sid, bets })
      );
      await Promise.all(promises);
      toast.success(
        `Bet placed on ${selectedShifts.size} shift(s)! Total: ₹${grandTotal * selectedShifts.size}`
      );
      handleClear();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to place bet");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Countdown timer ──────────────────────────────────────────────────
  const { timeLeft, isExpired: shiftEnded } = useShiftCountdown(
    shift?.shiftDate,
    shift?.endTime,
    shift?.nextDayAllow
  );

  // ── Auto-redirect when shift ends ──────────────────────────────────
  useEffect(() => {
    if (shiftEnded && shift) {
      toast.error("Shift has ended. Redirecting...");
      const timeout = setTimeout(() => router.push("/matka"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [shiftEnded, shift, router]);

  // ── Jantri open check ─────────────────────────────────────────────────
  const isJantriOpen = useMemo(() => {
    if (shiftEnded) return false;
    if (!shift?.mainJantriTime) return true;
    const now = new Date();
    const [h, m] = shift.mainJantriTime.split(":").map(Number);
    const t = new Date(shift.shiftDate);
    t.setHours(h, m, 0, 0);
    if (shift.nextDayAllow) {
      t.setDate(t.getDate() + 1);
    }
    return now < t;
  }, [shift, shiftEnded]);

  if (shiftLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#0c314d] min-h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#79a430]" />
      </div>
    );
  }
  if (!shift) {
    return (
      <div className="text-center py-20 text-white/50 bg-[#0c314d] min-h-full">
        Shift not found
      </div>
    );
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const entryCount = Object.keys(amounts).length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 bg-[#174b73] text-white px-2 sm:px-4 py-2 text-sm flex-wrap border-b border-[#1b5785]/60">
        <button
          onClick={() => router.push("/matka")}
          className="hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold uppercase font-condensed tracking-wide">{shift.name}</span>
        <span className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
          shiftEnded ? "bg-red-600" : "bg-[#79a430]/20 border border-[#79a430]/40 text-[#79a430]"
        }`}>
          <Clock className="w-3 h-3" />
          {timeLeft}
        </span>
        <div className="flex-1" />
        <span className="bg-[#0f3d5e] border border-[#1b5785]/60 rounded-lg px-2 py-0.5 text-xs">
          Rate: {shift.daraRate}/{shift.akharRate}
        </span>
        {Number(shift.capping) > 0 && (
          <span className="bg-[#0f3d5e] border border-[#1b5785]/60 rounded-lg px-2 py-0.5 text-xs">
            Cap: ₹{shift.capping}
          </span>
        )}
        <span className="bg-[#0f3d5e] border border-[#1b5785]/60 rounded-lg px-2 py-0.5 text-xs hidden sm:inline">
          Date: {fmtDate(shift.shiftDate)}
        </span>
        {!isJantriOpen && (
          <span className="bg-red-600 rounded-lg px-2 py-0.5 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Closed
          </span>
        )}
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="lg:hidden bg-[#0f3d5e] hover:bg-[#1b5785] border border-[#1b5785]/60 rounded-lg px-2 py-0.5 text-xs flex items-center gap-1"
        >
          Shifts {sidebarOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* ── Mobile sidebar (collapsible) ─────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden border-b border-[#1b5785]/40 bg-[#0a2a42] max-h-48 overflow-auto">
          <div className="bg-[#174b73] text-white text-center text-sm font-bold py-1.5 uppercase font-condensed">
            {shift.name} {isJantriOpen ? "[LIVE]" : ""}
          </div>
          <label className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1b5785]/40 cursor-pointer hover:bg-[#0f3d5e]">
            <input
              type="checkbox"
              checked={selectedShifts.size === allShifts.length}
              onChange={() => {
                if (selectedShifts.size === allShifts.length) {
                  setSelectedShifts(new Set([shiftId]));
                } else {
                  setSelectedShifts(new Set(allShifts.map((s) => s.id)));
                }
              }}
              className="h-4 w-4 rounded border-[#1b5785]"
            />
            <span className="text-xs text-white font-medium">Select All</span>
          </label>
          {allShifts
            .filter((s) => s.id !== shiftId)
            .map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1b5785]/30 cursor-pointer hover:bg-[#0f3d5e]"
              >
                <input
                  type="checkbox"
                  checked={selectedShifts.has(s.id)}
                  onChange={() => toggleShift(s.id)}
                  className="h-4 w-4 rounded border-[#1b5785]"
                />
                <span className="text-sm text-white">{s.name}</span>
              </label>
            ))}
          <div className="bg-red-700 text-white text-center text-sm font-bold py-1.5">
            Grand Total: {grandTotal}
          </div>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT: Grid / Quick Entry ═══ */}
        <div className="flex-1 overflow-auto p-1 sm:p-2 bg-[#0c314d]">
          {mode === "grid" ? (
            /* ── GRID VIEW ─────────────────────────────────────────── */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm table-fixed min-w-[500px]">
                <thead>
                  <tr>
                    {Array.from({ length: COLS }, (_, i) => (
                      <th
                        key={i}
                        className="bg-[#174b73] text-white text-center py-1.5 px-1 font-bold border border-[#1b5785]/60"
                      >
                        {i + 1}
                      </th>
                    ))}
                    <th className="bg-[#174b73] text-white text-center py-1.5 px-1 font-bold border border-[#1b5785]/60">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Main 10x10 grid */}
                  {MAIN_GRID.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((num) => {
                        const key = `1:${num}`;
                        const val = amounts[key];
                        const existing = totalsMap[key] || 0;
                        return (
                          <td
                            key={num}
                            className="border border-[#1b5785]/40 p-0 bg-[#0a2a42] relative"
                          >
                            <span className="absolute top-0 left-0.5 text-[#f0a050] text-[10px] leading-none">
                              {num}
                            </span>
                            <input
                              ref={num === "1" ? gridFirstCellRef : undefined}
                              type="number"
                              min={0}
                              value={val || ""}
                              onChange={(e) => setAmount(key, e.target.value)}
                              disabled={!isJantriOpen}
                              className="w-full bg-transparent text-white text-center text-sm pt-4 pb-1 px-0 focus:outline-none focus:bg-[#174b73]/30 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            {existing > 0 && (
                              <span className="absolute bottom-0 right-0.5 text-[9px] text-[#79a430]">
                                {existing}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-[#1b5785]/60 bg-[#174b73]/30 text-white text-center text-sm font-semibold px-1 py-1.5">
                        {rowTotals[rowIdx] || 0}
                      </td>
                    </tr>
                  ))}

                  {/* Column totals row */}
                  <tr>
                    {colTotals.map((t, i) => (
                      <td
                        key={i}
                        className="border border-[#1b5785]/60 bg-[#174b73]/40 text-white text-center font-bold py-1"
                      >
                        {t}
                      </td>
                    ))}
                    <td className="border border-[#1b5785]/60 bg-[#174b73]/40 text-white text-center font-bold py-1">
                      {grandTotal}
                    </td>
                  </tr>

                  {/* B row (Bahar Akhar) */}
                  <tr>
                    {B_LABELS.map((d) => {
                      const numStr = bLabelToNum(d);
                      const key = numStr ? `2:${numStr}` : null;
                      const val = key ? amounts[key] : undefined;
                      const existing = key ? totalsMap[key] || 0 : 0;
                      return (
                        <td
                          key={`B${d}`}
                          className="border border-[#1b5785]/40 p-0 bg-[#0a2a42] relative"
                        >
                          <span className="absolute top-0 left-0.5 text-[#66c4ff] text-[10px] leading-none">
                            B{d}
                          </span>
                          {key ? (
                            <input
                              type="number"
                              min={0}
                              value={val || ""}
                              onChange={(e) => setAmount(key, e.target.value)}
                              disabled={!isJantriOpen}
                              className="w-full bg-transparent text-white text-center text-sm pt-4 pb-1 px-0 focus:outline-none focus:bg-[#174b73]/30 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <div className="pt-4 pb-1 text-center text-white/40 text-sm">
                              -
                            </div>
                          )}
                          {existing > 0 && (
                            <span className="absolute bottom-0 right-0.5 text-[9px] text-[#79a430]">
                              {existing}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-[#1b5785]/60 bg-[#174b73]/30 text-white text-center text-sm font-semibold px-1 py-1.5">
                      {B_LABELS.reduce((s, d) => {
                        const n = bLabelToNum(d);
                        return s + (n ? amounts[`2:${n}`] || 0 : 0);
                      }, 0)}
                    </td>
                  </tr>

                  {/* A row (Ander Akhar) */}
                  <tr>
                    {A_LABELS.map((d) => {
                      const numStr = aLabelToNum(d);
                      const key = numStr ? `3:${numStr}` : null;
                      const val = key ? amounts[key] : undefined;
                      const existing = key ? totalsMap[key] || 0 : 0;
                      return (
                        <td
                          key={`A${d}`}
                          className="border border-[#1b5785]/40 p-0 bg-[#0a2a42] relative"
                        >
                          <span className="absolute top-0 left-0.5 text-[#c084fc] text-[10px] leading-none">
                            A{d}
                          </span>
                          {key ? (
                            <input
                              type="number"
                              min={0}
                              value={val || ""}
                              onChange={(e) => setAmount(key, e.target.value)}
                              disabled={!isJantriOpen}
                              className="w-full bg-transparent text-white text-center text-sm pt-4 pb-1 px-0 focus:outline-none focus:bg-[#174b73]/30 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <div className="pt-4 pb-1 text-center text-white/40 text-sm">
                              -
                            </div>
                          )}
                          {existing > 0 && (
                            <span className="absolute bottom-0 right-0.5 text-[9px] text-[#79a430]">
                              {existing}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-[#1b5785]/60 bg-[#174b73]/30 text-white text-center text-sm font-semibold px-1 py-1.5">
                      {A_LABELS.reduce((s, d) => {
                        const n = aLabelToNum(d);
                        return s + (n ? amounts[`3:${n}`] || 0 : 0);
                      }, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* ── QUICK ENTRY VIEW ──────────────────────────────────── */
            <div className="flex flex-col sm:flex-row gap-3 h-full">
              {/* Left: inputs + entry list */}
              <div className="w-full sm:w-[280px] flex-shrink-0 flex flex-col">
                {/* Number + Amount inputs */}
                <div className="flex gap-1 mb-2">
                  <div className="flex-1">
                    <div className="bg-[#e6a020] text-white text-[10px] font-bold text-center py-0.5 rounded-t">
                      NUMBER
                    </div>
                    <input
                      ref={numberInputRef}
                      type="text"
                      value={draftNumber}
                      onChange={(e) => setDraftNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          amountInputRef.current?.focus();
                        }
                      }}
                      disabled={!isJantriOpen}
                      placeholder=""
                      autoFocus
                      className="w-full bg-[#0a2a42] border border-[#1b5785]/60 text-white text-center text-sm py-2 focus:outline-none focus:ring-1 focus:ring-[#79a430] disabled:opacity-40"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="bg-[#174b73] text-white text-[10px] font-bold text-center py-0.5 rounded-t">
                      AMOUNT
                    </div>
                    <input
                      ref={amountInputRef}
                      type="number"
                      min={1}
                      value={draftAmount}
                      onChange={(e) => setDraftAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFromDraft();
                        }
                      }}
                      disabled={!isJantriOpen}
                      placeholder=""
                      className="w-full bg-[#0a2a42] border border-[#1b5785]/60 text-white text-center text-sm py-2 focus:outline-none focus:ring-1 focus:ring-[#79a430] disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    onClick={addFromDraft}
                    disabled={!isJantriOpen}
                    className="self-end bg-[#79a430] hover:bg-[#8fb832] disabled:bg-[#174b73] text-white font-bold px-3 py-2 rounded-lg text-lg leading-none"
                  >
                    +
                  </button>
                </div>

                {/* Entry list */}
                <div className="flex-1 overflow-auto border border-[#1b5785]/40 rounded-lg bg-[#0a2a42]">
                  {quickEntries.length === 0 ? (
                    <div className="text-center text-white/40 text-xs py-8">
                      No entries yet
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <tbody>
                        {quickEntries.map((entry) => (
                          <tr
                            key={entry.id}
                            className="border-b border-[#1b5785]/30"
                          >
                            <td className="py-1.5 px-2 text-white font-medium text-center">
                              {entry.numberInput}
                            </td>
                            <td className="py-1.5 px-2 text-white text-right">
                              {entry.amount}
                            </td>
                            <td className="py-1 px-1 w-6">
                              <button
                                onClick={() => removeQuickEntry(entry.id)}
                                className="text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg w-5 h-5 flex items-center justify-center text-[10px] font-bold"
                              >
                                x
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Total count */}
                <div className="bg-[#174b73] text-white text-center text-sm font-semibold py-1.5 mt-1 rounded-lg">
                  Total Count : {entryCount}
                </div>
              </div>

              {/* Center: Instructions */}
              <div className="hidden sm:block flex-1 border border-[#1b5785]/40 rounded-xl bg-[#0a2a42] p-3 overflow-auto">
                <div className="bg-[#174b73] text-white text-xs font-semibold px-3 py-1.5 rounded-lg mb-3">
                  Utar Mode Instructions
                </div>
                <div className="space-y-2 text-white/70 text-xs">
                  <p>1. Dara Number: should be 1 to 100</p>
                  <p>2. Bahar Akhar Number: should be 111 to 999 (repeated digit like 111, 222, 333…999)</p>
                  <p>3. Andar Akhar Number: should be 1111 to 9999 (repeated digit like 1111, 2222…9999)</p>
                  <p>4. Press <kbd className="bg-[#174b73] px-1.5 py-0.5 rounded text-white font-mono">F12</kbd> for Jantri View</p>
                  <p>5. Press <kbd className="bg-[#174b73] px-1.5 py-0.5 rounded text-white font-mono">Enter</kbd> after amount to add entry</p>
                  <p>6. Press <kbd className="bg-[#174b73] px-1.5 py-0.5 rounded text-white font-mono">`~</kbd> for Re-Focus</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT SIDEBAR: Shift list (desktop only) ═══ */}
        <div className="hidden lg:flex w-[220px] flex-shrink-0 border-l border-[#1b5785]/40 bg-[#0a2a42] flex-col overflow-hidden">
          {/* Current shift header */}
          <div className="bg-[#174b73] text-white text-center text-sm font-bold py-2 uppercase font-condensed tracking-wide">
            {shift.name} {isJantriOpen ? "[LIVE]" : ""}
          </div>

          {/* Tick to copy */}
          <label className="flex items-center gap-2 px-3 py-2 border-b border-[#1b5785]/40 cursor-pointer hover:bg-[#0f3d5e]">
            <input
              type="checkbox"
              checked={selectedShifts.size === allShifts.length}
              onChange={() => {
                if (selectedShifts.size === allShifts.length) {
                  setSelectedShifts(new Set([shiftId]));
                } else {
                  setSelectedShifts(
                    new Set(allShifts.map((s) => s.id))
                  );
                }
              }}
              className="h-4 w-4 rounded border-[#1b5785]"
            />
            <span className="text-xs text-white font-medium">
              Tick Shift for Copy Transaction
            </span>
          </label>

          {/* Shift list */}
          <div className="flex-1 overflow-auto">
            {allShifts
              .filter((s) => s.id !== shiftId)
              .map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 border-b border-[#1b5785]/30 cursor-pointer hover:bg-[#0f3d5e]"
                >
                  <input
                    type="checkbox"
                    checked={selectedShifts.has(s.id)}
                    onChange={() => toggleShift(s.id)}
                    className="h-4 w-4 rounded border-[#1b5785]"
                  />
                  <span className="text-sm text-white">{s.name}</span>
                </label>
              ))}
          </div>

          {/* Applied narration */}
          <div className="bg-[#174b73] text-white text-[10px] font-semibold px-3 py-1">
            Applied Narration
          </div>
          <div className="bg-red-700 text-white text-center text-sm font-bold py-2">
            Grand Total: {grandTotal}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: action buttons ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-[#0a2a42] border-t border-[#1b5785]/40 text-xs flex-wrap">
        <span className="text-[#79a430] text-[11px] mr-1 sm:mr-2 hidden sm:inline">
          [ F12 = Switch View ]
        </span>
        <div className="flex-1 min-w-0" />

        <button
          onClick={() => setRandomModalOpen(true)}
          disabled={!isJantriOpen}
          className="bg-[#79a430] hover:bg-[#8fb832] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-2 sm:px-3 py-1.5 rounded-lg hidden md:block transition-colors"
        >
          Random (F4)
        </button>
        <button
          onClick={() => setCrossModalOpen(true)}
          disabled={!isJantriOpen}
          className="bg-[#79a430] hover:bg-[#8fb832] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-2 sm:px-3 py-1.5 rounded-lg hidden md:block transition-colors"
        >
          Cross (F6)
        </button>
        <button
          onClick={() => setFromToModalOpen(true)}
          disabled={!isJantriOpen}
          className="bg-[#79a430] hover:bg-[#8fb832] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-2 sm:px-3 py-1.5 rounded-lg hidden md:block transition-colors"
        >
          From-To (F7)
        </button>
        <button
          onClick={() => setRandom2ModalOpen(true)}
          disabled={!isJantriOpen}
          className="bg-[#79a430] hover:bg-[#8fb832] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-2 sm:px-3 py-1.5 rounded-lg hidden md:block transition-colors"
        >
          Random (F8)
        </button>
        <button
          disabled
          className="bg-[#174b73] text-white font-semibold px-2 sm:px-3 py-1.5 rounded-lg opacity-70 cursor-not-allowed hidden md:block"
        >
          J-Daane
        </button>

        <button
          onClick={handleClear}
          className="bg-[#174b73] hover:bg-[#1b5785] text-white font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-colors border border-[#1b5785]/60"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isJantriOpen || submitting || grandTotal === 0}
          className="bg-[#e6a020] hover:bg-[#d09018] disabled:bg-[#174b73] disabled:cursor-not-allowed text-white font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-colors"
        >
          {submitting ? "Saving..." : "Save Now"}
        </button>
      </div>

      {/* Random Modal */}
      <RandomModal
        open={randomModalOpen}
        onClose={() => setRandomModalOpen(false)}
        onSave={handleRandomSave}
      />

      {/* Cross Modal */}
      <CrossModal
        open={crossModalOpen}
        onClose={() => setCrossModalOpen(false)}
        onSave={handleRandomSave}
      />

      {/* From-To Modal */}
      <FromToModal
        open={fromToModalOpen}
        onClose={() => setFromToModalOpen(false)}
        onSave={handleRandomSave}
      />

      {/* Random2 Modal (F8) */}
      <Random2Modal
        open={random2ModalOpen}
        onClose={() => setRandom2ModalOpen(false)}
        onSave={handleRandomSave}
      />
    </div>
  );
}
