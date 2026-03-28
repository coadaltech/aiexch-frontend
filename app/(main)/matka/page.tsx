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
      <div className="bg-card border border-border rounded-xl px-5 py-5 hover:border-primary/50 transition-all duration-200 hover:shadow-md">
        <h3 className="font-bold text-foreground text-lg uppercase truncate text-center">
          {shift.name}
        </h3>
        <div className="flex items-center justify-center gap-3 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(shift.shiftDate)}
          </span>
          {/* <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {shift.endTime}
          </span>
          {shift.nextDayAllow && (
            <span className="text-blue-400 text-xs">+1 day</span>
          )} */}
        </div>
        <div className="flex items-center justify-center mt-3">
          {hasResult ? (
            <span className="flex items-center gap-1.5 text-amber-500 font-bold text-lg">
              <Trophy className="w-5 h-5" />
              {shift.result}
            </span>
          ) : (
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                isExpired
                  ? "bg-red-500/10 text-red-500"
                  : "bg-primary/10 text-primary"
              }`}
            >
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
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matka</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Select a shift to place bets
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-card border border-border text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}

      {/* Shifts Grid */}
      {!isLoading && shifts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && shifts.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-3">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            No shifts available for {formatDate(date)}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Try selecting a different date
          </p>
        </div>
      )}
    </div>
  );
}
