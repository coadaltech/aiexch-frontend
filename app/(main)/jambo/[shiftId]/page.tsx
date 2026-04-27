"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useJamboShift,
  useJamboShifts,
  useJamboJantri,
  usePlaceJambo,
} from "@/hooks/useJamboApi";
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
 * Jambo number system:
 *   Players pick a number and a bet type. Six bet types exist —
 *     0 = Triple           (full 3-digit, 1-1000; e.g. 786)
 *     1 = Bhar Ki Jodi     (last 2 digits, 0-99)
 *     2 = Andar Ki Jodi    (first 2 digits, 0-99)
 *     3 = Akhar Bahar      (last digit, 0-9)
 *     4 = Akhar Andar      (first digit, 0-9)
 *     5 = Middle Akhar     (middle digit, 0-9)
 *   — unlike matka there is no grid view, just a quick-entry panel.
 */

const NUMBER_TYPES: { value: number; label: string; shortLabel: string; min: number; max: number; maxLength: number }[] = [
  { value: 0, label: "Triple (1-1000)",        shortLabel: "Triple",  min: 1,  max: 1000, maxLength: 4 },
  { value: 1, label: "Bhar Ki Jodi (00-99)",   shortLabel: "B.Jodi",  min: 0,  max: 99,   maxLength: 2 },
  { value: 2, label: "Andar Ki Jodi (00-99)",  shortLabel: "A.Jodi",  min: 0,  max: 99,   maxLength: 2 },
  { value: 3, label: "Akhar Bahar (0-9)",      shortLabel: "A.Bahar", min: 0,  max: 9,    maxLength: 1 },
  { value: 4, label: "Akhar Andar (0-9)",      shortLabel: "A.Andar", min: 0,  max: 9,    maxLength: 1 },
  { value: 5, label: "Middle Akhar (0-9)",     shortLabel: "M.Akhar", min: 0,  max: 9,    maxLength: 1 },
];

function filterDraftNumber(numberType: number, raw: string): string {
  const t = NUMBER_TYPES.find((x) => x.value === numberType);
  if (!t) return "";
  let s = raw.replace(/[^0-9]/g, "");
  if (s.length > t.maxLength) s = s.slice(0, t.maxLength);
  while (s !== "" && parseInt(s, 10) > t.max) {
    s = s.slice(0, -1);
  }
  return s;
}

function validateInput(numberType: number, raw: string): { ok: boolean; normalized?: string; error?: string } {
  const t = NUMBER_TYPES.find((x) => x.value === numberType);
  if (!t) return { ok: false, error: "Invalid bet type" };
  const s = raw.trim();
  if (!s) return { ok: false, error: "Number required" };
  if (!/^\d+$/.test(s)) return { ok: false, error: "Digits only" };
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return { ok: false, error: "Invalid number" };
  if (n < t.min || n > t.max)
    return { ok: false, error: `${t.shortLabel} must be ${t.min}-${t.max}` };
  return { ok: true, normalized: String(n) };
}

