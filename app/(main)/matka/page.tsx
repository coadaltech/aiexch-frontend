"use client";

import { useState } from "react";
import Link from "next/link";
import { useMatkaShifts, type MatkaShift } from "@/hooks/useMatkaApi";
import { Calendar, Clock, Trophy } from "lucide-react";

const shiftColors = [
  "from-emerald-600 to-emerald-800",
  "from-blue-600 to-blue-800",
  "from-red-600 to-red-800",
  "from-amber-600 to-amber-800",
  "from-purple-600 to-purple-800",
  "from-pink-600 to-pink-800",
  "from-teal-600 to-teal-800",
  "from-orange-600 to-orange-800",
  "from-cyan-600 to-cyan-800",
  "from-indigo-600 to-indigo-800",
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ShiftCard({ shift, index }: { shift: MatkaShift; index: number }) {
  const color = shiftColors[index % shiftColors.length];
  const hasResult = shift.result !== null && shift.result !== undefined;

  return (
    <Link
      href={`/matka/${shift.id}`}
      className="block group"
    >
      <div
        className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 border border-white/10`}
      >
        <h3 className="text-lg font-bold text-center uppercase tracking-wide mb-3">
          {shift.name}
        </h3>
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>DATE : {formatDate(shift.shiftDate)}</span>
        </div>
        {shift.mainJantriTime && (
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>{shift.mainJantriTime}</span>
          </div>
        )}
        <div
          className={`text-center font-bold text-xl ${
            hasResult
              ? "text-white"
              : "text-white/50"
          }`}
        >
          {hasResult ? (
            <span className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              RESULT : {shift.result}
            </span>
          ) : (
            <span className="text-sm font-medium bg-white/10 rounded-lg px-3 py-1.5 inline-block">
              Awaiting Result
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
    <div className="space-y-6 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Matka
          </h1>
          <p className="text-muted-foreground mt-1">
            Select a shift to view the jantri and place your bets
          </p>
        </div>
        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-3">Loading shifts...</p>
          </div>
        </div>
      )}

      {/* Shifts Grid */}
      {!isLoading && shifts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {shifts.map((shift, index) => (
            <ShiftCard key={shift.id} shift={shift} index={index} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && shifts.length === 0 && (
        <div className="text-center py-20">
          <div className="mx-auto w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-muted-foreground text-lg">
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
