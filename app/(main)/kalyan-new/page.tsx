"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { kalyanNewApi } from "@/lib/api";
import { Calendar, Clock, Trophy } from "lucide-react";
import { formatLocalDate } from "@/lib/date-utils";

// Kalyan-New shifts share the matka_shifts table shape; sport_type=1005.
// Fields specific to Kalyan-New: closingTime, singlePana*, doublePana*, sangam*.
interface KalyanNewShift {
  id: string;
  name: string;
  sportType: number;
  shiftDate: string;
  endTime: string;
  shiftOrder: number;
  singlePanaRate: string;
  singlePanaCommission: string;
  doublePanaRate: string;
  doublePanaCommission: string;
  tripleRate: string;
  tripleCommission: string;
  daraRate: string;
  daraCommission: string;
  akharRate: string;
  akharCommission: string;
  sangamRate: string;
  sangamCommission: string;
  mainJantriTime: string | null;
  closingTime: string | null;
  result?: number | null;
  isActive: boolean;
  nextDayAllow: boolean;
  capping: string;
}

function useKalyanNewShifts(date?: string) {
  return useQuery({
    queryKey: ["kalyan-new-shifts", date],
    queryFn: async () => {
      const res = await kalyanNewApi.getShifts(date);
      return (res.data?.data ?? []) as KalyanNewShift[];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

function formatDate(dateStr: string) {
  return formatLocalDate(dateStr, {
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

function ShiftCard({ shift }: { shift: KalyanNewShift }) {
  const isDeclared = shift.shiftDate === "1970-01-01";
  const hasResult = shift.result !== null && shift.result !== undefined;
  const { timeLeft, isExpired } = useCountdown(
    shift.shiftDate,
    shift.endTime,
    shift.nextDayAllow
  );

  return (
    <Link href={`/kalyan-new/${shift.id}`} className="block group">
      <div className="bg-white border border-gray-200 hover:border-[var(--header-primary)]/40 rounded-xl px-4 py-4 transition-all duration-200 hover:shadow-md shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm font-condensed uppercase truncate text-center tracking-wide">
          {shift.name}
        </h3>
        {!isDeclared && (
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(shift.shiftDate)}</span>
          </div>
        )}
        {(shift.mainJantriTime || shift.closingTime) && !isDeclared && (
          <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-gray-500">
            {shift.mainJantriTime && <span>Open: {shift.mainJantriTime}</span>}
            {shift.mainJantriTime && shift.closingTime && (
              <span className="text-gray-300">·</span>
            )}
            {shift.closingTime && <span>Close: {shift.closingTime}</span>}
          </div>
        )}
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
                  : "bg-[var(--header-primary)]/10 text-[var(--header-primary)] border border-[var(--header-primary)]/20"
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

export default function KalyanNewPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const { data: shifts = [], isLoading } = useKalyanNewShifts(date);

  return (
    <div className="bg-gray-100 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--header-primary)] via-[var(--header-primary)] to-[var(--header-secondary)] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-[var(--header-secondary)] rounded-full" />
          <div>
            <h1 className="text-white font-bold text-sm font-condensed tracking-wide">
              KALYAN NEW
            </h1>
            <p className="text-white/50 text-[10px] mt-0.5">
              Two results a day · Single/Double/Triple Pana, Jodi, Akhar, Sangam
            </p>
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-white/20 border border-white/30 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--header-secondary)] transition-colors"
        />
      </div>

      {isLoading && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-300 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && shifts.length > 0 && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} />
          ))}
        </div>
      )}

      {!isLoading && shifts.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-14 h-14 bg-white border border-gray-300 rounded-xl flex items-center justify-center mb-3 shadow-sm">
            <Calendar className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            No shifts available for {formatDate(date)}
          </p>
          <p className="text-gray-400 text-xs mt-1">Try selecting a different date</p>
        </div>
      )}
    </div>
  );
}