interface QuickEntry {
  id: number;
  numberInput: string;
  numberType: number;
  amount: string;
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
      const target = new Date(shiftDate);
      target.setHours(h, m, 0, 0);
      if (nextDayAllow) target.setDate(target.getDate() + 1);
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
      if (hrs > 0) setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      else if (mins > 0) setTimeLeft(`${mins}m ${secs}s`);
      else setTimeLeft(`${secs}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [shiftDate, endTime, nextDayAllow]);

  return { timeLeft, isExpired };
}

export default function JamboShiftPage() {
  const params = useParams();
  const router = useRouter();
  const shiftId = params.shiftId as string;
  const { isLoggedIn } = useAuth();

  const { data: shift, isLoading: shiftLoading } = useJamboShift(shiftId);
  useJamboJantri(shiftId); // kept warm for totals
  const placeMutation = usePlaceJambo();

  const today = new Date().toISOString().split("T")[0];
  const { data: allShifts = [] } = useJamboShifts(shift?.shiftDate || today);

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

  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Quick-entry state ──────────────────────────────────────────────────
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);
  const nextId = useRef(1);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const typeSelectRef = useRef<HTMLSelectElement>(null);
  const [draftNumberType, setDraftNumberType] = useState<number>(0);
  const [draftNumber, setDraftNumber] = useState("");
  const [draftAmount, setDraftAmount] = useState("");

  const storageKey = `jambo_draft_${shiftId}`;

  // Restore draft on mount
  useEffect(() => {
    if (!shiftId) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        entries?: QuickEntry[];
        draftNumber?: string;
        draftAmount?: string;
        draftNumberType?: number;
      };
      if (parsed.entries && parsed.entries.length > 0) {
        setQuickEntries(parsed.entries);
        nextId.current =
          Math.max(0, ...parsed.entries.map((e) => e.id)) + 1;
      }
      if (parsed.draftNumber) setDraftNumber(parsed.draftNumber);
      if (parsed.draftAmount) setDraftAmount(parsed.draftAmount);
      if (typeof parsed.draftNumberType === "number")
        setDraftNumberType(parsed.draftNumberType);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftId]);

  useEffect(() => {
    if (!shiftId) return;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        entries: quickEntries,
        draftNumber,
        draftAmount,
        draftNumberType,
      })
    );
  }, [
    quickEntries,
    draftNumber,
    draftAmount,
    draftNumberType,
    shiftId,
    storageKey,
  ]);

  const grandTotal = useMemo(
    () =>
      quickEntries.reduce((s, e) => {
        const n = parseInt(e.amount, 10);
        return s + (Number.isFinite(n) && n > 0 ? n : 0);
      }, 0),
    [quickEntries]
  );
  const entryCount = quickEntries.length;

  const { timeLeft, isExpired: shiftEnded } = useShiftCountdown(
    shift?.shiftDate,
    shift?.endTime,
    shift?.nextDayAllow
  );

  useEffect(() => {
    if (shiftEnded && shift) {
      toast.error("Shift has ended. Redirecting...");
      const timeout = setTimeout(() => router.push("/jambo"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [shiftEnded, shift, router]);

  const isJantriOpen = useMemo(() => {
    if (shiftEnded) return false;
    if (!shift?.mainJantriTime) return true;
    const now = new Date();
    const [h, m] = shift.mainJantriTime.split(":").map(Number);
    const t = new Date(shift.shiftDate);
    t.setHours(h, m, 0, 0);
    if (shift.nextDayAllow) t.setDate(t.getDate() + 1);
    return now < t;
  }, [shift, shiftEnded]);

  const addFromDraft = useCallback(() => {
    const v = validateInput(draftNumberType, draftNumber);
    if (!v.ok) {
      toast.error(v.error || "Invalid number");
      numberInputRef.current?.focus();
      return;
    }
    const amt = parseInt(draftAmount, 10);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      amountInputRef.current?.focus();
      return;
    }
    setQuickEntries((prev) => [
      ...prev,
      {
        id: nextId.current++,
        numberInput: v.normalized!,
        numberType: draftNumberType,
        amount: String(amt),
      },
    ]);
    setDraftNumber("");
    setDraftAmount("");
    typeSelectRef.current?.focus();
  }, [draftNumberType, draftNumber, draftAmount]);

  const removeQuickEntry = useCallback((id: number) => {
    setQuickEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    setQuickEntries([]);
    setDraftNumber("");
    setDraftAmount("");
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      window.dispatchEvent(new Event("openAuthModal"));
      return;
    }

    const bets = quickEntries
      .map((e) => {
        const amt = parseInt(e.amount, 10);
        if (!Number.isFinite(amt) || amt <= 0) return null;
        return {
          number: e.numberInput,
          numberType: e.numberType,
          amount: amt,
        };
      })
      .filter(Boolean) as {
      number: string;
      numberType: number;
      amount: number;
    }[];

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

  const currentType = NUMBER_TYPES.find((t) => t.value === draftNumberType)!;

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#142969] via-[#142669] to-[#1a3578] text-white px-2 sm:px-4 py-2 text-sm flex-wrap border-b border-[#1e4088]/60">
        <button
          onClick={() => router.push("/jambo")}
          className="hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold uppercase font-condensed tracking-wide">
          {shift.name}
        </span>
        <span
          className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
            shiftEnded
              ? "bg-red-600"
              : "bg-[#84c2f1]/20 border border-[#84c2f1]/40 text-[#84c2f1]"
          }`}
        >
          <Clock className="w-3 h-3" />
          {timeLeft}
        </span>
        <div className="flex-1" />
        <span className="bg-white/15 border border-white/20 rounded-lg px-2 py-0.5 text-xs">
          Triple: {shift.tripleRate} / Jodi: {shift.daraRate} / Akhar: {shift.akharRate}
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
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="lg:hidden bg-[#162d6a] hover:bg-[#1e4088] border border-[#1e4088]/60 rounded-lg px-2 py-0.5 text-xs flex items-center gap-1"
        >
          Shifts{" "}
          {sidebarOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Mobile sidebar */}
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

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-1 sm:p-2 bg-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 h-full">
            {/* Quick entry form */}
            <div className="w-full sm:w-[350px] flex-shrink-0 flex flex-col ">
              {/* Type dropdown + Number + Amount input */}
              <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
                {/* <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-[10px] font-bold text-center py-1 tracking-wider uppercase">
                  Bet Type: {currentType.label}
                </div> */}
                <div className="grid grid-cols-[112px_1fr_1fr_auto] items-stretch">
                  <div className="flex flex-col border-r border-gray-300">
                    <div className="bg-[#142969] text-white text-[10px] font-bold text-center py-1 tracking-wider">
                      TYPE
                    </div>
                    <select
                      ref={typeSelectRef}
                      value={draftNumberType}
                      onChange={(e) => {
                        const newType = parseInt(e.target.value, 10);
                        setDraftNumberType(newType);
                        setDraftNumber("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          numberInputRef.current?.focus();
                        }
                      }}
                      disabled={!isJantriOpen}
                      className="w-full bg-transparent text-gray-900 text-xs font-semibold py-2.5 px-2 focus:outline-none focus:bg-[#eef6ff] disabled:opacity-40 cursor-pointer"
                    >
                      {NUMBER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.shortLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col border-r border-gray-300">
                    <div className="bg-[#e6900a] text-white text-[10px] font-bold text-center py-1 tracking-wider">
                      NUMBER
                    </div>
                    <input
                      ref={numberInputRef}
                      type="text"
                      inputMode="numeric"
                      value={draftNumber}
                      onChange={(e) =>
                        setDraftNumber(filterDraftNumber(draftNumberType, e.target.value))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          amountInputRef.current?.focus();
                        }
                      }}
                      disabled={!isJantriOpen}
                      placeholder={`${currentType.min}-${currentType.max}`}
                      autoFocus
                      className="w-full bg-transparent text-gray-900 text-center text-sm py-2.5 px-2 focus:outline-none focus:bg-[#eef6ff] disabled:opacity-40 placeholder:text-gray-300"
                    />
                  </div>
                  <div className="flex flex-col">
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
                    className="bg-[#84c2f1] hover:bg-[#5aaee8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-4 text-xl transition-colors flex items-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Entry list */}
              <div className="flex-1 overflow-hidden flex flex-col rounded-lg border border-gray-300 shadow-sm bg-white min-h-[240px]">
                <div className="bg-[#142969] text-white text-[10px] font-bold text-center py-1 flex">
                  <span className="flex-1">TYPE</span>
                  <span className="flex-1">NUMBER</span>
                  <span className="flex-1">AMOUNT</span>
                  <span className="w-8"></span>
                </div>
                <div className="flex-1 overflow-auto">
                  {quickEntries.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-10">
                      No entries yet.
                      <br />
                      Enter number &amp; amount above.
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <tbody>
                        {quickEntries.map((entry, idx) => {
                          const t = NUMBER_TYPES.find(
                            (x) => x.value === entry.numberType
                          );
                          return (
                            <tr
                              key={entry.id}
                              className={`border-b border-gray-100 ${
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="py-1.5 px-2 text-gray-700 font-medium text-center">
                                {t?.shortLabel ?? entry.numberType}
                              </td>
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
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-center text-sm font-semibold py-1.5 rounded-lg shadow-sm">
                Total Count : {entryCount}
              </div>
            </div>

            {/* Instructions panel */}
            <div className="hidden sm:flex flex-1 flex-col rounded-lg border border-gray-300 shadow-sm overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-xs font-bold px-3 py-2 tracking-wide">
                JAMBO — BET TYPES
              </div>
              <div className="p-4 space-y-2 text-gray-700 text-xs overflow-auto">
                <p className="text-[13px] text-gray-800">
                  Example declared number: <span className="font-bold">786</span>
                </p>
                <div className="border-t border-gray-100 pt-2 space-y-1.5">
                  <p className="flex gap-2">
                    <span className="text-[#142969] font-bold w-4">0.</span>
                    Triple — full 3-digit number, 1-1000 (786 wins on 786)
                  </p>
                  <p className="flex gap-2">
                    <span className="text-[#142969] font-bold w-4">1.</span>
                    Bhar Ki Jodi — last 2 digits, 00-99 (86 wins from 786)
                  </p>
                  <p className="flex gap-2">
                    <span className="text-[#142969] font-bold w-4">2.</span>
                    Andar Ki Jodi — first 2 digits, 00-99 (78 wins from 786)
                  </p>
                  <p className="flex gap-2">
                    <span className="text-[#142969] font-bold w-4">3.</span>
                    Akhar Bahar — last single digit, 0-9 (6 wins from 786)
                  </p>
                  <p className="flex gap-2">
                    <span className="text-[#142969] font-bold w-4">4.</span>
                    Akhar Andar — first single digit, 0-9 (7 wins from 786)
                  </p>
                  <p className="flex gap-2">
                    <span className="text-[#142969] font-bold w-4">5.</span>
                    Middle Akhar — middle single digit, 0-9 (8 wins from 786)
                  </p>
                </div>
                <div className="border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                  Pick a bet type, type your number, set amount, press Enter.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-[220px] flex-shrink-0 border-l border-gray-300 bg-gray-50 flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-[#142969] to-[#1a3578] text-white text-center text-sm font-bold py-2 uppercase font-condensed tracking-wide">
            {shift.name} {isJantriOpen ? "[LIVE]" : ""}
          </div>
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
              className="h-4 w-4 rounded border-[#1e4088]"
            />
            <span className="text-xs text-gray-700 font-medium">
              Tick Shift for Copy Transaction
            </span>
          </label>
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
                  <span className="text-sm text-gray-700 font-medium">
                    {s.name}
                  </span>
                </label>
              ))}
          </div>
          <div className="bg-red-700 text-white text-center text-sm font-bold py-2">
            Grand Total: ₹{grandTotal}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-white border-t border-gray-300 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] text-xs flex-wrap">
        <div className="flex-1 min-w-0" />
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
          {submitting ? "Saving..." : "Save Now"}
        </button>
      </div>
    </div>
  );
}
