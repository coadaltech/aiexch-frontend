"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Trophy,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  useOwnerMatkaShifts,
  useDeleteMatkaShift,
  useSetMatkaResult,
} from "@/hooks/useOwner";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { TableSkeleton } from "@/components/owner/skeletons";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MatkaShiftModal } from "./shift-modal";
import { MatkaResultModal } from "./result-modal";

export default function OwnerMatkaPage() {
  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState<string>("");

  const { data: shifts = [], isLoading } = useOwnerMatkaShifts(
    dateFilter || undefined
  );
  const deleteMutation = useDeleteMatkaShift();
  const confirmDialog = useConfirm();

  // Modal states
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editShift, setEditShift] = useState<any>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultShift, setResultShift] = useState<any>(null);

  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: shifts,
    initialSort: { key: "shiftOrder", direction: "asc" },
  });

  const {
    items: paginatedShifts,
    totalPages,
    currentPage,
    goToPage,
  } = usePagination({
    data: sortedData,
    itemsPerPage: 15,
  });

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

  const handleSetResult = (shift: any) => {
    setResultShift(shift);
    setResultModalOpen(true);
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
            Matka Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage matka shifts, set results
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
            Matka Shifts {dateFilter && `- ${formatDate(dateFilter)}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {getSortIcon("name") === "asc" && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon("name") === "desc" && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("shiftDate")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {getSortIcon("shiftDate") === "asc" && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon("shiftDate") === "desc" && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    End Time
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Jantri Time
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                    Dara Rate
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                    Akhar Rate
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("shiftOrder")}
                  >
                    <div className="flex items-center gap-1">
                      Order
                      {getSortIcon("shiftOrder") === "asc" && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon("shiftOrder") === "desc" && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Result
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={10} />
              ) : paginatedShifts.length > 0 ? (
                <tbody>
                  {paginatedShifts.map((shift: any) => (
                    <tr key={shift.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <span className="font-medium text-foreground text-sm">
                          {shift.name}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {formatDate(shift.shiftDate)}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {shift.endTime}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {shift.mainJantriTime || "-"}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground hidden md:table-cell">
                        {shift.daraRate} ({shift.daraCommission}%)
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground hidden md:table-cell">
                        {shift.akharRate} ({shift.akharCommission}%)
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {shift.shiftOrder}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={shift.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {shift.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {shift.result !== null && shift.result !== undefined ? (
                          <Badge className="bg-amber-600 text-white text-xs">
                            {shift.result}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetResult(shift)}
                            title="Set Result"
                            className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
                          >
                            <Trophy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(shift)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            <Edit className="h-3 w-3" />
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
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No shifts found.{" "}
                      {dateFilter
                        ? "Try a different date or clear the filter."
                        : 'Click "Create Shift" to add one.'}
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MatkaShiftModal
        open={shiftModalOpen}
        onClose={() => {
          setShiftModalOpen(false);
          setEditShift(null);
        }}
        shift={editShift}
      />

      <MatkaResultModal
        open={resultModalOpen}
        onClose={() => {
          setResultModalOpen(false);
          setResultShift(null);
        }}
        shift={resultShift}
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
