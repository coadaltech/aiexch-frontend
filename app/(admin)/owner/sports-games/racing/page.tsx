"use client";

import { useMemo, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ownerApi } from "@/lib/api";
import {
  useRacingAdmin,
  type RacingAdminMeeting,
  type RacingAdminRace,
} from "@/hooks/useOwner";

// Racing sports have no competition layer — meetings (venues) hold the races,
// and each race is a WIN market. This page mirrors the public racing layout
// (sport → country → venue → races) and lets the owner manage every race's
// market the same way the Market Management page does, plus per-meeting bulk
// actions.

const RACING_SPORTS = [
  { id: "7", label: "Horse Racing" },
  { id: "4339", label: "Greyhound Racing" },
] as const;

const COUNTRY_FLAG: Record<string, string> = {
  AU: "🇦🇺",
  GB: "🇬🇧",
  IE: "🇮🇪",
  US: "🇺🇸",
  NZ: "🇳🇿",
  ZA: "🇿🇦",
  FR: "🇫🇷",
  IN: "🇮🇳",
  OTHER: "🏳️",
};

function fmtTime(iso: string | null): string {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

// Effective settings = backend overrides (null when never configured) merged
// with local optimistic edits, over the pipeline defaults.
type Settings = NonNullable<RacingAdminRace["settings"]>;
const DEFAULTS: Settings = {
  isActive: true,
  isVisible: true,
  suspended: false,
  betLock: false,
  betDelay: null,
  minBet: null,
  maxBet: null,
  maxProfit: null,
  notice: null,
};

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

function Toggle({
  checked,
  onChange,
  loading,
  label,
  color = "green",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  loading?: boolean;
  label: string;
  color?: "green" | "red" | "amber";
}) {
  const on =
    color === "red" ? "bg-red-500" : color === "amber" ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[46px]">
      <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{label}</span>
      {loading ? (
        <div className="h-5 flex items-center text-blue-500"><Spinner /></div>
      ) : (
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? on : "bg-gray-300"}`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transform transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      )}
    </div>
  );
}

export default function RacingAdminPage() {
  const queryClient = useQueryClient();
  const [sportId, setSportId] = useState<string>(RACING_SPORTS[0].id);
  const [activeCC, setActiveCC] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Local optimistic edits keyed by marketId, layered over server data.
  const [edits, setEdits] = useState<Record<string, Partial<Settings>>>({});
  // Per-field pending spinner: `${marketId}:${field}`.
  const [pending, setPending] = useState<Set<string>>(new Set());
  // Draft text in the numeric/notice inputs before Save, keyed by marketId.
  const [drafts, setDrafts] = useState<Record<string, Partial<Record<keyof Settings, string>>>>({});

  const { data: countries = [], isLoading } = useRacingAdmin(sportId);

  const current = useMemo(
    () => countries.find((c) => c.countryCode === activeCC) ?? countries[0] ?? null,
    [countries, activeCC],
  );

  const effective = (race: RacingAdminRace): Settings => ({
    ...DEFAULTS,
    ...(race.settings ?? {}),
    ...(edits[race.marketId] ?? {}),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["racing-admin", sportId] });

  // One market field update (toggle or saved input).
  const saveMarket = useMutation({
    mutationFn: ({ marketId, eventId, patch }: { marketId: string; eventId: number; patch: Partial<Settings> }) =>
      ownerApi.updateMarketSettings(marketId, { eventId: String(eventId), ...patch }),
    onError: () => toast.error("Failed to update race market"),
  });

  const saveNotice = useMutation({
    mutationFn: ({ marketId, eventId, notice }: { marketId: string; eventId: number; notice: string }) =>
      ownerApi.updateMarketNotice(marketId, { notice, eventId: String(eventId) }),
    onSuccess: () => toast.success("Notice saved"),
    onError: () => toast.error("Failed to save notice"),
  });

  // Meeting-wide bulk: apply one change to every race in the venue at once.
  const bulkMeeting = useMutation({
    mutationFn: ({ eventId, marketIds, patch }: { eventId: number; marketIds: string[]; patch: Partial<Settings> }) =>
      ownerApi.bulkUpdateMarketSettings(String(eventId), {
        markets: marketIds.map((marketId) => ({ marketId })),
        ...patch,
      }),
    onSuccess: () => {
      toast.success("Applied to all races in this venue");
      refresh();
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const toggleField = (race: RacingAdminRace, eventId: number, field: keyof Settings, value: boolean) => {
    const key = `${race.marketId}:${field}`;
    setEdits((e) => ({ ...e, [race.marketId]: { ...e[race.marketId], [field]: value } }));
    setPending((p) => new Set(p).add(key));
    saveMarket.mutate(
      { marketId: race.marketId, eventId, patch: { [field]: value } },
      {
        onSettled: () =>
          setPending((p) => {
            const n = new Set(p);
            n.delete(key);
            return n;
          }),
      },
    );
  };

  const draftOf = (race: RacingAdminRace, field: keyof Settings): string => {
    const d = drafts[race.marketId]?.[field];
    if (d !== undefined) return d;
    const v = effective(race)[field];
    return v == null ? "" : String(v);
  };
  const setDraft = (marketId: string, field: keyof Settings, value: string) =>
    setDrafts((d) => ({ ...d, [marketId]: { ...d[marketId], [field]: value } }));

  const saveNumbers = (race: RacingAdminRace, eventId: number) => {
    const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
    const patch: Partial<Settings> = {
      betDelay: num(draftOf(race, "betDelay")) ?? null,
      minBet: num(draftOf(race, "minBet")) ?? null,
      maxBet: num(draftOf(race, "maxBet")) ?? null,
      maxProfit: num(draftOf(race, "maxProfit")) ?? null,
    };
    setEdits((e) => ({ ...e, [race.marketId]: { ...e[race.marketId], ...patch } }));
    saveMarket.mutate(
      { marketId: race.marketId, eventId, patch },
      {
        onSuccess: () => {
          toast.success("Race limits saved");
          refresh();
        },
      },
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">Racing — Markets</h1>
        <p className="text-sm text-gray-500">
          Browse live race meetings by country and manage each race&apos;s market. Updates apply instantly to the live betting page.
        </p>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2 mb-4">
        {RACING_SPORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSportId(s.id);
              setActiveCC(null);
              setExpanded(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              sportId === s.id ? "bg-[#1a3578] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading && countries.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading races…</div>
        ) : countries.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No live races right now for this sport.
          </div>
        ) : (
          <>
            {/* Country tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 px-2 overflow-x-auto">
              {countries.map((c) => {
                const isActive = (current?.countryCode ?? "") === c.countryCode;
                const raceCount = c.meetings.reduce((n, m) => n + m.races.length, 0);
                return (
                  <button
                    key={c.countryCode}
                    onClick={() => setActiveCC(c.countryCode)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive ? "border-[#1a3578] text-[#1a3578]" : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <span className="text-base">{COUNTRY_FLAG[c.countryCode] ?? COUNTRY_FLAG.OTHER}</span>
                    <span>{c.countryCode}</span>
                    <span className="text-xs text-gray-400">({raceCount})</span>
                  </button>
                );
              })}
            </div>

            {/* Meetings */}
            <div className="divide-y divide-gray-100">
              {(current?.meetings ?? []).map((m) => (
                <MeetingCard
                  key={m.eventId}
                  meeting={m}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  effective={effective}
                  toggleField={toggleField}
                  pending={pending}
                  draftOf={draftOf}
                  setDraft={setDraft}
                  saveNumbers={saveNumbers}
                  saveNotice={saveNotice}
                  bulkMeeting={bulkMeeting}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>{text}</span>;
}

function MeetingCard({
  meeting,
  expanded,
  setExpanded,
  effective,
  toggleField,
  pending,
  draftOf,
  setDraft,
  saveNumbers,
  saveNotice,
  bulkMeeting,
}: {
  meeting: RacingAdminMeeting;
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  effective: (r: RacingAdminRace) => Settings;
  toggleField: (r: RacingAdminRace, eventId: number, f: keyof Settings, v: boolean) => void;
  pending: Set<string>;
  draftOf: (r: RacingAdminRace, f: keyof Settings) => string;
  setDraft: (marketId: string, f: keyof Settings, v: string) => void;
  saveNumbers: (r: RacingAdminRace, eventId: number) => void;
  saveNotice: ReturnType<typeof useMutation<any, any, { marketId: string; eventId: number; notice: string }>>;
  bulkMeeting: ReturnType<typeof useMutation<any, any, { eventId: number; marketIds: string[]; patch: Partial<Settings> }>>;
}) {
  const m = meeting;
  const marketIds = m.races.map((r) => r.marketId);
  const activeCount = m.races.filter((r) => effective(r).isActive).length;
  const allInactive = activeCount === 0;

  return (
    <div className="px-3 sm:px-4 py-3">
      {/* Meeting header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{COUNTRY_FLAG[m.countryCode || "OTHER"] ?? COUNTRY_FLAG.OTHER}</span>
          <span className="font-semibold text-gray-800 truncate">{m.venue || m.name}</span>
          <span className="text-xs text-gray-400">#{m.eventId}</span>
          <span className="text-xs text-gray-500">
            {activeCount}/{m.races.length} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              bulkMeeting.mutate({ eventId: m.eventId, marketIds, patch: { isActive: allInactive } })
            }
            disabled={bulkMeeting.isPending}
            className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors ${
              allInactive
                ? "border-green-300 text-green-700 hover:bg-green-50"
                : "border-red-300 text-red-700 hover:bg-red-50"
            }`}
          >
            {allInactive ? "Activate all races" : "Deactivate all races"}
          </button>
          <button
            onClick={() => bulkMeeting.mutate({ eventId: m.eventId, marketIds, patch: { suspended: true } })}
            disabled={bulkMeeting.isPending}
            className="text-xs font-semibold px-2.5 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            Suspend all
          </button>
        </div>
      </div>

      {/* Race rows */}
      <div className="space-y-1.5">
        {m.races.map((race) => {
          const s = effective(race);
          const open = expanded === race.marketId;
          const p = (f: string) => pending.has(`${race.marketId}:${f}`);
          return (
            <div key={race.marketId} className="rounded-lg border border-gray-200 bg-gray-50/60">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
                <span className="font-mono text-sm font-bold text-gray-800 w-14">{fmtTime(race.raceTime)}</span>
                <span className="text-sm text-gray-600 flex-1 min-w-[120px] truncate" title={race.name}>
                  {race.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {!s.isActive && <Badge text="INACTIVE" color="bg-red-100 text-red-700" />}
                  {s.suspended && <Badge text="SUSPENDED" color="bg-amber-100 text-amber-700" />}
                  {!s.isVisible && <Badge text="HIDDEN" color="bg-gray-200 text-gray-600" />}
                  {s.betLock && <Badge text="BET LOCK" color="bg-purple-100 text-purple-700" />}
                  {race.settings?.notice && <Badge text="NOTICE" color="bg-blue-100 text-blue-700" />}
                </div>
                <div className="flex items-center gap-2">
                  <Toggle label="Active" checked={s.isActive} loading={p("isActive")} onChange={(v) => toggleField(race, m.eventId, "isActive", v)} />
                  <Toggle label="Visible" checked={s.isVisible} loading={p("isVisible")} onChange={(v) => toggleField(race, m.eventId, "isVisible", v)} />
                  <Toggle label="Suspend" color="amber" checked={s.suspended} loading={p("suspended")} onChange={(v) => toggleField(race, m.eventId, "suspended", v)} />
                  <Toggle label="Lock" color="red" checked={s.betLock} loading={p("betLock")} onChange={(v) => toggleField(race, m.eventId, "betLock", v)} />
                  <button
                    onClick={() => setExpanded(open ? null : race.marketId)}
                    className="text-xs font-semibold text-[#1a3578] px-2 py-1 rounded hover:bg-[#1a3578]/5"
                  >
                    {open ? "Close" : "Limits"}
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-gray-200 px-3 py-3 bg-white rounded-b-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["betDelay", "minBet", "maxBet", "maxProfit"] as const).map((f) => (
                      <label key={f} className="text-xs font-medium text-gray-600">
                        {f === "betDelay" ? "Bet Delay (s)" : f === "minBet" ? "Min Bet" : f === "maxBet" ? "Max Bet" : "Max Profit"}
                        <input
                          type="number"
                          value={draftOf(race, f)}
                          onChange={(e) => setDraft(race.marketId, f, e.target.value)}
                          placeholder={f === "betDelay" ? "provider" : "none"}
                          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-800 focus:border-[#1a3578] focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-600">
                      Notice (shown to users)
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          maxLength={500}
                          value={draftOf(race, "notice")}
                          onChange={(e) => setDraft(race.marketId, "notice", e.target.value)}
                          placeholder="e.g. Bets void if non-runner"
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-800 focus:border-[#1a3578] focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            saveNotice.mutate({ marketId: race.marketId, eventId: m.eventId, notice: draftOf(race, "notice") })
                          }
                          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Save notice
                        </button>
                      </div>
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => saveNumbers(race, m.eventId)}
                      className="text-sm font-semibold px-4 py-1.5 rounded-md bg-[#1a3578] text-white hover:bg-[#142a5e]"
                    >
                      Save limits
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
