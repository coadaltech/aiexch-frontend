"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { useCreateJamboShift, useUpdateJamboShift } from "@/hooks/useOwner";

interface Props {
  open: boolean;
  onClose: () => void;
  shift?: any;
}

export function JamboShiftModal({ open, onClose, shift }: Props) {
  const isEdit = !!shift;
  const createMutation = useCreateJamboShift();
  const updateMutation = useUpdateJamboShift();

  // Jambo rate mapping:
  //   tripleRate → number_type 0   (default 1000)
  //   daraRate   → number_type 1,2 (jodi, default 100)
  //   akharRate  → number_type 3-5 (akhar, default 10)
  const [form, setForm] = useState({
    name: "",
    shiftDate: new Date().toISOString().split("T")[0],
    endTime: "14:00",
    tripleRate: 1000,
    tripleCommission: 0,
    daraRate: 100,
    daraCommission: 0,
    akharRate: 10,
    akharCommission: 0,
    mainJantriTime: "",
    isActive: true,
    nextDayAllow: false,
    capping: 0,
  });

  useEffect(() => {
    if (shift) {
      setForm({
        name: shift.name || "",
        shiftDate: shift.shiftDate || new Date().toISOString().split("T")[0],
        endTime: shift.endTime || "14:00",
        tripleRate: Number(shift.tripleRate) || 1000,
        tripleCommission: Number(shift.tripleCommission) || 0,
        daraRate: Number(shift.daraRate) || 100,
        daraCommission: Number(shift.daraCommission) || 0,
        akharRate: Number(shift.akharRate) || 10,
        akharCommission: Number(shift.akharCommission) || 0,
        mainJantriTime: shift.mainJantriTime || "",
        isActive: shift.isActive ?? true,
        nextDayAllow: shift.nextDayAllow ?? false,
        capping: Number(shift.capping) || 0,
      });
    } else {
      setForm({
        name: "",
        shiftDate: new Date().toISOString().split("T")[0],
        endTime: "14:00",
        tripleRate: 1000,
        tripleCommission: 0,
        daraRate: 100,
        daraCommission: 0,
        akharRate: 10,
        akharCommission: 0,
        mainJantriTime: "",
        isActive: true,
        nextDayAllow: false,
        capping: 0,
      });
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit Jambo Shift" : "Create Jambo Shift"}
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
                placeholder="e.g. JAMBO MORNING, JAMBO EVENING"
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

          {/* Row 2: jantri time + capping + flags */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className={L}>Main Jantri Time</label>
              <Input
                type="time"
                value={form.mainJantriTime}
                onChange={(e) =>
                  setForm({ ...form, mainJantriTime: e.target.value })
                }
                placeholder="Betting cutoff"
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
            <label className="flex items-center gap-2 cursor-pointer pb-2">
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
            <label className="flex items-center gap-2 cursor-pointer pb-2">
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

          {/* Rates grid — 3 rate buckets side-by-side (rate + commission each). */}
          <div className="border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Rates &amp; Commissions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Triple — number_type 0 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-primary">
                  Triple
                  <span className="text-muted-foreground font-normal ml-1.5 text-xs">(type 0 · default 1000)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={L}>Rate</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.tripleRate}
                      onChange={(e) =>
                        setForm({ ...form, tripleRate: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className={L}>Commission %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.tripleCommission}
                      onChange={(e) =>
                        setForm({ ...form, tripleCommission: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Jodi — number_type 1, 2 (stored in dara_* cols) */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-primary">
                  Jodi
                  <span className="text-muted-foreground font-normal ml-1.5 text-xs">(types 1, 2 · default 100)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={L}>Rate</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.daraRate}
                      onChange={(e) =>
                        setForm({ ...form, daraRate: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className={L}>Commission %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.daraCommission}
                      onChange={(e) =>
                        setForm({ ...form, daraCommission: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Akhar — number_type 3, 4, 5 */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-primary">
                  Akhar
                  <span className="text-muted-foreground font-normal ml-1.5 text-xs">(types 3, 4, 5 · default 10)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={L}>Rate</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.akharRate}
                      onChange={(e) =>
                        setForm({ ...form, akharRate: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className={L}>Commission %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.akharCommission}
                      onChange={(e) =>
                        setForm({ ...form, akharCommission: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
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
