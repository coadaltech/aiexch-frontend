"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useKalyanNewShift,
  useKalyanNewShifts,
  useKalyanNewJantri,
  usePlaceKalyanNew,
} from "@/hooks/useKalyanNewApi";
import {
  KALYAN_SINGLE_PANAS,
  KALYAN_DOUBLE_PANAS,
  KALYAN_TRIPLE_PANAS,
  KALYAN_ALL_PANAS,
} from "@/lib/kalyan-panas";
import { useAuth } from "@/contexts/AuthContext";
import { formatLocalDate } from "@/lib/date-utils";
import {
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

/*
 * Kalyan-New number types (must match backend validateKalyanNewNumber):
 *   0 single pana   — 3 different digits, picked from grid
 *   1 double pana   — 2 same + 1 different, picked from grid
 *   2 triple pana   — 3 same digits, picked from grid (000-999)
 *   3 jodi          — typed input, 00-99
 *   4 akhar bahar   — typed input, 0-9
 *   5 akhar andar   — typed input, 0-9
 *   6 sangam        — 2 numbers picked from full pana grid (open + close);
 *                     stored in `number` column as concat "OOOCCC" (6 chars).
 */

type BetType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const BET_TYPES: {
  value: BetType;
  label: string;
  short: string;
  mode: "grid" | "input" | "sangam";
}[] = [
  { value: 0, label: "Single Pana",  short: "SP",     mode: "grid" },
  { value: 1, label: "Double Pana",  short: "DP",     mode: "grid" },
  { value: 2, label: "Triple Pana",  short: "TP",     mode: "grid" },
  { value: 3, label: "Jodi",         short: "Jodi",   mode: "input" },
  { value: 4, label: "Akhar Bahar",  short: "A.Bhr",  mode: "input" },
  { value: 5, label: "Akhar Andar",  short: "A.Andr", mode: "input" },
  { value: 6, label: "Sangam",       short: "Sangam", mode: "sangam" },
];

const GRID_FOR: Record<BetType, string[]> = {
  0: KALYAN_SINGLE_PANAS,
  1: KALYAN_DOUBLE_PANAS,
  2: KALYAN_TRIPLE_PANAS,
  3: [],
  4: [],
  5: [],
  6: KALYAN_ALL_PANAS,
};

interface Entry {
  id: number;
  numberType: BetType;
  number: string;
  amount: string;
  // sangam-only display helpers (the server reads `number` directly)
  sangamOpen?: string;
  sangamClose?: string;
}

function rateForType(
  shift: any,
  numberType: BetType
): { rate: string; commission: string } {
  switch (numberType) {
    case 0: return { rate: shift.singlePanaRate, commission: shift.singlePanaCommission };
    case 1: return { rate: shift.doublePanaRate, commission: shift.doublePanaCommission };
    case 2: return { rate: shift.tripleRate, commission: shift.tripleCommission };
    case 3: return { rate: shift.daraRate, commission: shift.daraCommission };
    case 4:
    case 5: return { rate: shift.akharRate, commission: shift.akharCommission };
    case 6: return { rate: shift.sangamRate, commission: shift.sangamCommission };
  }
}

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
      const t = new Date(shiftDate);
      t.setHours(h, m, 0, 0);
      if (nextDayAllow) t.setDate(t.getDate() + 1);
      return t;
    };
    const update = () => {
      const target = calcTarget();
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        setIsExpired(true);
        return;
      }
      setIsExpired(false);
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hrs > 0) setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      else if (mins > 0) setTimeLeft(`${mins}m ${secs}s`);
      else setTimeLeft(`${secs}s`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [shiftDate, endTime, nextDayAllow]);

  return { timeLeft, isExpired };
}

