"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

function reverseNumber(n: number): number | null {
  const padded = n.toString().padStart(2, "0");
  const rev = parseInt(padded.split("").reverse().join(""), 10);
  if (rev === n || rev < 1 || rev > 100) return null;
  return rev;
}

interface FromToResult {
  number: string;
  amount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (entries: FromToResult[]) => void;
}

export function FromToModal({ open, onClose, onSave }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [pltAmount, setPltAmount] = useState("");

  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const pltRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFrom("");
      setTo("");
      setAmount("");
      setPltAmount("");
      setTimeout(() => fromRef.current?.focus(), 50);
    }
  }, [open]);

  const fromNum = parseInt(from, 10) || 0;
  const toNum = parseInt(to, 10) || 0;
  const amt = parseInt(amount, 10) || 0;
  const plt = parseInt(pltAmount, 10) || 0;

  // Generate numbers in range
  const generated = useMemo(() => {
    if (fromNum < 1 || toNum < 1 || fromNum > 100 || toNum > 100) return [];
    const start = Math.min(fromNum, toNum);
    const end = Math.max(fromNum, toNum);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [fromNum, toNum]);

  // Reversed numbers (unique, not already in generated)
  const reversed = useMemo(() => {
    if (plt <= 0) return [];
    const revs: number[] = [];
    const genSet = new Set(generated);
    const seen = new Set<number>();
    for (const n of generated) {
      const rev = reverseNumber(n);
      if (rev && !genSet.has(rev) && !seen.has(rev)) {
        revs.push(rev);
        seen.add(rev);
      }
    }
    return revs;
  }, [generated, plt]);

  const totalAmount = generated.length * amt + reversed.length * plt;

  const handleSave = useCallback(() => {
    if (fromNum < 1 || fromNum > 100) {
      toast.error("From must be 1-100");
      fromRef.current?.focus();
      return;
    }
    if (toNum < 1 || toNum > 100) {
      toast.error("To must be 1-100");
      toRef.current?.focus();
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      amountRef.current?.focus();
      return;
    }

    const entries: FromToResult[] = [];
    for (const n of generated) {
      entries.push({ number: String(n), amount: amt });
    }
    if (plt > 0) {
      for (const n of reversed) {
        entries.push({ number: String(n), amount: plt });
      }
    }

    onSave(entries);
    onClose();
  }, [fromNum, toNum, amt, plt, generated, reversed, onSave, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-teal-700 text-white px-5 py-3 rounded-t-lg">
          <h2 className="text-lg font-bold">From-To</h2>
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
          <div className="border border-teal-600 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <span className="text-xs font-bold text-teal-400 text-center">
                From
              </span>
              <span className="text-xs font-bold text-teal-400 text-center">
                To
              </span>
              <span className="text-xs font-bold text-teal-400 text-center">
                AMOUNT
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                ref={fromRef}
                type="number"
                min={1}
                max={100}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    toRef.current?.focus();
                  }
                }}
                className="border border-slate-600 bg-slate-800 text-white rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <input
                ref={toRef}
                type="number"
                min={1}
                max={100}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    amountRef.current?.focus();
                  }
                }}
                className="border border-slate-600 bg-slate-800 text-white rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    pltRef.current?.focus();
                  }
                }}
                className="border border-slate-600 bg-slate-800 text-white rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* PALT section */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <span className="col-span-2 text-xs font-bold text-teal-400 text-center">
                PALT SECTION
              </span>
              <input
                ref={pltRef}
                type="number"
                min={0}
                value={pltAmount}
                onChange={(e) => setPltAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                className="border border-slate-600 bg-amber-100 text-black rounded px-2 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Total */}
          <p className="text-white font-bold text-xl">
            TOTAL AMOUNT : {totalAmount}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 px-5 py-3 border-t border-slate-700">
          <button
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-2 rounded text-sm transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-semibold px-6 py-2 rounded text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
