"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

// Same sets from the parent page
const BAHAR_SET = new Set(
  Array.from({ length: 9 }, (_, i) => String(i + 1).repeat(3))
);
const ANDER_SET = new Set(
  Array.from({ length: 9 }, (_, i) => String(i + 1).repeat(4))
);

function isValidNumber(s: string): boolean {
  if (!s.trim()) return false;
  if (ANDER_SET.has(s)) return true;
  if (BAHAR_SET.has(s)) return true;
  const n = parseInt(s, 10);
  return !isNaN(n) && n >= 1 && n <= 100 && String(n) === s;
}

/** Reverse a dara number (1-100). Returns null if reverse is same or invalid. */
function reverseNumber(s: string): string | null {
  const n = parseInt(s, 10);
  if (isNaN(n) || n < 1 || n > 100) return null;

  // Pad to 2 digits, reverse, parse back
  const padded = n.toString().padStart(2, "0");
  const rev = padded.split("").reverse().join("");
  const revNum = parseInt(rev, 10);

  // Skip if same as original or out of range
  if (revNum === n || revNum < 1 || revNum > 100) return null;
  return String(revNum);
}

interface RandomResult {
  number: string;
  amount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (entries: RandomResult[]) => void;
}

const INITIAL_ROWS = 5;

export function RandomModal({ open, onClose, onSave }: Props) {
  const [numbers, setNumbers] = useState<string[]>(
    Array(INITIAL_ROWS).fill("")
  );
  const [amount, setAmount] = useState("");
  const [pltAmount, setPltAmount] = useState("");
  const [errors, setErrors] = useState<Set<number>>(new Set());

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const amountRef = useRef<HTMLInputElement>(null);
  const pltRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setNumbers(Array(INITIAL_ROWS).fill(""));
      setAmount("");
      setPltAmount("");
      setErrors(new Set());
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [open]);

  const setNumberAt = useCallback((idx: number, val: string) => {
    setNumbers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    // Clear error for this field on change
    setErrors((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  }, []);

  const handleNumberKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const val = numbers[idx]?.trim();

        // If filled, validate
        if (val && !isValidNumber(val)) {
          setErrors((prev) => new Set(prev).add(idx));
          toast.error("Enter a valid number (1-100, 111-999, or 1111-9999)");
          inputRefs.current[idx]?.focus();
          return;
        }

        // Move to next row or add a new one
        if (idx === numbers.length - 1) {
          // Last row: if it has value, add a new empty row
          if (val) {
            setNumbers((prev) => [...prev, ""]);
            setTimeout(
              () => inputRefs.current[idx + 1]?.focus(),
              50
            );
          } else {
            // Empty last row, move to amount
            amountRef.current?.focus();
          }
        } else {
          inputRefs.current[idx + 1]?.focus();
        }
      }
    },
    [numbers]
  );

  const handleAmountKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        pltRef.current?.focus();
      }
    },
    []
  );

  const handleSave = useCallback(() => {
    // Collect valid numbers
    const validNumbers: string[] = [];
    const newErrors = new Set<number>();

    for (let i = 0; i < numbers.length; i++) {
      const val = numbers[i].trim();
      if (!val) continue;
      if (!isValidNumber(val)) {
        newErrors.add(i);
      } else {
        validNumbers.push(val);
      }
    }

    if (newErrors.size > 0) {
      setErrors(newErrors);
      const firstErr = Array.from(newErrors)[0];
      inputRefs.current[firstErr]?.focus();
      toast.error("Fix invalid numbers before saving");
      return;
    }

    if (validNumbers.length === 0) {
      toast.error("Enter at least one number");
      inputRefs.current[0]?.focus();
      return;
    }

    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      amountRef.current?.focus();
      return;
    }

    const entries: RandomResult[] = [];

    // Add original numbers with amount
    for (const num of validNumbers) {
      entries.push({ number: num, amount: amt });
    }

    // If PLT amount is provided, add reversed numbers
    const plt = parseInt(pltAmount, 10);
    if (plt && plt > 0) {
      for (const num of validNumbers) {
        const rev = reverseNumber(num);
        if (rev) {
          entries.push({ number: rev, amount: plt });
        }
      }
    }

    onSave(entries);
    onClose();
  }, [numbers, amount, pltAmount, onSave, onClose]);

  const handlePltKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  // Total calculation
  const validCount = numbers.filter((n) => n.trim() && isValidNumber(n.trim()))
    .length;
  const amt = parseInt(amount, 10) || 0;
  const plt = parseInt(pltAmount, 10) || 0;

  // Count how many reverses would be generated
  let reverseCount = 0;
  if (plt > 0) {
    for (const num of numbers) {
      const val = num.trim();
      if (val && isValidNumber(val) && reverseNumber(val)) {
        reverseCount++;
      }
    }
  }

  const totalAmount = validCount * amt + reverseCount * plt;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-nav-dark border border-nav-btn rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-matka-hover text-white px-5 py-3 rounded-t-lg">
          <h2 className="text-lg font-bold">Random</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-auto">
          {/* Number rows */}
          {numbers.map((val, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span className="text-sm font-semibold text-nav-text w-24 flex-shrink-0">
                NUMBER
              </span>
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                value={val}
                onChange={(e) => setNumberAt(idx, e.target.value)}
                onKeyDown={(e) => handleNumberKeyDown(idx, e)}
                className={`flex-1 rounded px-3 py-2 text-sm text-white text-right focus:outline-none focus:ring-2 ${
                  errors.has(idx)
                    ? "border-2 border-danger bg-danger/10 focus:ring-danger"
                    : "border border-nav-btn bg-nav-surface focus:ring-matka-ring"
                }`}
                placeholder=""
              />
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-nav-btn my-3" />

          {/* Amount */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-nav-text w-24 flex-shrink-0">
              AMOUNT
            </span>
            <input
              ref={amountRef}
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleAmountKeyDown}
              className="flex-1 border border-nav-btn bg-nav-surface text-white rounded px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-matka-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="AMOUNT"
            />
          </div>

          {/* PLT Amount */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-nav-text w-24 flex-shrink-0">
              PLT-AMOUNT
            </span>
            <input
              ref={pltRef}
              type="number"
              min={0}
              value={pltAmount}
              onChange={(e) => setPltAmount(e.target.value)}
              onKeyDown={handlePltKeyDown}
              className="flex-1 border border-nav-btn bg-nav-surface text-white rounded px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-matka-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="PLT-AMOUNT"
            />
          </div>

          {/* Total */}
          <div className="text-center font-bold text-white text-sm pt-3">
            TOTAL AMOUNT : {totalAmount}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 px-5 py-3 border-t border-nav-btn">
          <button
            onClick={handleSave}
            className="bg-matka hover:bg-matka-hover text-white font-semibold px-8 py-2 rounded text-sm transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="text-nav-text hover:text-white font-semibold px-8 py-2 rounded text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