export default function KalyanNewShiftPage() {
  const params = useParams();
  const router = useRouter();
  const shiftId = params.shiftId as string;
  const { isLoggedIn } = useAuth();

  const { data: shift, isLoading: shiftLoading } = useKalyanNewShift(shiftId);
  useKalyanNewJantri(shiftId);
  const placeMutation = usePlaceKalyanNew();

  const today = new Date().toISOString().split("T")[0];
  const { data: allShifts = [] } = useKalyanNewShifts(shift?.shiftDate || today);

  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (shiftId) setSelectedShifts(new Set([shiftId]));
  }, [shiftId]);
  const toggleShift = useCallback((id: string) => {
    setSelectedShifts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const [activeType, setActiveType] = useState<BetType>(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const nextId = useRef(1);

  // Typed-input mode (jodi / akhar)
  const [inputDraftNumber, setInputDraftNumber] = useState("");
  const [inputDraftAmount, setInputDraftAmount] = useState("");
  const inputNumRef = useRef<HTMLInputElement>(null);
  const inputAmtRef = useRef<HTMLInputElement>(null);

  // Sangam mode: pick open then close, then amount
  const [sangamOpen, setSangamOpen] = useState<string | null>(null);
  const [sangamClose, setSangamClose] = useState<string | null>(null);
  const [sangamAmount, setSangamAmount] = useState("");
  const sangamAmtRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [mobileSlipOpen, setMobileSlipOpen] = useState(false);

  const storageKey = `kalyan_new_draft_${shiftId}`;

  useEffect(() => {
    if (!shiftId) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.entries?.length) {
        setEntries(parsed.entries);
        nextId.current = Math.max(0, ...parsed.entries.map((e: Entry) => e.id)) + 1;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftId]);

  useEffect(() => {
    if (!shiftId) return;
    sessionStorage.setItem(storageKey, JSON.stringify({ entries }));
  }, [entries, shiftId, storageKey]);

  const grandTotal = useMemo(
    () => entries.reduce((s, e) => s + (parseInt(e.amount, 10) || 0), 0),
    [entries]
  );

  const { timeLeft, isExpired: shiftEnded } = useShiftCountdown(
    shift?.shiftDate,
    shift?.endTime,
    shift?.nextDayAllow
  );

  useEffect(() => {
    if (shiftEnded && shift) {
      toast.error("Shift has ended. Redirecting...");
      const t = setTimeout(() => router.push("/kalyan-new"), 1500);
      return () => clearTimeout(t);
    }
  }, [shiftEnded, shift, router]);

  const isJantriOpen = useMemo(() => {
    if (shiftEnded) return false;
    if (!shift?.mainJantriTime) return true;
    const [h, m] = shift.mainJantriTime.split(":").map(Number);
    const t = new Date(shift.shiftDate);
    t.setHours(h, m, 0, 0);
    if (shift.nextDayAllow) t.setDate(t.getDate() + 1);
    return new Date() < t;
  }, [shift, shiftEnded]);

  // ── Per-cell live update for grid modes (single/double/triple pana) ─────
  // Cell value === slip entry. Typing updates the entry; clearing removes it.
  const setGridAmount = useCallback(
    (num: string, raw: string) => {
      const cleaned = raw.replace(/[^0-9]/g, "");
      const amt = parseInt(cleaned, 10);
      setEntries((prev) => {
        const others = prev.filter(
          (e) => !(e.numberType === activeType && e.number === num)
        );
        if (!Number.isFinite(amt) || amt <= 0) return others;
        return [
          ...others,
          {
            id: nextId.current++,
            numberType: activeType,
            number: num,
            amount: String(amt),
          },
        ];
      });
    },
    [activeType]
  );

  // Lookup committed amount for a cell of the active type
  const cellValue = useCallback(
    (num: string) => {
      const e = entries.find(
        (x) => x.numberType === activeType && x.number === num
      );
      return e ? e.amount : "";
    },
    [entries, activeType]
  );

  // ── Typed-input commit (jodi / akhar) ──
  const commitInputDraft = useCallback(() => {
    const t = BET_TYPES.find((x) => x.value === activeType);
    if (!t || t.mode !== "input") return;
    const s = inputDraftNumber.replace(/[^0-9]/g, "");
    if (!s) {
      toast.error("Enter a number");
      return;
    }
    const n = parseInt(s, 10);
    if (activeType === 3 && (n < 0 || n > 99 || s.length > 2)) {
      toast.error("Jodi must be 0-99");
      return;
    }
    if ((activeType === 4 || activeType === 5) && (s.length !== 1 || n < 0 || n > 9)) {
      toast.error("Akhar must be 0-9");
      return;
    }
    const amt = parseInt(inputDraftAmount, 10);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const normalized = activeType === 3 ? s.padStart(2, "0") : s;
    setEntries((prev) => [
      ...prev,
      {
        id: nextId.current++,
        numberType: activeType,
        number: normalized,
        amount: String(amt),
      },
    ]);
    setInputDraftNumber("");
    setInputDraftAmount("");
    inputNumRef.current?.focus();
  }, [activeType, inputDraftNumber, inputDraftAmount]);

  // ── Sangam commit ──
  const commitSangam = useCallback(() => {
    if (!sangamOpen || !sangamClose) {
      toast.error("Select an opening and a closing number");
      return;
    }
    const amt = parseInt(sangamAmount, 10);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const number = `${sangamOpen}${sangamClose}`;
    setEntries((prev) => [
      ...prev,
      {
        id: nextId.current++,
        numberType: 6,
        number,
        amount: String(amt),
        sangamOpen,
        sangamClose,
      },
    ]);
    setSangamOpen(null);
    setSangamClose(null);
    setSangamAmount("");
  }, [sangamOpen, sangamClose, sangamAmount]);

  const removeEntry = useCallback(
    (id: number) => setEntries((prev) => prev.filter((e) => e.id !== id)),
    []
  );

  const handleClear = useCallback(() => {
    setEntries([]);
    setInputDraftNumber("");
    setInputDraftAmount("");
    setSangamOpen(null);
    setSangamClose(null);
    setSangamAmount("");
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      window.dispatchEvent(new Event("openAuthModal"));
      return;
    }

    const bets = entries
      .map((e) => {
        const amt = parseInt(e.amount, 10);
        if (!Number.isFinite(amt) || amt <= 0) return null;
        return { number: e.number, numberType: e.numberType, amount: amt };
      })
      .filter(Boolean) as { number: string; numberType: number; amount: number }[];

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
      const promises = Array.from(selectedShifts).map((sid) =>
        placeMutation.mutateAsync({ shiftId: sid, bets })
      );
      await Promise.all(promises);
      toast.success(
        `Bet placed on ${selectedShifts.size} shift(s)! Total: ₹${
          grandTotal * selectedShifts.size
        }`
      );
      sessionStorage.removeItem(storageKey);
      handleClear();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to place bet");
    } finally {
      setSubmitting(false);
    }
  };

  if (shiftLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50 min-h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--header-secondary)]" />
      </div>
    );
  }
  if (!shift) {
    return (
      <div className="text-center py-20 text-gray-500 bg-gray-50 min-h-full">
        Shift not found
      </div>
    );
  }

  const fmtDate = (d: string) =>
    formatLocalDate(d, { day: "2-digit", month: "2-digit", year: "numeric" });

  const activeMode = BET_TYPES.find((b) => b.value === activeType)!.mode;
  const grid = GRID_FOR[activeType];

  // Slip rendering (shared between desktop sidebar and mobile drawer)
  const slipPanel = (
    <div className="flex flex-col w-full h-full">
      <div className="bg-[var(--header-primary)] text-[var(--header-text)] text-[10px] font-bold py-1 flex">
        <span className="w-12 text-center">TYPE</span>
        <span className="flex-1 text-center">NUMBER</span>
        <span className="w-16 text-center">AMOUNT</span>
        <span className="w-7" />
      </div>
      <div className="flex-1 overflow-auto bg-white">
        {entries.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-10 px-3">
            No bets yet.<br />Pick a number and enter an amount.
          </div>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {entries.map((e, idx) => {
                const t = BET_TYPES.find((b) => b.value === e.numberType)!;
                const display =
                  e.numberType === 6 && e.sangamOpen && e.sangamClose
                    ? `${e.sangamOpen}→${e.sangamClose}`
                    : e.number;
                return (
                  <tr
                    key={e.id}
                    className={`border-b border-gray-100 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="py-1 px-1 w-12 text-gray-700 font-medium text-center">
                      {t.short}
                    </td>
                    <td className="py-1 px-1 text-gray-900 font-bold text-center">
                      {display}
                    </td>
                    <td className="py-1 px-1 w-16 text-[var(--header-primary)] font-bold text-right pr-2">
                      ₹{e.amount}
                    </td>
                    <td className="py-1 px-0.5 w-7 text-center">
                      <button
                        onClick={() => removeEntry(e.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] text-center text-xs font-semibold py-1.5 flex items-center justify-around">
        <span>Count: {entries.length}</span>
        <span>Total: ₹{grandTotal}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[var(--header-primary)] via-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] px-2 sm:px-4 py-1.5 text-sm flex-wrap border-b border-[#1e4088]/60">
        <button
          onClick={() => router.push("/kalyan-new")}
          className="hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold uppercase font-condensed tracking-wide truncate">
          {shift.name}
        </span>
        <span
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
            shiftEnded
              ? "bg-red-600"
              : "bg-[var(--header-secondary)]/20 border border-[var(--header-secondary)]/40 text-[var(--header-secondary)]"
          }`}
        >
          <Clock className="w-3 h-3" />
          {timeLeft}
        </span>
        <div className="flex-1" />
        <span className="bg-white/15 border border-white/20 rounded px-2 py-0.5 text-[11px] hidden sm:inline">
          {fmtDate(shift.shiftDate)}
        </span>
        {Number(shift.capping) > 0 && (
          <span className="bg-white/15 border border-white/20 rounded px-2 py-0.5 text-[11px]">
            Cap: ₹{shift.capping}
          </span>
        )}
        {!isJantriOpen && (
          <span className="bg-red-600 rounded px-2 py-0.5 text-[11px] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Closed
          </span>
        )}
        <button
          onClick={() => setMobileSlipOpen((p) => !p)}
          className="lg:hidden bg-[#162d6a] hover:bg-[#1e4088] border border-[#1e4088]/60 rounded px-2 py-0.5 text-[11px] flex items-center gap-1"
        >
          Slip ({entries.length}){" "}
          {mobileSlipOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Bet-type tabs */}
      <div className="flex flex-wrap gap-1 bg-white border-b border-gray-200 px-2 py-1.5">
        {BET_TYPES.map((bt) => {
          const active = bt.value === activeType;
          const { rate } = rateForType(shift, bt.value);
          return (
            <button
              key={bt.value}
              onClick={() => setActiveType(bt.value)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors ${
                active
                  ? "bg-[var(--header-primary)] text-[var(--header-text)] border-[var(--header-primary)]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {bt.label}
              <span
                className={`ml-1 text-[10px] font-medium ${
                  active ? "text-white/80" : "text-gray-400"
                }`}
              >
                ×{rate}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile slip drawer */}
      {mobileSlipOpen && (
        <div className="lg:hidden border-b border-gray-300 bg-white max-h-[40vh] flex flex-col">
          {slipPanel}
        </div>
      )}

      {/* Body: grid (left) + slip column (right, desktop only) */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-100 p-1.5 sm:p-2">
          {/* Grid mode (single / double / triple pana) */}
          {activeMode === "grid" && (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden h-full flex flex-col">
              <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] px-2 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
                <span>{BET_TYPES.find((b) => b.value === activeType)!.label} ({grid.length})</span>
                <span className="text-[10px] font-normal text-white/80">
                  Type amount on a number — Enter to confirm
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-10 gap-0">
                  {grid.map((num, idx) => {
                    const v = cellValue(num);
                    const filled = !!v && parseInt(v, 10) > 0;
                    return (
                      <div
                        key={`${activeType}-${num}-${idx}`}
                        className={`relative border border-gray-200 ${
                          filled
                            ? "bg-[#fff7e0]"
                            : idx % 20 < 10
                              ? "bg-white"
                              : "bg-gray-50/50"
                        }`}
                      >
                        <span className="absolute top-0 left-0.5 text-[9px] leading-none font-bold text-gray-700 bg-yellow-200 px-0.5 rounded-br pointer-events-none">
                          {num}
                        </span>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={v}
                          onChange={(e) => setGridAmount(num, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                          disabled={!isJantriOpen}
                          className="w-full bg-transparent text-gray-900 text-center text-[11px] pt-2.5 pb-0.5 px-0 focus:outline-none focus:bg-[#eef6ff] disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Typed input mode (jodi / akhar) */}
          {activeMode === "input" && (
            <div className="bg-white border border-gray-300 rounded-lg p-4 max-w-md">
              <div className="text-[11px] font-bold uppercase text-gray-700 mb-3">
                {BET_TYPES.find((b) => b.value === activeType)!.label}
              </div>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                    Number
                  </label>
                  <input
                    ref={inputNumRef}
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder={activeType === 3 ? "00-99" : "0-9"}
                    maxLength={activeType === 3 ? 2 : 1}
                    value={inputDraftNumber}
                    onChange={(e) =>
                      setInputDraftNumber(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        inputAmtRef.current?.focus();
                      }
                    }}
                    disabled={!isJantriOpen}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[var(--header-primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                    Amount
                  </label>
                  <input
                    ref={inputAmtRef}
                    type="number"
                    min={1}
                    placeholder="₹"
                    value={inputDraftAmount}
                    onChange={(e) => setInputDraftAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitInputDraft();
                      }
                    }}
                    disabled={!isJantriOpen}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[var(--header-primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <button
                  onClick={commitInputDraft}
                  disabled={!isJantriOpen}
                  className="bg-[var(--header-primary)] hover:bg-[var(--header-secondary)] disabled:bg-gray-300 text-white font-bold px-4 py-1.5 rounded text-sm"
                >
                  + Add
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                {activeType === 3 && "Type a 2-digit jodi (e.g. 07, 42, 99). Enter to add."}
                {activeType === 4 && "Akhar Bahar — last digit of the result, 0-9."}
                {activeType === 5 && "Akhar Andar — first digit of the result, 0-9."}
              </p>
            </div>
          )}

          {/* Sangam mode */}
          {activeMode === "sangam" && (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden h-full flex flex-col">
              <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] text-[var(--header-text)] px-2 py-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Sangam ({grid.length}) — pick Open then Close
                </span>
                <span className="bg-white/15 border border-white/20 rounded px-2 py-0.5 text-[11px]">
                  Open: <b>{sangamOpen ?? "—"}</b>
                </span>
                <span className="bg-white/15 border border-white/20 rounded px-2 py-0.5 text-[11px]">
                  Close: <b>{sangamClose ?? "—"}</b>
                </span>
                <input
                  ref={sangamAmtRef}
                  type="number"
                  min={1}
                  placeholder="₹ amt"
                  value={sangamAmount}
                  onChange={(e) => setSangamAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitSangam();
                    }
                  }}
                  disabled={!isJantriOpen}
                  className="bg-white text-gray-900 rounded px-2 py-0.5 text-[11px] w-20 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={commitSangam}
                  disabled={!isJantriOpen}
                  className="bg-[#e6a020] hover:bg-[#d09018] disabled:bg-gray-400 text-white text-[11px] font-bold px-2 py-0.5 rounded"
                >
                  Add
                </button>
                {(sangamOpen || sangamClose) && (
                  <button
                    onClick={() => {
                      setSangamOpen(null);
                      setSangamClose(null);
                    }}
                    className="bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium px-1.5 py-0.5 rounded"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-10 gap-0">
                  {grid.map((num, idx) => {
                    const isOpen = sangamOpen === num;
                    const isClose = sangamClose === num;
                    return (
                      <button
                        key={`s-${num}-${idx}`}
                        onClick={() => {
                          if (!isJantriOpen) return;
                          if (!sangamOpen) {
                            setSangamOpen(num);
                          } else if (!sangamClose) {
                            setSangamClose(num);
                            setTimeout(() => sangamAmtRef.current?.focus(), 0);
                          } else {
                            setSangamOpen(num);
                            setSangamClose(null);
                          }
                        }}
                        disabled={!isJantriOpen}
                        className={`text-[11px] font-bold py-1 border border-gray-200 transition-colors ${
                          isOpen
                            ? "bg-[var(--header-primary)] text-white"
                            : isClose
                              ? "bg-[#e6a020] text-white"
                              : idx % 20 < 10
                                ? "bg-white text-gray-800 hover:bg-yellow-50"
                                : "bg-gray-50/50 text-gray-800 hover:bg-yellow-50"
                        } disabled:opacity-40`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop slip column */}
        <div className="hidden lg:flex w-[280px] flex-shrink-0 border-l border-gray-300 bg-white">
          {slipPanel}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white border-t border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] text-xs flex-wrap">
        <details className="relative">
          <summary className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1 rounded-lg border border-gray-300 list-none">
            Shifts ({selectedShifts.size})
          </summary>
          <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] max-h-64 overflow-auto z-10">
            <label className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
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
              />
              <span className="text-xs text-gray-700 font-medium">Select All</span>
            </label>
            {allShifts.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedShifts.has(s.id)}
                  onChange={() => toggleShift(s.id)}
                />
                <span className="text-xs text-gray-700">{s.name}</span>
              </label>
            ))}
          </div>
        </details>
        <div className="flex-1 min-w-0" />
        <span className="hidden sm:inline text-gray-600 font-semibold">
          Total: ₹{grandTotal} · {entries.length} bet{entries.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={handleClear}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1 rounded-lg transition-colors border border-gray-300"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isJantriOpen || submitting || grandTotal === 0}
          className="bg-[#e6a020] hover:bg-[#d09018] disabled:bg-[#1a3578] disabled:cursor-not-allowed text-white font-semibold px-3 py-1 rounded-lg transition-colors"
        >
          {submitting ? "Saving..." : `Save ₹${grandTotal}`}
        </button>
      </div>
    </div>
  );
}
