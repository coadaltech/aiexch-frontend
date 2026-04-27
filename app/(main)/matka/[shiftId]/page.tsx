"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useMatkaShift,
  useMatkaShifts,
  useMatkaJantri,
  usePlaceMatka,
  useMatkaTransaction,
  useUpdateMatka,
} from "@/hooks/useMatkaApi";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, AlertCircle, ChevronDown, ChevronUp, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { formatLocalDate } from "@/lib/date-utils";

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

  // Strip leading zeros so "01" == "1", "007" == "7", etc.
  const normalized = s.replace(/^0+/, "") || "0";

  // 4-digit repeated → ander akhar
  if (ANDER_SET.has(normalized)) return { key: `3:${normalized}`, numberType: 3 };
  // 3-digit repeated → bahar akhar
  if (BAHAR_SET.has(normalized)) return { key: `2:${normalized}`, numberType: 2 };
  // 1-100 → dara
  const n = parseInt(normalized, 10);
  if (!isNaN(n) && n >= 1 && n <= 100)
    return { key: `1:${n}`, numberType: 1 };

  return null;
}

type BetMode = "grid" | "quick";
type EntrySource = "manual" | "random" | "cross" | "fromto" | "random2";

interface QuickEntry {
  id: number;
  numberInput: string;
  amount: string;
  source?: EntrySource;
}

