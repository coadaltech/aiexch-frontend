"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { useCreateMatkaShift, useUpdateMatkaShift } from "@/hooks/useOwner";

interface Props {
  open: boolean;
  onClose: () => void;
  shift?: any;
}

export function MatkaShiftModal({ open, onClose, shift }: Props) {
  const isEdit = !!shift;
  const createMutation = useCreateMatkaShift();
  const updateMutation = useUpdateMatkaShift();

  const [form, setForm] = useState({
    name: "",
    shiftDate: new Date().toISOString().split("T")[0],
    endTime: "14:00",
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
        daraRate: Math.min(Number(shift.daraRate) || 100, 100),
        daraCommission: Number(shift.daraCommission) || 0,
        akharRate: Math.min(Number(shift.akharRate) || 10, 10),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit Shift" : "Create Shift"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Shift Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. DELHI NOON, HYDERABAD, GALI"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={form.shiftDate}
                onChange={(e) => setForm({ ...form, shiftDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                End Time *
              </label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Main Jantri Time
            </label>
            <Input
              type="time"
              value={form.mainJantriTime}
              onChange={(e) =>
                setForm({ ...form, mainJantriTime: e.target.value })
              }
              placeholder="Betting closes at this time"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Dara Rate (max 100)
              </label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={form.daraRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setForm({ ...form, daraRate: val > 100 ? 100 : val });
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Dara Commission %
              </label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Akhar Rate (max 10)
              </label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={10}
                value={form.akharRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setForm({ ...form, akharRate: val > 10 ? 10 : val });
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Akhar Commission %
              </label>
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

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Capping (User Bet Limit per Shift)
            </label>
            <Input
              type="number"
              min={0}
              value={form.capping}
              onChange={(e) =>
                setForm({ ...form, capping: Number(e.target.value) })
              }
              placeholder="e.g. 2000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum amount a user can bet on this shift. 0 = no limit.
            </p>
          </div>

          <div className="flex items-center gap-6">
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
          <p className="text-xs text-muted-foreground -mt-2">
            Next Day Allow: If end time is 3:00 AM and checked, shift runs until tomorrow 3:00 AM.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
