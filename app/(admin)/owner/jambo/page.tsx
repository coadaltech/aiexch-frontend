"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  useOwnerJamboShifts,
  useDeleteJamboShift,
  useReorderJamboShifts,
} from "@/hooks/useOwner";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { JamboShiftModal } from "./shift-modal";

export default function OwnerJamboPage() {
  const [dateFilter, setDateFilter] = useState<string>("");

  const { data: shifts = [], isLoading } = useOwnerJamboShifts(
    dateFilter || undefined
  );
  const deleteMutation = useDeleteJamboShift();
  const reorderMutation = useReorderJamboShifts();
  const confirmDialog = useConfirm();

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editShift, setEditShift] = useState<any>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const sortedShifts = [...shifts].sort(
    (a: any, b: any) => (a.shiftOrder ?? 0) - (b.shiftOrder ?? 0)
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragNode.current = e.target as HTMLDivElement;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const reordered = [...sortedShifts];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      const orders = reordered.map((s: any, i: number) => ({
        id: s.id,
        shiftOrder: i + 1,
      }));
      reorderMutation.mutate(orders);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNode.current = null;
  }, [dragIndex, dragOverIndex, sortedShifts, reorderMutation]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleCreate = () => {
    setEditShift(null);
    setShiftModalOpen(true);
  };

  const handleEdit = (shift: any) => {
    setEditShift(shift);
    setShiftModalOpen(true);
  };

  const handleDelete = (id: string) => {
    confirmDialog.confirm(
      "Delete Shift",
      "Are you sure you want to delete this shift? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Jambo Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage jambo shifts (numbers 001-1000)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Filter by date"
          />
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Shift
          </Button>
        </div>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Jambo Shifts {dateFilter && `- ${formatDate(dateFilter)}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sortedShifts.length > 0 ? (
            <div className="space-y-3">
              {sortedShifts.map((shift: any, index: number) => (
                <div
                  key={shift.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={handleDragLeave}
                  className={`rounded-xl border p-4 transition-all cursor-grab active:cursor-grabbing ${
                    dragOverIndex === index && dragIndex !== index
                      ? "border-primary bg-primary/5 border-dashed"
                      : "border-border bg-card hover:bg-accent/5"
                  } ${dragIndex === index ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground shrink-0 cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {shift.shiftOrder ?? index + 1}
                    </div>
                    <span className="font-semibold text-foreground text-sm uppercase">
                      {shift.name}
                    </span>
                    <div className="flex items-center gap-1.5 ml-1">
                      <Badge
                        variant={shift.isActive ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {shift.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {shift.nextDayAllow && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-blue-500 text-blue-500"
                        >
                          Next Day
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(shift)}
                        title="Edit"
                        className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(shift.id)}
                        title="Delete"
                        className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2.5 ml-[60px] text-xs flex-wrap">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-muted-foreground">Date</span>
                        <span className="ml-1.5 text-foreground font-medium">{formatDate(shift.shiftDate)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End</span>
                        <span className="ml-1.5 text-foreground font-medium">{shift.endTime}</span>
                      </div>
                      {shift.mainJantriTime && (
                        <div>
                          <span className="text-muted-foreground">Jantri</span>
                          <span className="ml-1.5 text-foreground font-medium">{shift.mainJantriTime}</span>
                        </div>
                      )}
                    </div>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-muted-foreground">Triple</span>
                        <span className="ml-1.5 text-foreground font-medium">{shift.daraRate}</span>
                        <span className="text-muted-foreground ml-0.5">({shift.daraCommission}%)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Akhar</span>
                        <span className="ml-1.5 text-foreground font-medium">{shift.akharRate}</span>
                        <span className="text-muted-foreground ml-0.5">({shift.akharCommission}%)</span>
                      </div>
                      {Number(shift.capping) > 0 && (
                        <div>
                          <span className="text-muted-foreground">Cap</span>
                          <span className="ml-1.5 text-foreground font-medium">₹{shift.capping}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No shifts found.{" "}
              {dateFilter
                ? "Try a different date or clear the filter."
                : 'Click "Create Shift" to add one.'}
            </div>
          )}
        </CardContent>
      </Card>

      <JamboShiftModal
        open={shiftModalOpen}
        onClose={() => {
          setShiftModalOpen(false);
          setEditShift(null);
        }}
        shift={editShift}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.config?.title || ""}
        message={confirmDialog.config?.message || ""}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
    </div>
  );
}
