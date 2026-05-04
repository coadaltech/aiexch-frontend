"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import {
  useCreateKalyanNewShift,
  useUpdateKalyanNewShift,
} from "@/hooks/useOwner";

interface Props {
  open: boolean;
  onClose: () => void;
  shift?: any;
}

// Kalyan-New rate buckets:
//   Single Pana → singlePanaRate    (NEW column)
//   Double Pana → doublePanaRate    (NEW column)
//   Triple Pana → tripleRate        (existing, shared with Jambo)
//   Jodi        → daraRate          (existing)
//   Akhar       → akharRate         (existing)
//   Sangam      → sangamRate        (NEW column)
// Plus closingTime: second result time of the day (Kalyan-New only).
export function KalyanNewShiftModal({ open, onClose, shift }: Props) {
  const isEdit = !!shift;
  const createMutation = useCreateKalyanNewShift();
  const updateMutation = useUpdateKalyanNewShift();

  const empty = {
    name: "",
    shiftDate: new Date().toISOString().split("T")[0],
    endTime: "14:00",
    singlePanaRate: 150,
    singlePanaCommission: 0,
    doublePanaRate: 300,
    doublePanaCommission: 0,
    tripleRate: 1000,
    tripleCommission: 0,
    daraRate: 100,
    daraCommission: 0,
    akharRate: 10,
    akharCommission: 0,
    sangamRate: 1500,
    sangamCommission: 0,
    mainJantriTime: "",
    closingTime: "",
    isActive: true,
    nextDayAllow: false,
    capping: 0,
  };

  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (shift) {
      setForm({
        name: shift.name || "",
        shiftDate: shift.shiftDate || new Date().toISOString().split("T")[0],
        endTime: shift.endTime || "14:00",
        singlePanaRate: Number(shift.singlePanaRate) || 150,
        singlePanaCommission: Number(shift.singlePanaCommission) || 0,
        doublePanaRate: Number(shift.doublePanaRate) || 300,
        doublePanaCommission: Number(shift.doublePanaCommission) || 0,
        tripleRate: Number(shift.tripleRate) || 1000,
        tripleCommission: Number(shift.tripleCommission) || 0,
        daraRate: Number(shift.daraRate) || 100,
        daraCommission: Number(shift.daraCommission) || 0,
        akharRate: Number(shift.akharRate) || 10,
        akharCommission: Number(shift.akharCommission) || 0,
        sangamRate: Number(shift.sangamRate) || 1500,
        sangamCommission: Number(shift.sangamCommission) || 0,
        mainJantriTime: shift.mainJantriTime || "",
        closingTime: shift.closingTime || "",
        isActive: shift.isActive ?? true,
        nextDayAllow: shift.nextDayAllow ?? false,
        capping: Number(shift.capping) || 0,
      });
    } else {
      setForm(empty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: shift.id, ...form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  const L = "text-sm font-medium text-foreground block mb-1";

  const rateBuckets: Array<{
    label: string;
    hint: string;
    rateKey: keyof typeof form;
    commKey: keyof typeof form;
  }> = [
    { label: "Single Pana", hint: "default 150", rateKey: "singlePanaRate", commKey: "singlePanaCommission" },
    { label: "Double Pana", hint: "default 300", rateKey: "doublePanaRate", commKey: "doublePanaCommission" },
    { label: "Triple Pana", hint: "default 1000", rateKey: "tripleRate", commKey: "tripleCommission" },
    { label: "Jodi", hint: "default 100", rateKey: "daraRate", commKey: "daraCommission" },
    { label: "Akhar", hint: "default 10", rateKey: "akharRate", commKey: "akharCommission" },
    { label: "Sangam", hint: "default 1500", rateKey: "sangamRate", commKey: "sangamCommission" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit Kalyan-New Shift" : "Create Kalyan-New Shift"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: name + date + end time */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className={L}>Shift Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. KALYAN MORNING, KALYAN EVENING"
                required
              />
            </div>
            <div>
              <label className={L}>Date *</label>
              <Input
                type="date"
                value={form.shiftDate}
                onChange={(e) => setForm({ ...form, shiftDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={L}>End Time *</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Row 2: opening time + closing time + capping */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className={L}>Opening Time</label>
              <Input
                type="time"
                value={form.mainJantriTime}
                onChange={(e) =>
                  setForm({ ...form, mainJantriTime: e.target.value })
                }
                placeholder="First result"
              />
            </div>
            <div>
              <label className={L}>Closing Time</label>
              <Input
                type="time"
                value={form.closingTime}
                onChange={(e) =>
                  setForm({ ...form, closingTime: e.target.value })
                }
                placeholder="Second result"
              />
            </div>
            <div>
              <label className={L}>Capping (per number)</label>
              <Input
                type="number"
                min={0}
                value={form.capping}
                onChange={(e) =>
                  setForm({ ...form, capping: Number(e.target.value) })
                }
                placeholder="0 = no limit"
              />
            </div>
            <div className="flex flex-col gap-2 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.nextDayAllow}
                  onChange={(e) =>
                    setForm({ ...form, nextDayAllow: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">
                  Next Day Allow
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">
                  Active
                </span>
              </label>
            </div>
          </div>

          {/* Rates grid — 6 buckets */}
          <div className="border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Rates &amp; Commissions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rateBuckets.map((b) => (
                <div key={b.label} className="space-y-2">
                  <div className="text-sm font-semibold text-primary">
                    {b.label}
                    <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                      ({b.hint})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={L}>Rate</label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={form[b.rateKey] as number}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [b.rateKey]: Number(e.target.value),
                          } as typeof form)
                        }
                      />
                    </div>
                    <div>
                      <label className={L}>Commission %</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form[b.commKey] as number}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [b.commKey]: Number(e.target.value),
                          } as typeof form)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update Shift" : "Create Shift"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
