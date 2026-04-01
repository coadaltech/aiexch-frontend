"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface CrossResult {
  number: string;
  amount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (entries: CrossResult[]) => void;
}

export function CrossModal({ open, onClose, onSave }: Props) {
  const [ander, setAnder] = useState("");
  const [bahar, setBahar] = useState("");
  const [amount, setAmount] = useState("");
  const [joda, setJoda] = useState("Y");

  const anderRef = useRef<HTMLInputElement>(null);
  const baharRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const jodaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAnder("");
      setBahar("");
      setAmount("");
      setJoda("Y");
      setTimeout(() => anderRef.current?.focus(), 50);
    }
  }, [open]);

  // Only allow digits in ander/bahar (0-9), no repeats
  const handleDigitInput = (
    val: string,
    setter: (v: string) => void
  ) => {
    const digits = val.replace(/[^0-9]/g, "");
    // Remove duplicate digits
    const unique = [...new Set(digits.split(""))].join("");
    setter(unique);
  };

  // Only allow Y or N in joda
  const handleJodaInput = (val: string) => {
    const upper = val.toUpperCase();
    if (upper === "" || upper === "Y" || upper === "N") {
      setJoda(upper);
    }
  };

  // Compute cross numbers
  const crossNumbers = useMemo(() => {
    const anderDigits = ander.split("");
    const baharDigits = bahar.split("");
    const isJoda = joda === "Y";

    // Special case: both blank + JODA Y → only joda pairs 11-99
    if (anderDigits.length === 0 && baharDigits.length === 0) {
      if (isJoda) {
        return Array.from({ length: 9 }, (_, i) => i + 1).map((d) =>
          String(d * 11)
        );
      }
      return [];
    }

    const nums: string[] = [];
    for (const a of anderDigits) {
      for (const b of baharDigits) {
        const n = parseInt(a + b, 10);
        // Skip 0 (from "00")
        if (n < 1 || n > 99) continue;
        // If joda N, skip same-digit pairs
        if (!isJoda && a === b) continue;
        const s = String(n);
        if (!nums.includes(s)) nums.push(s);
      }
    }
    return nums;
  }, [ander, bahar, joda]);

  const amt = parseInt(amount, 10) || 0;
  const totalCount = crossNumbers.length;
  const totalAmount = totalCount * amt;

  const handleSave = useCallback(() => {
    if (crossNumbers.length === 0) {
      toast.error("No numbers generated. Enter digits in Ander and Bahar.");
      anderRef.current?.focus();
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      amountRef.current?.focus();
      return;
    }

    const entries: CrossResult[] = crossNumbers.map((num) => ({
      number: num,
      amount: amt,
    }));

    onSave(entries);
    onClose();
  }, [crossNumbers, amt, onSave, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-nav-dark border border-nav-btn rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-matka-hover text-white px-5 py-3 rounded-t-lg">
          <h2 className="text-lg font-bold">Cross</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Input row */}
          <div className="border border-matka rounded-lg p-3">
            <div className="grid grid-cols-4 gap-2 mb-2">
              <span className="text-xs font-bold text-matka-text text-center">
                ANDER
              </span>
              <span className="text-xs font-bold text-matka-text text-center">
                BAHAR
              </span>
              <span className="text-xs font-bold text-matka-text text-center">
                AMOUNT
              </span>
              <span className="text-xs font-bold text-matka-text text-center">
                JODA
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input
                ref={anderRef}
                type="text"
                value={ander}
                onChange={(e) => handleDigitInput(e.target.value, setAnder)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    baharRef.current?.focus();
                  }
                }}
                maxLength={10}
                className="border border-nav-btn bg-nav-surface text-white rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-matka-ring"
                placeholder=""
              />
              <input
                ref={baharRef}
                type="text"
                value={bahar}
                onChange={(e) => handleDigitInput(e.target.value, setBahar)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    amountRef.current?.focus();
                  }
                }}
                maxLength={10}
                className="border border-nav-btn bg-nav-surface text-white rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-matka-ring"
                placeholder=""
              />
              <input
                ref={amountRef}
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    jodaRef.current?.focus();
                  }
                }}
                className="border border-nav-btn bg-nav-surface text-white rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-matka-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder=""
              />
              <input
                ref={jodaRef}
                type="text"
                value={joda}
                onChange={(e) => handleJodaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                maxLength={1}
                className="border border-nav-btn bg-matka-input-bg text-black rounded px-2 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-matka-ring"
                placeholder=""
              />
            </div>
          </div>

          {/* Counts */}
          <div className="space-y-1">
            <p className="text-white font-bold text-base">
              TOTAL CROSS COUNT : {totalCount}
            </p>
            <p className="text-white font-bold text-xl">
              TOTAL AMOUNT : {totalAmount}
            </p>
          </div>

          {/* Generated numbers preview */}
          {crossNumbers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto">
              {crossNumbers.map((n) => (
                <span
                  key={n}
                  className="bg-matka-dark text-matka-text text-xs px-2 py-0.5 rounded font-mono"
                >
                  {n}
                </span>
              ))}
            </div>
          )}

          {/* Instructions
          <div className="space-y-1 text-nav-text-muted text-xs">
            <p>
              1. अगर JODA &quot;Y&quot; है तो 00-99 JODA की ENTRY होगी
            </p>
            <p>
              2. अगर BOTH NUMBER BLANK है और JODA &quot;Y&quot; है तो सिर्फ
              00-99 JODA की ENTRY होगी
            </p>
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 px-5 py-3 border-t border-nav-btn">
          <button
            onClick={handleSave}
            className="bg-matka hover:bg-matka-hover text-white font-semibold px-8 py-2 rounded text-sm transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="text-nav-text hover:text-white font-semibold px-6 py-2 rounded text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
