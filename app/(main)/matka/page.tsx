"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMatkaShifts, type MatkaShift } from "@/hooks/useMatkaApi";
import { Calendar, Clock, Trophy } from "lucide-react";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function useCountdown(shiftDate: string, endTime: string, nextDayAllow: boolean) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
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

function ShiftCard({ shift }: { shift: MatkaShift }) {
  const hasResult = shift.result !== null && shift.result !== undefined;
  const { timeLeft, isExpired } = useCountdown(
    shift.shiftDate,
    shift.endTime,
    shift.nextDayAllow
  );

  return (
    <Link href={`/matka/${shift.id}`} className="block group">
      <div className="bg-[#0a2a42] border border-[#1b5785]/50 hover:border-[#1b5785] rounded-xl px-4 py-4 transition-all duration-200 hover:bg-[#0f3d5e]">
        <h3 className="font-bold text-white text-sm font-condensed uppercase truncate text-center tracking-wide">
          {shift.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-white/40">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(shift.shiftDate)}</span>
        </div>
        <div className="flex items-center justify-center mt-3">
          {hasResult ? (
            <span className="flex items-center gap-1.5 text-[#f0a050] font-bold text-base">
              <Trophy className="w-4 h-4" />
              {shift.result}
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg ${
                isExpired
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "bg-[#79a430]/15 text-[#79a430] border border-[#79a430]/30"
              }`}
            >
              <Clock className="w-3 h-3" />
              {isExpired ? "Ended" : timeLeft}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function MatkaPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const { data: shifts = [], isLoading } = useMatkaShifts(date);

  return (
    <div className="bg-[#0c314d] min-h-full">
      {/* Header */}
      <div className="bg-[#0a2a42] border-b border-[#1b5785]/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-[#79a430] rounded-full" />
          <div>
            <h1 className="text-white font-bold text-sm font-condensed tracking-wide">MATKA</h1>
            <p className="text-white/40 text-[10px] mt-0.5">Select a shift to place bets</p>
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-[#174b73] border border-[#1b5785] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#66c4ff] transition-colors"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-[#0a2a42] rounded-xl animate-pulse border border-[#1b5785]/30" />
          ))}
        </div>
      )}

      {/* Shifts Grid */}
      {!isLoading && shifts.length > 0 && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && shifts.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-14 h-14 bg-[#0a2a42] border border-[#1b5785]/40 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="w-7 h-7 text-white/30" />
          </div>
          <p className="text-white/50 text-sm">No shifts available for {formatDate(date)}</p>
          <p className="text-white/30 text-xs mt-1">Try selecting a different date</p>
        </div>
      )}
    </div>
  );
}