export default function JantriPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const shiftId = params.shiftId as string;
  const { isLoggedIn } = useAuth();

  const { data: shift, isLoading: shiftLoading } = useMatkaShift(shiftId);
  const { data: jantriTotals = [] } = useMatkaJantri(shiftId);
  const placeMutation = usePlaceMatka();
  const updateMutation = useUpdateMatka();

  // Edit mode: load existing transaction
  const { data: editTransaction } = useMatkaTransaction(editId);


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


  // ── Populate amounts + quick entries when edit transaction loads ─────────
  useEffect(() => {
    if (!editTransaction?.details?.length) return;
    const newAmounts: Record<string, number> = {};
    const newQuickEntries: QuickEntry[] = [];
    nextId.current = 1;
    for (const d of editTransaction.details) {
      const key = `${d.numberType}:${d.number}`;
      const amt = Number(d.amount);
      newAmounts[key] = amt;
      newQuickEntries.push({
        id: nextId.current++,
        numberInput: d.number,
        amount: String(Math.round(amt)),
        source: "manual" as EntrySource,
      });
    }
    setAmounts(newAmounts);
    setQuickEntries(newQuickEntries);
    setDraftNumber("");
    setDraftAmount("");
    // Clear any leftover draft so it doesn't overwrite edit data
    sessionStorage.removeItem(`matka_draft_${shiftId}`);
  }, [editTransaction?.details, shiftId]);

  // ── Session storage key ───────────────────────────────────────────────
  const storageKey = `matka_draft_${shiftId}`;

  // Restore unsaved data from sessionStorage on first mount (skip in edit mode)
  useEffect(() => {
    if (!shiftId || editId) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        amounts?: Record<string, number>;
        quickEntries?: QuickEntry[];
        draftNumber?: string;
        draftAmount?: string;
      };
      if (parsed.amounts && Object.keys(parsed.amounts).length > 0)
        setAmounts(parsed.amounts);
      if (parsed.quickEntries && parsed.quickEntries.length > 0) {
        setQuickEntries(parsed.quickEntries);
        const maxId = Math.max(0, ...parsed.quickEntries.map((e) => e.id));
        nextId.current = maxId + 1;
      }
      if (parsed.draftNumber) setDraftNumber(parsed.draftNumber);
      if (parsed.draftAmount) setDraftAmount(parsed.draftAmount);
    } catch {
      // ignore corrupt storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftId]);

  // Persist unsaved data to sessionStorage whenever it changes
  useEffect(() => {
    if (!shiftId) return;
    const data = { amounts, quickEntries, draftNumber, draftAmount };
    sessionStorage.setItem(storageKey, JSON.stringify(data));
  }, [amounts, quickEntries, draftNumber, draftAmount, shiftId, storageKey]);
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
    (entries: { number: string; amount: number }[], source: EntrySource = "manual") => {
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
          source,
        }));

      if (newQuickEntries.length > 0) {
        setQuickEntries((prev) => [...prev, ...newQuickEntries]);
      }
    },
    []
  );

  // Per-modal save handlers
  const handleRandomModalSave = useCallback(
    (entries: { number: string; amount: number }[]) => handleRandomSave(entries, "random"),
    [handleRandomSave]
  );
  const handleCrossModalSave = useCallback(
    (entries: { number: string; amount: number }[]) => handleRandomSave(entries, "cross"),
    [handleRandomSave]
  );
  const handleFromToModalSave = useCallback(
    (entries: { number: string; amount: number }[]) => handleRandomSave(entries, "fromto"),
    [handleRandomSave]
  );
  const handleRandom2ModalSave = useCallback(
    (entries: { number: string; amount: number }[]) => handleRandomSave(entries, "random2"),
    [handleRandomSave]
  );

  // Remove all entries added by a specific modal source
  const removeBySource = useCallback((source: EntrySource) => {
    setQuickEntries((prev) => {
      const toRemove = prev.filter((e) => e.source === source);
      const remaining = prev.filter((e) => e.source !== source);
      // Subtract their contributions from amounts
      setAmounts((prevAmts) => {
        const next = { ...prevAmts };
        for (const entry of toRemove) {
          const parsed = parseNumberInput(entry.numberInput);
          const amt = parseInt(entry.amount, 10);
          if (parsed && amt > 0) {
            const newVal = (next[parsed.key] || 0) - amt;
            if (newVal <= 0) delete next[parsed.key];
            else next[parsed.key] = newVal;
          }
        }
        return next;
      });
      return remaining;
    });
  }, []);

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

  // ── Grid Enter key navigation ─────────────────────────────────────────
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow only digits and control/navigation keys
      const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter"];
      if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const inputs = Array.from(
          document.querySelectorAll<HTMLInputElement>("[data-grid-input]")
        );
        const idx = inputs.indexOf(e.currentTarget);
        if (idx >= 0 && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      }
    },
    []
  );

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
      source: "manual",
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
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);


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

    setSubmitting(true);
    try {
      if (editId) {
        // Edit mode: update existing transaction
        await updateMutation.mutateAsync({ id: editId, bets });
        toast.success("Updated successfully!");
        sessionStorage.removeItem(storageKey);
        router.push("/matka/transactions");
      } else {
        // New bet: place on all selected shifts
        if (selectedShifts.size === 0) {
          toast.error("Select at least one shift");
          setSubmitting(false);
          return;
        }
        const promises = Array.from(selectedShifts).map((sid) =>
          placeMutation.mutateAsync({ shiftId: sid, bets })
        );
        await Promise.all(promises);
        toast.success(
          `Bet placed on ${selectedShifts.size} shift(s)! Total: ₹${grandTotal * selectedShifts.size}`
        );
        sessionStorage.removeItem(storageKey);
        handleClear();
      }
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
      <div className="flex items-center justify-center py-20 bg-gray-50 min-h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84c2f1]" />
      </div>
    );
  }
  if (!shift) {
    return (
      <div className="text-center py-20 text-white/50 bg-gray-50 min-h-full">
        Shift not found
      </div>
    );
  }

  const fmtDate = (d: string) =>
    formatLocalDate(d, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const entryCount = Object.keys(amounts).length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] text-white px-2 sm:px-4 py-2 text-sm flex-wrap border-b border-[#1e4088]/60">
        <button
          onClick={() => router.push("/matka")}
          className="hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold uppercase font-condensed tracking-wide">{shift.name}</span>
        <span className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
          shiftEnded ? "bg-red-600" : "bg-[#84c2f1]/20 border border-[#84c2f1]/40 text-[#84c2f1]"
        }`}>
          <Clock className="w-3 h-3" />
          {timeLeft}
        </span>
        <div className="flex-1" />
        <span className="bg-white/15 border border-white/20 rounded-lg px-2 py-0.5 text-xs">
          Rate: {shift.daraRate}/{shift.akharRate}
        </span>
        {Number(shift.capping) > 0 && (
          <span className="bg-white/15 border border-white/20 rounded-lg px-2 py-0.5 text-xs">
            Cap: ₹{shift.capping}
          </span>
        )}
        <span className="bg-white/15 border border-white/20 rounded-lg px-2 py-0.5 text-xs hidden sm:inline">
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
          className="lg:hidden bg-[#162d6a] hover:bg-[#1e4088] border border-[#1e4088]/60 rounded-lg px-2 py-0.5 text-xs flex items-center gap-1"
        >
          Shifts {sidebarOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* ── Mobile sidebar (collapsible) ─────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden border-b border-gray-300 bg-gray-50 max-h-48 overflow-auto">
          <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-center text-sm font-bold py-1.5 uppercase font-condensed">
            {shift.name} {isJantriOpen ? "[LIVE]" : ""}
          </div>
          <label className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
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
              className="h-4 w-4 rounded border-[#1e4088]"
            />
            <span className="text-xs text-gray-700 font-medium">Select All</span>
          </label>
          {allShifts
            .filter((s) => s.id !== shiftId)
            .map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedShifts.has(s.id)}
                  onChange={() => toggleShift(s.id)}
                  className="h-4 w-4 rounded border-[#1e4088]"
                />
                <span className="text-sm text-gray-700">{s.name}</span>
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
        <div className="flex-1 overflow-auto p-1 sm:p-2 bg-gray-100">
          {mode === "grid" ? (
            /* ── GRID VIEW ─────────────────────────────────────────── */
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-300">
              <table className="w-full border-collapse text-xs sm:text-sm table-fixed min-w-[500px]">
                <thead>
                  <tr>
                    {Array.from({ length: COLS }, (_, i) => (
                      <th
                        key={i}
                        className="bg-gradient-to-b from-[#142969] to-[#1a3578] text-white text-center py-1.5 px-1 font-bold border border-[#1e4088]"
                      >
                        {i + 1}
                      </th>
                    ))}
                    <th className="bg-gradient-to-b from-[#142969] to-[#1a3578] text-white text-center py-1.5 px-1 font-bold border border-[#1e4088]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Main 10x10 grid */}
                  {MAIN_GRID.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((num) => {
                        const key = `1:${num}`;
                        const val = amounts[key];
                        const existing = totalsMap[key] || 0;
                        return (
                          <td
                            key={num}
                            className="border border-gray-300 p-0 relative"
                          >
                            <span className="absolute top-0.5 bg-yellow-200 p-1 left-0.5 text-black text-[10px] leading-none font-bold ">
                              {num}
                            </span>
                            <input
                              ref={num === "1" ? gridFirstCellRef : undefined}
                              data-grid-input
                              type="number"
                              min={0}
                              value={val || ""}
                              onChange={(e) => setAmount(key, e.target.value)}
                              onKeyDown={handleGridKeyDown}
                              disabled={!isJantriOpen}
                              className="w-full bg-transparent text-gray-900 text-center text-sm pt-4 pb-1 px-0 focus:outline-none focus:bg-[#eef6ff] disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            {editId && existing > 0 && (
                              <span className="absolute bottom-0 right-0.5 text-[9px] text-[#1a88d4] font-semibold">
                                {existing}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center text-sm font-bold px-1 py-1.5">
                        {rowTotals[rowIdx] || 0}
                      </td>
                    </tr>
                  ))}

                  {/* Column totals row */}
                  <tr>
                    {colTotals.map((t, i) => (
                      <td
                        key={i}
                        className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center font-bold py-1"
                      >
                        {t}
                      </td>
                    ))}
                    <td className="border border-gray-300 bg-[#142969] text-white text-center font-bold py-1">
                      {grandTotal}
                    </td>
                  </tr>

                  {/* B row (Bahar Akhar) */}
                  <tr className="bg-[#eef7ff]">
                    {B_LABELS.map((d) => {
                      const numStr = bLabelToNum(d);
                      const key = numStr ? `2:${numStr}` : null;
                      const val = key ? amounts[key] : undefined;
                      const existing = key ? totalsMap[key] || 0 : 0;
                      return (
                        <td
                          key={`B${d}`}
                          className="border border-gray-300 p-0 relative"
                        >
                          <span className="absolute top-0 left-0.5 text-black text-[10px] leading-none font-bold">
                            B{d}
                          </span>
                          {key ? (
                            <input
                              data-grid-input
                              type="number"
                              min={0}
                              value={val || ""}
                              onChange={(e) => setAmount(key, e.target.value)}
                              onKeyDown={handleGridKeyDown}
                              disabled={!isJantriOpen}
                              className="w-full bg-transparent text-gray-900 text-center text-sm pt-4 pb-1 px-0 focus:outline-none focus:bg-[#ddeeff] disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <div className="pt-4 pb-1 text-center text-gray-400 text-sm">-</div>
                          )}
                          {editId && existing > 0 && (
                            <span className="absolute bottom-0 right-0.5 text-[9px] text-[#1a88d4] font-semibold">
                              {existing}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center text-sm font-bold px-1 py-1.5">
                      {B_LABELS.reduce((s, d) => {
                        const n = bLabelToNum(d);
                        return s + (n ? amounts[`2:${n}`] || 0 : 0);
                      }, 0)}
                    </td>
                  </tr>

                  {/* A row (Ander Akhar) */}
                  <tr className="bg-[#f5eeff]">
                    {A_LABELS.map((d) => {
                      const numStr = aLabelToNum(d);
                      const key = numStr ? `3:${numStr}` : null;
                      const val = key ? amounts[key] : undefined;
                      const existing = key ? totalsMap[key] || 0 : 0;
                      return (
                        <td
                          key={`A${d}`}
                          className="border border-gray-300 p-0 relative"
                        >
                          <span className="absolute top-0 left-0.5 text-black text-[10px] leading-none font-bold">
                            A{d}
                          </span>
                          {key ? (
                            <input
                              data-grid-input
                              type="number"
                              min={0}
                              value={val || ""}
                              onChange={(e) => setAmount(key, e.target.value)}
                              onKeyDown={handleGridKeyDown}
                              disabled={!isJantriOpen}
                              className="w-full bg-transparent text-gray-900 text-center text-sm pt-4 pb-1 px-0 focus:outline-none focus:bg-[#ede8ff] disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <div className="pt-4 pb-1 text-center text-gray-400 text-sm">-</div>
                          )}
                          {editId && existing > 0 && (
                            <span className="absolute bottom-0 right-0.5 text-[9px] text-[#1a88d4] font-semibold">
                              {existing}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 bg-[#e8edf5] text-[#142969] text-center text-sm font-bold px-1 py-1.5">
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
              <div className="w-full sm:w-[280px] flex-shrink-0 flex flex-col gap-2">
                {/* Number + Amount inputs */}
                <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
                  <div className="flex">
                    <div className="flex-1 border-r border-gray-300">
                      <div className="bg-[#e6900a] text-white text-[10px] font-bold text-center py-1 tracking-wider">
                        NUMBER
                      </div>
                      <input
                        ref={numberInputRef}
                        type="text"
                        inputMode="numeric"
                        value={draftNumber}
                        onChange={(e) => {
                          // Allow digits only
                          setDraftNumber(e.target.value.replace(/[^0-9]/g, ""));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            amountInputRef.current?.focus();
                            return;
                          }
                          // + key → repeat digit 3× (Bahar Akhar)
                          if (e.key === "+" || e.key === "=") {
                            e.preventDefault();
                            const digit = draftNumber.replace(/^0+/, "");
                            if (/^[1-9]$/.test(digit)) setDraftNumber(digit.repeat(3));
                            return;
                          }
                          // - key → repeat digit 4× (Ander Akhar)
                          if (e.key === "-") {
                            e.preventDefault();
                            const digit = draftNumber.replace(/^0+/, "");
                            if (/^[1-9]$/.test(digit)) setDraftNumber(digit.repeat(4));
                            return;
                          }
                        }}
                        disabled={!isJantriOpen}
                        placeholder="e.g. 42"
                        autoFocus
                        className="w-full bg-transparent text-gray-900 text-center text-sm py-2.5 px-2 focus:outline-none focus:bg-[#eef6ff] disabled:opacity-40 placeholder:text-gray-300"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="bg-[#142969] text-white text-[10px] font-bold text-center py-1 tracking-wider">
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
                        placeholder="₹"
                        className="w-full bg-transparent text-gray-900 text-center text-sm py-2.5 px-2 focus:outline-none focus:bg-[#eef6ff] disabled:opacity-40 placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <button
                      onClick={addFromDraft}
                      disabled={!isJantriOpen}
                      className="bg-[#84c2f1] hover:bg-[#5aaee8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-4 text-xl transition-colors self-stretch flex items-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Entry list */}
                <div className="flex-1 overflow-hidden flex flex-col rounded-lg border border-gray-300 shadow-sm bg-white">
                  <div className="bg-[#142969] text-white text-[10px] font-bold text-center py-1 flex">
                    <span className="flex-1">NUMBER</span>
                    <span className="flex-1">AMOUNT</span>
                    <span className="w-8"></span>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {quickEntries.length === 0 ? (
                      <div className="text-center text-gray-400 text-xs py-10">
                        No entries yet.<br />Enter number &amp; amount above.
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <tbody>
                          {quickEntries.map((entry, idx) => (
                            <tr
                              key={entry.id}
                              className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                            >
                              <td className="py-1.5 px-2 text-gray-900 font-bold text-center">
                                {entry.numberInput}
                              </td>
                              <td className="py-1.5 px-2 text-[#142969] font-bold text-right">
                                {entry.amount}
                              </td>
                              <td className="py-1 px-1 w-8 text-center">
                                <button
                                  onClick={() => removeQuickEntry(entry.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded w-5 h-5 flex items-center justify-center text-[11px] font-bold mx-auto"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Total count */}
                <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-center text-sm font-semibold py-1.5 rounded-lg shadow-sm">
                  Total Count : {entryCount}
                </div>
              </div>

              {/* Center: Instructions */}
              <div className="hidden sm:flex flex-1 flex-col rounded-lg border border-gray-300 shadow-sm overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-xs font-bold px-3 py-2 tracking-wide">
                  UTAR MODE — INSTRUCTIONS
                </div>
                <div className="p-4 space-y-2.5 text-gray-700 text-xs overflow-auto">
                  <p className="flex gap-2"><span className="text-[#142969] font-bold">1.</span> Dara Number: <span className="font-semibold">1 to 100</span></p>
                  <p className="flex gap-2"><span className="text-[#142969] font-bold">2.</span> Bahar Akhar: <span className="font-semibold">111 to 999</span> (repeated digit: 111, 222…999)</p>
                  <p className="flex gap-2"><span className="text-[#142969] font-bold">3.</span> Andar Akhar: <span className="font-semibold">1111 to 9999</span> (repeated digit: 1111, 2222…9999)</p>
                  <div className="border-t border-gray-100 pt-2 space-y-1.5">
                    <p>Press <kbd className="bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded text-gray-800 font-mono text-[11px]">F12</kbd> to switch Jantri / Utar view</p>
                    <p>Press <kbd className="bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded text-gray-800 font-mono text-[11px]">Enter</kbd> after amount to add entry</p>
                    <p>Press <kbd className="bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded text-gray-800 font-mono text-[11px]">`~</kbd> to re-focus number field</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT SIDEBAR: Shift list (desktop only) ═══ */}
        <div className="hidden lg:flex w-[220px] flex-shrink-0 border-l border-gray-300 bg-gray-50 flex-col overflow-hidden">
          {/* Current shift header */}
          <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-center text-sm font-bold py-2 uppercase font-condensed tracking-wide">
            {shift.name} {isJantriOpen ? "[LIVE]" : ""}
          </div>

          {/* Tick to copy */}
          <label className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
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
              className="h-4 w-4 rounded border-[#1e4088]"
            />
            <span className="text-xs text-gray-700 font-medium">
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
                  className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={selectedShifts.has(s.id)}
                    onChange={() => toggleShift(s.id)}
                    className="h-4 w-4 rounded border-[#1e4088] accent-[#142969]"
                  />
                  <span className="text-sm text-gray-700 font-medium">{s.name}</span>
                </label>
              ))}
          </div>

          <div className="bg-red-700 text-white text-center text-sm font-bold py-2">
            Grand Total: ₹{grandTotal}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: action buttons ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-white border-t border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] text-xs flex-wrap">
        <span className="text-[#142969] text-[11px] mr-1 sm:mr-2 hidden sm:inline">
          [ F12 = Switch View ]
        </span>
        <div className="flex-1 min-w-0" />

        {/* Random (F4) */}
        <div className="hidden md:inline-flex items-stretch rounded-lg overflow-hidden">
          <button
            onClick={() => setRandomModalOpen(true)}
            disabled={!isJantriOpen}
            className="bg-[#142669] hover:bg-[#1a3080] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 transition-colors text-xs"
          >
            Random (F4)
          </button>
          {quickEntries.some((e) => e.source === "random") && (
            <>
              <span className="w-px bg-white/20" />
              <button
                onClick={() => removeBySource("random")}
                title="Remove Random entries"
                className="bg-[#142669] hover:bg-red-600 text-white/50 hover:text-white px-2 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        {/* Cross (F6) */}
        <div className="hidden md:inline-flex items-stretch rounded-lg overflow-hidden">
          <button
            onClick={() => setCrossModalOpen(true)}
            disabled={!isJantriOpen}
            className="bg-[#142669] hover:bg-[#1a3080] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 transition-colors text-xs"
          >
            Cross (F6)
          </button>
          {quickEntries.some((e) => e.source === "cross") && (
            <>
              <span className="w-px bg-white/20" />
              <button
                onClick={() => removeBySource("cross")}
                title="Remove Cross entries"
                className="bg-[#142669] hover:bg-red-600 text-white/50 hover:text-white px-2 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        {/* From-To (F7) */}
        <div className="hidden md:inline-flex items-stretch rounded-lg overflow-hidden">
          <button
            onClick={() => setFromToModalOpen(true)}
            disabled={!isJantriOpen}
            className="bg-[#142669] hover:bg-[#1a3080] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 transition-colors text-xs"
          >
            From-To (F7)
          </button>
          {quickEntries.some((e) => e.source === "fromto") && (
            <>
              <span className="w-px bg-white/20" />
              <button
                onClick={() => removeBySource("fromto")}
                title="Remove From-To entries"
                className="bg-[#142669] hover:bg-red-600 text-white/50 hover:text-white px-2 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        {/* Random2 (F8) */}
        <div className="hidden md:inline-flex items-stretch rounded-lg overflow-hidden">
          <button
            onClick={() => setRandom2ModalOpen(true)}
            disabled={!isJantriOpen}
            className="bg-[#142669] hover:bg-[#1a3080] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 transition-colors text-xs"
          >
            Random (F8)
          </button>
          {quickEntries.some((e) => e.source === "random2") && (
            <>
              <span className="w-px bg-white/20" />
              <button
                onClick={() => removeBySource("random2")}
                title="Remove Random2 entries"
                className="bg-[#142669] hover:bg-red-600 text-white/50 hover:text-white px-2 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        <button
          disabled
          className="bg-gray-200 text-gray-500 font-semibold px-2 sm:px-3 py-1.5 rounded-lg opacity-70 cursor-not-allowed hidden md:block"
        >
          J-Daane
        </button>

        <button
          onClick={handleClear}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-colors border border-gray-300"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isJantriOpen || submitting || grandTotal === 0}
          className="bg-[#e6a020] hover:bg-[#d09018] disabled:bg-[#1a3578] disabled:cursor-not-allowed text-white font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-colors"
        >
          {submitting ? "Saving..." : editId ? "Update" : "Save Now"}
        </button>
      </div>

      {/* Random Modal */}
      <RandomModal
        open={randomModalOpen}
        onClose={() => setRandomModalOpen(false)}
        onSave={handleRandomModalSave}
      />

      {/* Cross Modal */}
      <CrossModal
        open={crossModalOpen}
        onClose={() => setCrossModalOpen(false)}
        onSave={handleCrossModalSave}
      />

      {/* From-To Modal */}
      <FromToModal
        open={fromToModalOpen}
        onClose={() => setFromToModalOpen(false)}
        onSave={handleFromToModalSave}
      />

      {/* Random2 Modal (F8) */}
      <Random2Modal
        open={random2ModalOpen}
        onClose={() => setRandom2ModalOpen(false)}
        onSave={handleRandom2ModalSave}
      />
    </div>
  );
}
