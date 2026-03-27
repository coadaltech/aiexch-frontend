"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface RandomResult {
  number: string;
  amount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (entries: RandomResult[]) => void;
}

/** Auto-format digits into 2-digit pairs with spaces: "435453" → "43 54 53" */
function formatDaraPairs(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  const pairs: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    if (i + 1 < digits.length) {
      pairs.push(digits[i] + digits[i + 1]);
    } else {
      pairs.push(digits[i]); // incomplete pair (still typing)
    }
  }
  return pairs.join(" ");
}

/** Extract valid 2-digit dara numbers from formatted string */
function parseDaraPairs(formatted: string): string[] {
  const parts = formatted.trim().split(/\s+/);
  const nums: string[] = [];
  for (const p of parts) {
    if (p.length !== 2) continue;
    const n = parseInt(p, 10);
    if (n >= 1 && n <= 99) {
      nums.push(String(n));
    } else if (p === "00") {
      // 100 mapped from "00"? Skip — not standard. User should use 01-99.
      continue;
    }
  }
  return nums;
}

export function Random2Modal({ open, onClose, onSave }: Props) {
  const [daraRaw, setDaraRaw] = useState("");
  const [daraAmount, setDaraAmount] = useState("");
  const [baharRaw, setBaharRaw] = useState("");
  const [baharAmount, setBaharAmount] = useState("");
  const [anderRaw, setAnderRaw] = useState("");
  const [anderAmount, setAnderAmount] = useState("");

  const daraRef = useRef<HTMLTextAreaElement>(null);
  const daraAmtRef = useRef<HTMLInputElement>(null);
  const baharRef = useRef<HTMLInputElement>(null);
  const baharAmtRef = useRef<HTMLInputElement>(null);
  const anderRef = useRef<HTMLInputElement>(null);
  const anderAmtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDaraRaw("");
      setDaraAmount("");
      setBaharRaw("");
      setBaharAmount("");
      setAnderRaw("");
      setAnderAmount("");
      setTimeout(() => daraRef.current?.focus(), 50);
    }
  }, [open]);

  // Dara: auto-format as user types
  const handleDaraChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value;
      // If user pressed backspace on a space, remove extra
      const digitsOnly = raw.replace(/[^0-9]/g, "");
      setDaraRaw(formatDaraPairs(digitsOnly));
    },
    []
  );

  // Parse all sections
  const daraNumbers = useMemo(() => parseDaraPairs(daraRaw), [daraRaw]);

  const baharNumbers = useMemo(() => {
    const digits = baharRaw.replace(/[^1-9]/g, "");
    return [...new Set(digits.split(""))].map((d) => d.repeat(3));
  }, [baharRaw]);

  const anderNumbers = useMemo(() => {
    const digits = anderRaw.replace(/[^1-9]/g, "");
    return [...new Set(digits.split(""))].map((d) => d.repeat(4));
  }, [anderRaw]);

  const dAmt = parseInt(daraAmount, 10) || 0;
  const bAmt = parseInt(baharAmount, 10) || 0;
  const aAmt = parseInt(anderAmount, 10) || 0;

  const daraTotal = daraNumbers.length * dAmt;
  const baharTotal = baharNumbers.length * bAmt;
  const anderTotal = anderNumbers.length * aAmt;
  const totalAmount = daraTotal + baharTotal + anderTotal;

  const handleSave = useCallback(() => {
    const entries: RandomResult[] = [];

    if (daraNumbers.length > 0 && dAmt > 0) {
      for (const n of daraNumbers) entries.push({ number: n, amount: dAmt });
    }
    if (baharNumbers.length > 0 && bAmt > 0) {
      for (const n of baharNumbers) entries.push({ number: n, amount: bAmt });
    }
    if (anderNumbers.length > 0 && aAmt > 0) {
      for (const n of anderNumbers) entries.push({ number: n, amount: aAmt });
    }

    if (entries.length === 0) {
      toast.error("Enter at least one number with amount");
      return;
    }

    onSave(entries);
    onClose();
  }, [
    daraNumbers,
    baharNumbers,
    anderNumbers,
    dAmt,
    bAmt,
    aAmt,
    onSave,
    onClose,
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-teal-700 text-white px-5 py-3 rounded-t-lg">
          <h2 className="text-lg font-bold">Random</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-auto">
          {/* Notes */}
          <div className="text-slate-400 text-xs space-y-1">
            <p>NOTE: Dara number should be 2 digit without any separator.</p>
            <p>NOTE: Akhar number should be 1 digit without any separator.</p>
          </div>

          {/* ── Dara Section ── */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1">
                Dara
              </label>
              <textarea
                ref={daraRef}
                value={daraRaw}
                onChange={handleDaraChange}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    daraAmtRef.current?.focus();
                  }
                }}
                rows={3}
                className="w-full border border-slate-600 bg-slate-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y font-mono"
                placeholder="e.g. 12 45 87 56"
              />
            </div>
            <div className="w-28">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-slate-300">
                  Amount
                </label>
                <span className="text-teal-400 text-xs font-bold">
                  {daraTotal}
                </span>
              </div>
              <input
                ref={daraAmtRef}
                type="number"
                min={1}
                value={daraAmount}
                onChange={(e) => setDaraAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    baharRef.current?.focus();
                  }
                }}
                className="w-full border border-slate-600 bg-slate-800 text-white rounded px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* ── Akhar Bahar Section ── */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1">
                Akhar Bahar
              </label>
              <input
                ref={baharRef}
                type="text"
                value={baharRaw}
                onChange={(e) =>
                  setBaharRaw(e.target.value.replace(/[^1-9]/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    baharAmtRef.current?.focus();
                  }
                }}
                className="w-full border border-slate-600 bg-slate-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                placeholder="e.g. 123456"
              />
            </div>
            <div className="w-28">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-slate-300">
                  Amount
                </label>
                <span className="text-teal-400 text-xs font-bold">
                  {baharTotal}
                </span>
              </div>
              <input
                ref={baharAmtRef}
                type="number"
                min={1}
                value={baharAmount}
                onChange={(e) => setBaharAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    anderRef.current?.focus();
                  }
                }}
                className="w-full border border-slate-600 bg-slate-800 text-white rounded px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* ── Akhar Andar Section ── */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1">
                Akhar Andar
              </label>
              <input
                ref={anderRef}
                type="text"
                value={anderRaw}
                onChange={(e) =>
                  setAnderRaw(e.target.value.replace(/[^1-9]/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    anderAmtRef.current?.focus();
                  }
                }}
                className="w-full border border-slate-600 bg-slate-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                placeholder="e.g. 123"
              />
            </div>
            <div className="w-28">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-slate-300">
                  Amount
                </label>
                <span className="text-teal-400 text-xs font-bold">
                  {anderTotal}
                </span>
              </div>
              <input
                ref={anderAmtRef}
                type="number"
                min={1}
                value={anderAmount}
                onChange={(e) => setAnderAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                className="w-full border border-slate-600 bg-amber-100 text-black rounded px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Total */}
          <div className="text-center font-bold text-white text-lg pt-2 border-t border-slate-700">
            TOTAL AMOUNT : {totalAmount}
          </div>
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
