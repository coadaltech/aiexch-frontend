"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Clock, Loader2, X } from "lucide-react";
import {
  useOwnerMatkaShifts,
  useMatkaLivePrediction,
  useMatkaLivePredictionWhitelabels,
  useMatkaAgentSale,
  useDeclareMatkaResult,
  useMatkaDeclaredHistory,
  type LivePredictionWhitelabelRow,
} from "@/hooks/useOwner";
import { useAuth } from "@/contexts/AuthContext";
import { JantriGridModal } from "./jantri-modal";
import { Button } from "@/components/ui/button";
import { formatLocalDate } from "@/lib/date-utils";

const TEAL = "#1a6050";
const TEAL_DARK = "#144840";

const fmt = (v: string | number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.abs(n)).toLocaleString("en-IN") : "0";
};

const fmtDate = (d?: string | null) =>
  d
    ? formatLocalDate(d, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

function useMainJantriCountdown(
  shiftDate?: string | null,
  mainJantriTime?: string | null,
  nextDayAllow?: boolean
) {
  const [state, setState] = useState<{ msLeft: number; display: string }>({
    msLeft: 0,
    display: "—",
  });

  useEffect(() => {
    if (!shiftDate || !mainJantriTime) {
      setState({ msLeft: 0, display: "—" });
      return;
    }

    const target = (() => {
      const [h, m] = mainJantriTime.split(":").map(Number);
      const t = new Date(shiftDate);
      t.setHours(h, m, 0, 0);
      if (nextDayAllow) t.setDate(t.getDate() + 1);
      return t;
    })();

    const tick = () => {
      const ms = target.getTime() - Date.now();
      if (ms <= 0) {
        setState({ msLeft: ms, display: "Ready" });
        return;
      }
      const hrs = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setState({
        msLeft: ms,
        display:
          hrs > 0
            ? `${hrs}h ${mins}m ${secs}s`
            : mins > 0
            ? `${mins}m ${secs}s`
            : `${secs}s`,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [shiftDate, mainJantriTime, nextDayAllow]);

  return state;
}

export default function OwnerLivePredictionPage() {

  const { user: currentUser } = useAuth();
  const isOwner = String(currentUser?.role ?? "").toLowerCase() === "owner";

  const { data: shifts = [], isLoading: shiftsLoading } = useOwnerMatkaShifts();
  const [shiftId, setShiftId] = useState<string>("");

  useEffect(() => {
    if (!shiftId && shifts.length > 0) setShiftId(shifts[0].id);
  }, [shifts, shiftId]);

  const selectedShift = useMemo(
    () => shifts.find((s: any) => s.id === shiftId),
    [shifts, shiftId]
  );

  const { data: livePrediction, isLoading: gridLoading } =
    useMatkaLivePrediction(shiftId || null);
  const numbers = livePrediction?.numbers ?? [];
  const meta = livePrediction?.meta;

  const [amtDesc, setAmtDesc] = useState(true);
  const sortedNumbers = useMemo(
    () =>
      [...numbers].sort((a, b) =>
        amtDesc
          ? Number(b.profit) - Number(a.profit)
          : Number(a.profit) - Number(b.profit)
      ),
    [numbers, amtDesc]
  );

  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const { data: whitelabels = [], isLoading: wlLoading } =
    useMatkaLivePredictionWhitelabels(shiftId || null, selectedNum);
  const { data: agentSales = [], isLoading: agentSaleLoading } =
    useMatkaAgentSale(shiftId || null, selectedNum);

  const [plAsc, setPlAsc] = useState(true);
  const sortedWhitelabels = useMemo(
    () =>
      [...whitelabels].sort((a, b) =>
        plAsc
          ? Number(a.profit) - Number(b.profit)
          : Number(b.profit) - Number(a.profit)
      ),
    [whitelabels, plAsc]
  );

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [resultInput, setResultInput] = useState("");
  const declareMutation = useDeclareMatkaResult();
  const { data: declaredHistory = [] } = useMatkaDeclaredHistory(50);

  const jantri = useMainJantriCountdown(
    selectedShift?.shiftDate,
    selectedShift?.mainJantriTime,
    selectedShift?.nextDayAllow
  );
  const [earlyDeclareOpen, setEarlyDeclareOpen] = useState(false);
  const isDeclared = selectedShift?.shiftDate === "1970-01-01";

  const [jantriOpen, setJantriOpen] = useState(false);
  const [selectedWl, setSelectedWl] =
    useState<LivePredictionWhitelabelRow | null>(null);

  const selectedRow = numbers.find((n) => n.nums === selectedNum);

  const handleDeclare = () => {
    const n = parseInt(resultInput, 10);
    if (!shiftId || isNaN(n) || n < 0 || n > 100) return;
    if (jantri.msLeft > 0) {
      setEarlyDeclareOpen(true);
      return;
    }
    declareMutation.mutate(
      { shiftId, result: n },
      { onSuccess: () => setResultInput("") }
    );
  };

  return (
    <div className="fixed top-14 left-0 lg:left-64 right-0 bottom-0 flex flex-col overflow-hidden bg-gray-200">
      {/* ── Top header ── */}
      <div
        style={{ background: TEAL }}
        className="flex items-center gap-3 px-4 py-2.5 text-white shrink-0 text-sm"
      >
        <span className="font-bold">Live Prediction</span>

        <span className="text-white/80 ml-3">Shift</span>
        <div className="relative">
          <select
            value={shiftId}
            onChange={(e) => {
              setShiftId(e.target.value);
              setSelectedNum(null);
              setSelectedWl(null);
            }}
            className="appearance-none bg-white text-black text-sm rounded px-3 pr-8 py-1.5 min-w-[170px] border-0 outline-none cursor-pointer"
            disabled={shiftsLoading}
          >
            {(shifts as any[]).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>

        <span className="text-white/80">Date</span>
        <input
          readOnly
          value={fmtDate(selectedShift?.shiftDate)}
          className="bg-white text-black text-sm rounded px-3 py-1.5 w-32 border-0 outline-none"
        />

        <div
          className={`flex items-center gap-1.5 ml-2 rounded px-2.5 py-1 text-xs font-semibold ${
            isDeclared
              ? "bg-amber-500/20 text-amber-200"
              : jantri.msLeft > 0
              ? "bg-amber-500/20 text-amber-200"
              : "bg-emerald-500/20 text-emerald-200"
          }`}
          title="Time until main jantri"
        >
          <Clock className="h-3.5 w-3.5" />
          {isDeclared ? (
            <span>Declared</span>
          ) : !selectedShift?.mainJantriTime ? (
            <span>No jantri time</span>
          ) : jantri.msLeft > 0 ? (
            <span>Jantri in {jantri.display}</span>
          ) : (
            <span>Jantri {jantri.display}</span>
          )}
        </div>

        <button className="ml-auto bg-[#22c55e] hover:bg-[#16a34a] transition-colors text-white text-sm font-bold px-7 py-1.5 rounded">
          Search
        </button>
      </div>

      {/* ── Four panels ── */}
      <div className="flex items-stretch flex-1 gap-0.5 p-1 min-h-0 overflow-x-auto overflow-y-hidden">

        {/* Panel 1 — Numbers / Result 30 Days */}
        <div
          className="flex flex-col bg-white border border-gray-300 rounded overflow-hidden text-sm shrink-0"
          style={{ width: 320 }}
        >
          {meta && (meta.txCount === 0 || meta.commCount === 0) && (
            <div className="text-[10px] text-amber-700 bg-amber-50 border-b border-amber-200 px-2 py-1">
              txns: <b>{meta.txCount}</b> · comm: <b>{meta.commCount}</b>
            </div>
          )}
          {/* Header */}
          <div
            className="flex shrink-0 text-white text-xs font-semibold"
            style={{ background: TEAL }}
          >
            <div className="w-10 py-2 text-center border-r border-white/20 shrink-0 leading-tight text-[11px]">
              Result<br />30 Days
            </div>
            <div className="flex-1 py-2 text-center border-r border-white/20">Number</div>
            <div className="flex-1 py-2 text-center border-r border-white/20">Sale</div>
            <div
              className="flex-1 py-2 text-center cursor-pointer select-none"
              onClick={() => setAmtDesc((d) => !d)}
            >
              Amt {amtDesc ? "↓" : "↑"}
            </div>
          </div>
          {/* Rows */}
          <div className="overflow-y-auto flex-1">
            {gridLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
              </div>
            ) : (
              sortedNumbers.map((row) => (
                <div
                  key={row.nums}
                  onClick={() => setSelectedNum(row.nums)}
                  className={`flex items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    row.nums === selectedNum ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="w-10 py-1.5 flex items-center justify-center shrink-0">
                    {(row.declared_count ?? 0) > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#22c55e] text-white font-bold text-[11px]">
                        {row.declared_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 py-1.5 text-center font-semibold text-gray-800">
                    {row.nums}
                  </div>
                  <div className="flex-1 py-1.5 text-center text-gray-600">
                    {fmt(row.sale)}
                  </div>
                  <div className={`flex-1 py-1.5 text-center font-semibold ${Number(row.profit) >= 0 ? "text-[#22c55e]" : "text-red-500"}`}>
                    {Number(row.profit) < 0 ? "-" : ""}{fmt(row.profit)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 2 — Party breakdown */}
        <div className="flex flex-col bg-white border border-gray-300 rounded overflow-hidden text-sm flex-1 min-w-0">
          {/* Header */}
          <div
            className="flex items-stretch shrink-0 text-white text-xs font-semibold"
            style={{ background: TEAL }}
          >
            <div className="w-8 py-2 text-center border-r border-white/20 shrink-0">Sr</div>
            <div className="w-8 py-2 flex items-center justify-center border-r border-white/20 shrink-0">
              <input type="checkbox" className="w-3 h-3 cursor-pointer" />
            </div>
            <div className="flex-1 py-2 px-2 text-left border-r border-white/20">Party</div>
            <div className="w-[84px] py-2 text-center border-r border-white/20 shrink-0">Sale</div>
            <div
              className="w-[100px] py-2 text-center border-r border-white/20 cursor-pointer select-none shrink-0"
              onClick={() => setPlAsc((a) => !a)}
            >
              P & L {plAsc ? "↑" : "↓"}
            </div>
            <div className="w-[84px] py-2 text-center shrink-0">Last-Win</div>
          </div>
          {/* Rows */}
          <div className="overflow-y-auto flex-1">
            {selectedNum == null ? (
              <div className="py-10 text-center text-gray-400 text-[11px]">
                Select a number to see party breakdown.
              </div>
            ) : wlLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
              </div>
            ) : sortedWhitelabels.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-[11px]">
                No bets placed on this number.
              </div>
            ) : (
              sortedWhitelabels.map((wl, i) => {
                const profit = Number(wl.profit);
                return (
                  <div
                    key={wl.user_id}
                    onClick={() => setSelectedWl(wl)}
                    className={`flex items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedWl?.user_id === wl.user_id ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="w-8 py-2 text-center text-gray-400 shrink-0">
                      {i + 1}.
                    </div>
                    <div className="w-8 py-2 flex items-center justify-center shrink-0">
                      <input
                        type="checkbox"
                        className="w-3 h-3 cursor-pointer"
                        checked={checked.has(wl.user_id)}
                        onChange={(e) => {
                          const s = new Set(checked);
                          e.target.checked ? s.add(wl.user_id) : s.delete(wl.user_id);
                          setChecked(s);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex-1 py-2 px-2 font-medium text-gray-800 uppercase truncate">
                      {wl.name}
                    </div>
                    <div className="w-[84px] py-2 text-center text-gray-600 shrink-0">
                      {fmt(wl.sale)}
                    </div>
                    <div
                      className={`w-[100px] py-2 text-center font-semibold shrink-0 ${
                        profit >= 0 ? "text-[#22c55e]" : "text-red-500"
                      }`}
                    >
                      {profit < 0 ? "-" : ""}
                      {fmt(Math.abs(profit))}
                    </div>
                    <div className="w-[84px] py-2 text-center shrink-0">
                      {wl.streak > 0 && wl.streak_type != null && (
                        <span
                          title={
                            wl.streak_type === 1
                              ? `Won ${wl.streak} in a row`
                              : `Lost ${wl.streak} in a row`
                          }
                          className={`inline-flex items-center justify-center min-w-5 h-5 px-1 rounded font-bold text-[10px] text-white ${
                            wl.streak_type === 1
                              ? "bg-[#22c55e]"
                              : "bg-red-500"
                          }`}
                        >
                          {wl.streak_type === 1 ? "W" : "L"}
                          {wl.streak}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Footer bar */}
          <div
            className="flex items-center justify-between px-4 py-2 shrink-0 text-white font-bold text-sm"
            style={{ background: TEAL }}
          >
            <span>
              Number: {selectedNum ?? "—"} | Profit:{" "}
              {selectedRow ? fmt(selectedRow.profit) : "—"}
            </span>
            <button
              onClick={() => setJantriOpen(true)}
              disabled={!shiftId}
              className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 transition-colors text-white text-xs font-bold px-5 py-1.5 rounded"
            >
              Jantri
            </button>
          </div>
        </div>

        {/* Panel 3 — Agent Groups */}
        <div
          className="flex flex-col bg-white border border-gray-300 rounded overflow-hidden text-sm shrink-0"
          style={{ width: 240 }}
        >
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10" style={{ background: TEAL }}>
                <tr className="text-white">
                  <th className="px-2 py-2 font-semibold text-left">Agent Groups</th>
                  <th className="px-2 py-2 font-semibold text-right w-16">Sale</th>
                </tr>
              </thead>
              <tbody>
                {selectedNum == null ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-10 text-center text-gray-400">
                      Select a number to see agent groups.
                    </td>
                  </tr>
                ) : agentSaleLoading ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-10 text-center text-gray-400">
                      <span className="inline-flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
                      </span>
                    </td>
                  </tr>
                ) : agentSales.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-10 text-center text-gray-400">
                      No agent sales.
                    </td>
                  </tr>
                ) : (
                  agentSales.map((ag) => (
                    <tr key={ag.whitelabel_id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1.5 font-medium text-gray-800 uppercase truncate max-w-0">
                        {ag.name}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-gray-700">
                        {fmt(ag.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 4 — Declare */}
        <div
          className="flex flex-col bg-white border border-gray-300 rounded overflow-hidden text-sm shrink-0"
          style={{ width: 265 }}
        >
          {/* Number input + Declare button */}
          <div
            className="flex items-center gap-2 px-2 py-2 shrink-0"
            style={{ background: TEAL }}
          >
            <input
              type="number"
              min={0}
              max={100}
              value={resultInput}
              onChange={(e) => setResultInput(e.target.value)}
              placeholder="Number"
              className="flex-1 min-w-0 bg-white text-black text-sm rounded px-2 py-1 border-0 outline-none"
              disabled={!isOwner || isDeclared}
            />
            <button
              onClick={handleDeclare}
              disabled={
                !isOwner ||
                !shiftId ||
                !resultInput ||
                declareMutation.isPending ||
                isDeclared
              }
              style={{ background: TEAL_DARK }}
              className="shrink-0 border border-white/40 hover:border-white/70 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
            >
              {declareMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Declare"
              )}
            </button>
          </div>
          {/* Sub-header */}
          <div
            className="flex text-white text-xs font-semibold shrink-0"
            style={{ background: TEAL }}
          >
            <div className="flex-1 px-3 py-1.5 border-t border-white/20">Result</div>
            <div className="w-[88px] py-1.5 text-center border-t border-l border-white/20 shrink-0">
              Action
            </div>
            {/* <div className="w-[88px] py-1.5 text-center border-t border-l border-white/20 shrink-0">
              Action
            </div> */}
          </div>
          {/* History rows */}
          <div className="overflow-y-auto flex-1">
            {declaredHistory.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-[11px]">
                No declarations yet.
              </div>
            ) : (
              declaredHistory.map((h) => (
                <div key={h.id} className="flex items-center border-b border-gray-100 py-1">
                  <div className="flex-1 px-3">
                    <div className="font-bold text-sm text-gray-800">{h.runs}</div>
                    <div className="text-[10px] text-gray-400">{fmtDate(h.declared_at)}</div>
                  </div>
                  <div className="w-[88px] px-1 shrink-0">
                    <button
                      disabled={!isOwner}
                      onClick={() => {
                        if (!h.shift_id) return;
                        const n = parseInt(resultInput, 10);
                        if (isNaN(n)) return;
                        declareMutation.mutate(
                          { shiftId: h.shift_id, result: n },
                          { onSuccess: () => setResultInput("") }
                        );
                      }}
                      className="w-full bg-gray-400 hover:bg-gray-500 disabled:opacity-50 transition-colors text-white text-[10px] font-medium py-1.5 rounded"
                    >
                      ReDeclare
                    </button>
                  </div>
                  {/* <div className="w-[88px] px-1 shrink-0">
                    <button
                      disabled={!isOwner}
                      className="w-full bg-[#1e40af] hover:bg-[#1d3ba1] disabled:opacity-50 transition-colors text-white text-[10px] font-medium py-1.5 rounded"
                    >
                      UnDeclare
                    </button>
                  </div> */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <JantriGridModal
        open={jantriOpen}
        onClose={() => setJantriOpen(false)}
        shiftId={shiftId || null}
        whitelabelId={selectedWl?.user_id ?? "all"}
        whitelabelName={selectedWl?.name ?? "All"}
      />

      {earlyDeclareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setEarlyDeclareOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-foreground">
                  Too early to declare
                </h3>
              </div>
              <button
                onClick={() => setEarlyDeclareOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-foreground">
              <p className="mb-3">
                Main jantri time for{" "}
                <span className="font-semibold">{selectedShift?.name}</span>{" "}
                hasn&apos;t arrived yet. Please wait:
              </p>
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-center">
                <div className="text-[11px] uppercase tracking-wider text-amber-700/70">
                  Time remaining
                </div>
                <div className="mt-1 text-xl font-bold tabular-nums text-amber-700">
                  {jantri.display}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border bg-muted/40 px-4 py-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEarlyDeclareOpen(false)}
                className="h-7 px-3"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
